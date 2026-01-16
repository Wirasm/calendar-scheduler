---
agent: 'agent'
description: 'Comprehensive PR code review - checks diff, patterns, runs validation, comments on PR'
---

# PR Code Review

## First: Get Input

**Ask the user**: "Which PR would you like me to review?

Please provide:
1. PR number (e.g., `123` or `#123`) OR PR URL OR branch name
2. Optional: `--approve` to approve if clean, or `--request-changes` to request changes if issues found"

Store the PR identifier as `PR_INPUT` and any flags as `REVIEW_FLAGS`.

---

## Your Mission

Perform a thorough, senior-engineer-level code review:

1. **Understand** what the PR is trying to accomplish
2. **Check** the code against project patterns and constraints
3. **Run** all validation (type-check, lint, tests, build)
4. **Identify** issues by severity
5. **Report** findings as PR comment AND local file

**Golden Rule**: Be constructive and actionable. Every issue should have a clear recommendation. Acknowledge good work too.

---

## Phase 1: FETCH - Get PR Context

### 1.1 Parse Input

**Determine input type:**

| Input Format | Action |
|--------------|--------|
| Number (`123`, `#123`) | Use as PR number |
| URL (`https://github.com/.../pull/123`) | Extract PR number |
| Branch name (`feature-x`) | Find associated PR |

```bash
# If branch name provided, find PR
gh pr list --head {branch-name} --json number -q '.[0].number'
```

### 1.2 Get PR Metadata

```bash
# Get comprehensive PR details
gh pr view {NUMBER} --json number,title,body,author,headRefName,baseRefName,state,additions,deletions,changedFiles,files,reviews,comments

# Get the diff
gh pr diff {NUMBER}

# List changed files
gh pr diff {NUMBER} --name-only
```

**Extract:**
- PR number, title, description
- Author
- Base and head branches
- Files changed with line counts
- Existing review comments

### 1.3 Checkout PR Branch

```bash
# Fetch and checkout the PR branch
gh pr checkout {NUMBER}
```

### 1.4 Validate PR State

| State | Action |
|-------|--------|
| `MERGED` | STOP: "PR already merged. Nothing to review." |
| `CLOSED` | WARN: "PR is closed. Review anyway? (historical analysis)" |
| `DRAFT` | NOTE: "Draft PR - focusing on direction, not polish" |
| `OPEN` | PROCEED with full review |

**PHASE_1_CHECKPOINT:**
- [ ] PR number identified
- [ ] PR metadata fetched
- [ ] PR branch checked out
- [ ] PR state is reviewable

---

## Phase 2: CONTEXT - Understand the Change

### 2.1 Read Project Rules

Read and internalize:
- `CLAUDE.md` - Project conventions
- Any additional reference docs in `.github/docs/` or `docs/`

**Extract key constraints:**
- Type safety requirements
- Code style rules
- Testing requirements
- Architecture patterns

### 2.2 Understand PR Intent

From PR title and description:
- What problem does this solve?
- What approach was taken?
- Are there notes from the author?

### 2.3 Analyze Changed Files

For each changed file, determine:
- What type of file? (service, handler, util, test, config)
- What existing patterns should it follow?
- Scope of change? (new file, modification, deletion)

**PHASE_2_CHECKPOINT:**
- [ ] Project rules read and understood
- [ ] PR intent understood
- [ ] Changed files categorized

---

## Phase 3: REVIEW - Analyze the Code

### 3.1 Read Each Changed File

For each file in the diff:

1. **Read the full file** (not just diff) to understand context
2. **Read similar files** to understand expected patterns
3. **Check specific changes** against patterns

### 3.2 Review Checklist

**For EVERY changed file, check:**

#### Correctness
- [ ] Does the code do what the PR claims?
- [ ] Are there logic errors?
- [ ] Are edge cases handled?
- [ ] Is error handling appropriate?

#### Type Safety
- [ ] Are all types explicit (no implicit `any`)?
- [ ] Are return types declared?
- [ ] Are interfaces used appropriately?

#### Pattern Compliance
- [ ] Does it follow existing patterns in the codebase?
- [ ] Is naming consistent with project conventions?
- [ ] Is file organization correct?

#### Security
- [ ] Any user input without validation?
- [ ] Any secrets that could be exposed?
- [ ] Any injection vulnerabilities?

#### Performance
- [ ] Any obvious N+1 queries or loops?
- [ ] Any unnecessary async/await?
- [ ] Any memory leaks?

#### Completeness
- [ ] Are there tests for new code?
- [ ] Is documentation updated if needed?
- [ ] Are all TODOs addressed?

### 3.3 Categorize Issues

**Issue Severity Levels:**

| Level | Criteria | Examples |
|-------|----------|----------|
| Critical | Blocking - must fix | Security vulnerabilities, data loss potential, crashes |
| High | Should fix before merge | Type safety violations, missing error handling, logic errors |
| Medium | Should consider | Pattern inconsistencies, missing edge cases |
| Low | Suggestions | Style preferences, minor optimizations |

**PHASE_3_CHECKPOINT:**
- [ ] All changed files reviewed
- [ ] Issues categorized by severity
- [ ] Positive aspects noted

