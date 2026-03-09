import anthropic
import argparse
import json
import os
from pathlib import Path

EXCLUDED_DIRS = {".git", "node_modules", "__pycache__", ".next", "dist", "build", ".venv"}
MAX_FILE_SIZE = 50_000  # bytes — skip large files

def build_repo_context(root: Path) -> str:
    parts = []
    for path in sorted(root.rglob("*")):
        if any(ex in path.parts for ex in EXCLUDED_DIRS):
            continue
        if path.is_file() and path.stat().st_size < MAX_FILE_SIZE:
            try:
                content = path.read_text(encoding="utf-8", errors="ignore")
                parts.append(f"### {path.relative_to(root)}\n{content}")
            except Exception:
                pass
    return "\n\n".join(parts)

def apply_changes(changes: list[dict], root: Path):
    for change in changes:
        file_path = root / change["path"]
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
    repo_context = build_repo_context(root)

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

Always include complete file contents — never partial diffs or snippets.
Match the existing code style exactly.

---
FEATURE REQUEST: {args.description}
NOTION ID: {args.notion_id}

---
CODEBASE:
{repo_context}
"""

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=8192,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    result = json.loads(raw)

    apply_changes(result["files"], root)
    print(f"✓ {result['summary']}")
    print(f"✓ Modified {len(result['files'])} file(s)")

if __name__ == "__main__":
    main()