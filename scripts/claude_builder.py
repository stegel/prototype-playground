import anthropic
import argparse
import json
import os
from pathlib import Path

EXCLUDED_DIRS = {
    ".git", "node_modules", "__pycache__", ".next", "dist", "build",
    ".venv", "venv", "coverage", ".turbo", ".cache", "prototypes-repo",
    "public", ".claude"
}
EXCLUDED_EXTENSIONS = {
    ".lock", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
    ".woff", ".woff2", ".ttf", ".eot", ".map"
}
MAX_FILE_SIZE = 50_000


def build_repo_context(root: Path) -> str:
    parts = []
    for path in sorted(root.rglob("*")):
        if any(ex in path.parts for ex in EXCLUDED_DIRS):
            continue
        if path.suffix in EXCLUDED_EXTENSIONS:
            continue
        if not path.is_file():
            continue
        if path.stat().st_size > MAX_FILE_SIZE:
            continue
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
            parts.append(f"### {path.relative_to(root)}\n{content}")
        except Exception:
            pass
    return "\n\n".join(parts)


def load_claude_md(root: Path) -> str:
    claude_md = root / "CLAUDE.md"
    if claude_md.exists():
        return claude_md.read_text(encoding="utf-8")
    return ""


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
    parser.add_argument("--notes", default="")
    parser.add_argument("--notion-id", required=True)
    args = parser.parse_args()

    root = Path(".")
    claude_md = load_claude_md(root)
    repo_context = build_repo_context(root)

    if claude_md:
        print("✓ Loaded CLAUDE.md project brief")
    print(f"✓ Built context: {len(repo_context):,} chars")

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    prompt = f"""You are an expert software engineer working on the following project:

{claude_md}

---

Your job is to implement the feature request below by modifying or creating files.

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
- Follow all rules listed in the project brief above
- Do not modify workflow files or scripts/claude_builder.py

---
FEATURE REQUEST: {args.description}
{f"DETAILS: {args.notes}" if args.notes else ""}
NOTION ID: {args.notion_id}

---
CODEBASE:
{repo_context}
"""

    print(f"✓ Sending to Claude (prompt: {len(prompt):,} chars)...")

    raw = ""
    with client.messages.stream(
        model="claude-opus-4-5",
        max_tokens=32000,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            raw += text
        final_message = stream.get_final_message()

    if final_message.stop_reason == "max_tokens":
        raise RuntimeError(
            "Claude's response was truncated (max_tokens reached). "
            "Try breaking the feature into smaller tasks."
        )

    print(f"✓ Claude responded (stop_reason: {final_message.stop_reason})")

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