---

## Phase 4: VALIDATE - Run Automated Checks

### 4.1 Run Validation Suite

```bash
# Type checking
bun run lint && npx tsc --noEmit

# Tests
bun test

# Build
bun run build
```

**Capture for each:**
- Pass/fail status
- Error count
- Warning count
- Any specific failures

**PHASE_4_CHECKPOINT:**
- [ ] Type check executed
- [ ] Lint executed
- [ ] Tests executed
- [ ] Build executed
- [ ] Results captured

---

## Phase 5: DECIDE - Form Recommendation

### 5.1 Decision Logic

**APPROVE** if:
- No critical or high issues
- All validation passes
- Code follows patterns
- Changes match PR intent

**REQUEST CHANGES** if:
- High priority issues exist
- Validation fails but is fixable
- Pattern violations that need addressing

**BLOCK** if:
- Critical security or data issues
- Fundamental approach is wrong
- Major architectural concerns

**PHASE_5_CHECKPOINT:**
- [ ] Recommendation determined
- [ ] Rationale clear

---

## Phase 6: REPORT - Generate Review

### 6.1 Create Report Directory

```bash
mkdir -p .agents/reviews
```

### 6.2 Generate Report File

**Path**: `.agents/reviews/pr-{NUMBER}-review.md`

```markdown
# PR Review: #{NUMBER} - {TITLE}

**Author**: @{author}
**Branch**: {head} -> {base}
**Files Changed**: {count} (+{additions}/-{deletions})
**Reviewed**: {timestamp}
**Recommendation**: {APPROVE/REQUEST CHANGES/BLOCK}

---

## Summary

{2-3 sentences: What this PR does and overall assessment}

---

## Changes Overview

| File | Changes | Assessment |
|------|---------|------------|
| `{path/to/file.ts}` | +{N}/-{M} | {PASS/WARN/FAIL} |

---

## Issues Found

### Critical
{If none: "No critical issues found."}

- **`{file.ts}:{line}`** - {Issue description}
  - **Why**: {Explanation}
  - **Fix**: {Recommendation}

### High Priority
{Issues that should be fixed before merge}

### Medium Priority
{Issues worth addressing but not blocking}

### Suggestions
{Nice-to-haves}

---

## Validation Results

| Check | Status | Details |
|-------|--------|---------|
| Type Check | {PASS/FAIL} | {notes} |
| Lint | {PASS/WARN} | {count} warnings |
| Tests | {PASS/FAIL} | {count} passed |
| Build | {PASS/FAIL} | {notes} |

---

## What's Good

{Acknowledge positive aspects}

---

## Recommendation

**{APPROVE/REQUEST CHANGES/BLOCK}**

{Clear explanation and next steps}
```

**PHASE_6_CHECKPOINT:**
- [ ] Report file created
- [ ] All sections populated

---

## Phase 7: PUBLISH - Post to GitHub

### 7.1 Determine Review Action

Based on recommendation and flags:

```bash
# If --approve flag AND no critical/high issues
gh pr review {NUMBER} --approve --body-file .agents/reviews/pr-{NUMBER}-review.md

# If --request-changes flag OR high issues found
gh pr review {NUMBER} --request-changes --body-file .agents/reviews/pr-{NUMBER}-review.md

# Otherwise just comment
gh pr comment {NUMBER} --body-file .agents/reviews/pr-{NUMBER}-review.md
```

**PHASE_7_CHECKPOINT:**
- [ ] Review/comment posted to PR

---

## Phase 8: OUTPUT - Report to User

```markdown
## PR Review Complete

**PR**: #{NUMBER} - {TITLE}
**URL**: {PR_URL}
**Recommendation**: {APPROVE/REQUEST CHANGES/BLOCK}

### Issues Found

| Severity | Count |
|----------|-------|
| Critical | {N} |
| High | {N} |
| Medium | {N} |
| Suggestions | {N} |

### Validation

| Check | Result |
|-------|--------|
| Type Check | {PASS/FAIL} |
| Lint | {PASS/FAIL} |
| Tests | {PASS/FAIL} |
| Build | {PASS/FAIL} |

### Artifacts

- Report: `.agents/reviews/pr-{NUMBER}-review.md`
- PR Comment: {comment_url}

### Next Steps

{Based on recommendation}
```

---

## Critical Reminders

1. **Understand before judging.** Read full context, not just the diff.
2. **Be specific.** Offer solutions, not just problems.
3. **Prioritize.** Use severity levels honestly.
4. **Be constructive.** Acknowledge good work.
5. **Run validation.** Don't skip automated checks.

---

## Success Criteria

- **CONTEXT_GATHERED**: PR metadata and diff reviewed
- **CODE_REVIEWED**: All changed files analyzed
- **VALIDATION_RUN**: All automated checks executed
- **ISSUES_CATEGORIZED**: Findings organized by severity
- **REPORT_GENERATED**: Review saved locally
- **PR_UPDATED**: Review/comment posted to GitHub
- **RECOMMENDATION_CLEAR**: Approve/request-changes/block with rationale
