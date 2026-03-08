---
allowed-tools: Bash(git checkout:*), Bash(git checkout -b:*), Bash(git add:*), Bash(git status:*), Bash(git push:*), Bash(git commit:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(gh pr create:*), Bash(gh pr view:*), mcp__plugin_Notion_notion__notion-search, mcp__plugin_Notion_notion__notion-update-page, mcp__plugin_Notion_notion__notion-create-comment
description: Commit, push, open a PR, then update the linked Notion feature request with PR details
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits on branch: !`git log main..HEAD --oneline 2>/dev/null || git log -5 --oneline`

## Your task

Based on the above changes:

1. Create a new branch if on main (use `git checkout -b feature/<slug>`)
2. Create a single commit with an appropriate message
3. Push the branch to origin
4. Create a pull request using `gh pr create`
5. After the PR is created, get the PR URL and title using `gh pr view --json url,title`
6. Search Notion for the feature request page that matches this work (use branch name, PR title, or commit message as search keywords)
7. If a matching Notion page is found:
   a. Update the page status/state to reflect the PR is ready for review (e.g., "In Review" or similar)
   b. Post a comment on the Notion page with the PR details in this format:
      > PR: [PR title](PR URL)
8. You have the capability to call multiple tools in a single response. Do all git operations in a single message. Do not use any other tools or do anything else outside of what is listed above.
