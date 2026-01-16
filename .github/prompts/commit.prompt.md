---
agent: 'agent'
description: 'Create atomic commit with conventional prefix'
---

# Create Atomic Commit with Conventional Prefix

## First: Get Input

**Ask the user**: "Which files should I include in this commit? (Leave empty to include all relevant changes)"

Store their response as `FILES_TO_COMMIT`.

---

## Context

Run these commands to understand current state:
- `git status --porcelain` - See all changes
- `git diff --cached --stat` - See staged changes
- `git diff --stat` - See unstaged changes

## Task

Create an atomic commit for changes.

Files to include: Use `FILES_TO_COMMIT` from user input (if empty, include all relevant changes)

1. Stage files with `git add`
2. Write commit message:
   - Conventional prefix: feat|fix|docs|refactor|test|chore
   - Concise "why" not "what"
   - No emoji, no AI attribution
3. Commit with `git commit -m "..."`
