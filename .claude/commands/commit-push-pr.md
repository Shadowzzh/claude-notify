---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*), Bash(git log:*), Bash(gh pr create:*), Bash(git rev-parse:*)
description: Commit, push, and open a PR
---

## Context

- Current git status: !`git status`
- Current branch: !`git branch --show-current 2>/dev/null || echo "No branch yet"`
- Has commits: !`git rev-parse HEAD >/dev/null 2>&1 && echo "yes" || echo "no"`

## Your task

1. First check if this is a new repository (no commits yet)
2. Stage all changes with `git add -A`
3. If there are no previous commits, create an initial commit
4. If there are previous commits:
   - Run `git diff HEAD` to see the changes
   - Create a descriptive commit message based on the diff
5. Commit the changes
6. Push the branch to origin (use `git push -u origin <branch>` for first push)
7. Create a pull request using `gh pr create` with:
   - A clear title summarizing the changes
   - A detailed description of what was changed and why

Handle edge cases gracefully:
- New repo with no commits: create initial commit first
- No remote configured: inform the user
- Branch doesn't exist on remote: use `git push -u origin <branch>`