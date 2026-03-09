import anthropic
import argparse
import json
import os
from pathlib import Path

# Files to always exclude
EXCLUDED_DIRS = {
    ".git", "node_modules", "__pycache__", ".next", "dist", "build",
    ".venv", "venv", "coverage", ".turbo", ".cache"
}
EXCLUDED_EXTENSIONS = {
    ".lock", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
    ".woff", ".woff2", ".ttf", ".eot", ".map"
}

# Token budget (claude-opus context is 200k, leave room for response)
MAX_CONTEXT_CHARS = 600_000
MAX_FILE_SIZE = 50_000

# Entry point filenames to prioritize (checked in order)
ENTRY_POINT_NAMES = [
    "index.ts", "index.tsx", "index.js", "index.jsx",
    "main.ts", "main.tsx", "main.js", "app.ts", "app.tsx",
    "App.tsx", "App.jsx", "server.ts", "server.js",
    "package.json", "README.md",
]


def load_claude_context_config(root: Path) -> dict:
    """
    Load .claude-context config file if present.
    Format:
        {
          "priority_dirs": ["src", "components"],
          "exclude_dirs": ["legacy", "archive"],
          "notes": "This is a Next.js app. Main entry is src/app/page.tsx."
        }
    """
    config_path = root / ".claude-context"
    if config_path.exists():
        try:
            return json.loads(config_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def collect_files(root: Path, config: dict) -> list[Path]:
    """Collect all candidate files, respecting exclusions from config."""
    extra_excludes = set(config.get("exclude_dirs", []))
    all_excludes = EXCLUDED_DIRS | extra_excludes

    files = []
    for path in sorted(root.rglob("*")):
        if any(ex in path.parts for ex in all_excludes):
            continue
        if path.suffix in EXCLUDED_EXTENSIONS:
            continue
        if not path.is_file():
            continue
        if path.stat().st_size > MAX_FILE_SIZE:
            continue
        files.append(path)
    return files


def prioritize_files(files: list[Path], root: Path, config: dict) -> list[Path]:
    """
    Sort files so the most relevant ones come first:
    1. Priority dirs from .claude-context
    2. Entry point files by name
    3. Shallow files (closer to root) before deeply nested ones
    4. Everything else alphabetically
    """
    priority_dirs = [root / d for d in config.get("priority_dirs", [])]

    def sort_key(path: Path):
        rel = path.relative_to(root)
        parts = rel.parts

        # Tier 1: in a priority dir
        in_priority = any(
            str(rel).startswith(str(d.relative_to(root)))
            for d in priority_dirs
        )

        # Tier 2: is an entry point file
        is_entry = path.name in ENTRY_POINT_NAMES

        # Tier 3: depth (shallower = better)
        depth = len(parts)

        return (not in_priority, not is_entry, depth, str(rel))

    return sorted(files, key=sort_key)


def build_repo_context(root: Path, config: dict) -> tuple[str, list[str]]:
    """
    Build repo context string within the token budget.
    Returns (context_string, list_of_included_file_paths).
    """
    files = collect_files(root, config)
    files = prioritize_files(files, root, config)

    parts = []
    included = []
    total_chars = 0

    # Prepend any notes from .claude-context
    notes = config.get("notes", "")
    if notes:
        header = f"# Project Notes\n{notes}\n"
        parts.append(header)
        total_chars += len(header)

    for path in files:
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        rel = str(path.relative_to(root))
        entry = f"### {rel}\n{content}"

        if total_chars + len(entry) > MAX_CONTEXT_CHARS:
            print(f"⚠ Context budget reached — omitting {rel} and subsequent files")
            break

        parts.append(entry)
        included.append(rel)
        total_chars += len(entry)

    return "\n\n".join(parts), included


def apply_changes(changes: list[dict], root: Path):
    for change in changes:
        file_path = root / change["path"]
        print(f"  → {change['action']}: {change['path']}")
        if change["action"] in ("create", "modify"):
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(change["content"], encoding="utf-8")
        elif change["action"] == "delete":
            file_path.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--description", required=True)
    parser.add_argument("--notion-id", required=True)
    args = parser.parse_args()

    root = Path(".")
    config = load_claude_context_config(root)

    if config:
        print(f"✓ Loaded .claude-context config")
        if config.get("priority_dirs"):
            print(f"  Priority dirs: {config['priority_dirs']}")
        if config.get("exclude_dirs"):
            print(f"  Excluded dirs: {config['exclude_dirs']}")

    repo_context, included_files = build_repo_context(root, config)
    print(f"✓ Built context: {len(included_files)} files, {len(repo_context):,} chars")

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    prompt = f"""You are an expert software engineer. You will be given a codebase and a feature request.
Your job is to implement the feature by modifying or creating files.

Respond ONLY with valid JSON. No explanation, no markdown fences. The JSON must have this shape:
{{
  "files": [
    {{
      "path": "relative/path/to/file.ext",
      "action": "create" | "modify" | "delete",
      "content": "complete file content here"
    }}
  ],
  "summary": "one sentence describing what you did"
}}

Rules:
- Always include complete file contents — never partial diffs or snippets
- Match the existing code style exactly
- Only modify files that are necessary for the feature
- Do not modify .claude-context, workflow files, or scripts/claude_builder.py

---
FEATURE REQUEST: {args.description}
NOTION ID: {args.notion_id}

---
CODEBASE:
{repo_context}
"""

    print(f"✓ Sending to Claude (prompt: {len(prompt):,} chars)...")
    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=8192,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    print(f"✓ Claude responded (stop_reason: {message.stop_reason})")

    # Strip markdown fences if Claude added them despite instructions
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"✗ JSON parse failed: {e}")
        print(f"Raw response: {raw[:1000]}")
        raise

    apply_changes(result["files"], root)
    print(f"✓ {result['summary']}")
    print(f"✓ Modified {len(result['files'])} file(s)")


if __name__ == "__main__":
    main()
