# Create a Pull Request for Current Branch

## First: Get Input

**Ask the user**: "What base branch should I create the PR against? (Default: main)"

Store their response as `BASE_BRANCH`. If empty, use `main`.

---

## Context

Run these commands to understand current state:
- `git branch --show-current` - Current branch
- `git log --oneline $(git merge-base HEAD origin/main)..HEAD` - Commits to include
- `git status -sb | head -1` - Unpushed commits
- `git diff --name-only $(git merge-base HEAD origin/main)..HEAD` - Changed files

## Process

1. **VERIFY branch state**
   - Confirm not on main/master
   - Check for uncommitted changes
   - Ensure branch is pushed to remote

2. **ANALYZE all commits**
   - Review every commit since branch diverged from base
   - Identify the type of change (feat/fix/refactor/docs/chore)
   - Extract key changes and their purpose

3. **GENERATE PR content**
   - Title: `<type>: <concise description>`
   - Summary: 2-4 bullet points of what changed
   - Test plan: How to verify the changes work

4. **CREATE PR using gh CLI**
   ```bash
   gh pr create --base <BASE_BRANCH> --title "<title>" --body "$(cat <<'EOF'
   ## Summary
   - <bullet 1>
   - <bullet 2>

   ## Test plan
   - [ ] <verification step 1>
   - [ ] <verification step 2>
   EOF
   )"
   ```

5. **REPORT PR URL** to user

## Success Criteria
- PR created with descriptive title matching commit type
- Summary accurately reflects ALL commits (not just the latest)
- Test plan includes actionable verification steps
- PR URL returned to user
