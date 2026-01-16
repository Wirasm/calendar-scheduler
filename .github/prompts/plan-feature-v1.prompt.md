---
agent: 'agent'
description: 'Create comprehensive feature implementation plan with codebase analysis and research'
---

# Create Feature Implementation Plan (v1)

## First: Get Input

**Ask the user**: "What feature do you want to plan? Please describe the feature and its purpose."

Store their response as `FEATURE_DESCRIPTION`.

---

## Objective

Transform `FEATURE_DESCRIPTION` into a battle-tested implementation plan through systematic codebase exploration, pattern extraction, and strategic research.

**Core Principle**: Plan only - no code. Create a context-rich document that enables one-pass implementation success for AI agents.

**Execution Order**: Codebase first, research second. Solutions must fit existing patterns.

## Context

Run these commands to understand project structure:
- `ls -la src/` - Project structure
- `cat package.json | head -30` - Package info
- `ls src/features/` - Existing features

Read `CLAUDE.md` for project conventions.

## Process

### Phase 1: Feature Understanding

**Parse the input and clarify:**

- Extract core problem being solved
- Identify user value and business impact
- Determine type: New Capability | Enhancement | Refactor | Bug Fix
- Assess complexity: Low | Medium | High
- Map affected systems

**Create or refine user story:**

```
As a <user type>
I want to <action/goal>
So that <benefit/value>
```

**CHECKPOINT**: If requirements are ambiguous, STOP and ask user for clarification before proceeding.

---

### Phase 2: Codebase Intelligence

**Explore the codebase to discover:**

1. **Similar Implementations**
   - Find analogous features in codebase
   - Extract patterns with file:line references
   - Identify naming conventions, error handling, logging patterns

2. **Architecture Patterns**
   - Directory structure and module organization
   - Service/repository/controller boundaries
   - Type definitions and interfaces

3. **Integration Points**
   - Files that need modification
   - Registration patterns (routes, providers, exports)
   - Database/API patterns if applicable

4. **Testing Patterns**
   - Test framework and conventions
   - Similar test examples to mirror
   - Coverage requirements

5. **Dependencies**
   - Relevant libraries already in use
   - How they're integrated (imports, configs)
   - Version constraints

**CRITICAL**: Document patterns with ACTUAL code snippets from codebase, not generic examples.

---

### Phase 3: External Research (AFTER codebase analysis)

**Search for:**

- Official documentation for involved libraries
- Latest version info and breaking changes
- Common implementation patterns and gotchas
- Security considerations

**Compile with specific anchors:**

```markdown
- [Docs Title](https://url#specific-section)
  - Key insight: What we learned
  - Why needed: How it applies to our implementation
```

---

### Phase 4: UX Design (REQUIRED)

**Create ASCII diagrams showing before/after UX:**

```
BEFORE:
┌─────────────────────────────────────┐
│  [Current user flow or state]       │
│  Show what exists today             │
└─────────────────────────────────────┘

AFTER:
┌─────────────────────────────────────┐
│  [New user flow or state]           │
│  Show what will exist after         │
│  implementation                     │
└─────────────────────────────────────┘
```

**Document interaction changes:**

- What screens/endpoints change
- New user actions available
- Changed data flows

---

### Phase 5: Strategic Design

**Think deeply about:**

- How does this fit existing architecture?
- What are critical dependencies and execution order?
- What could go wrong? (edge cases, race conditions)
- Performance implications?
- Security considerations?

**Design decisions:**

- Approach chosen with rationale
- Alternatives rejected with reasons
- What we're NOT building (explicit scope limits)

---

### Phase 6: Generate Implementation Plan

**Save to**: `.agents/plans/{feature-name}.plan.md`

Create the plan file with this structure:

```markdown
# Feature: {Feature Name}

## Summary
{One paragraph: What we're building and the high-level approach}

## User Story
As a {user type}
I want to {action}
So that {benefit}

## Problem Statement
{What specific problem this solves}

## Solution Statement
{How we're solving it}

## Metadata
- **Type**: New Capability | Enhancement | Refactor | Bug Fix
- **Complexity**: Low | Medium | High
- **Systems Affected**: {list}
- **Dependencies**: {external libs/services}

---

## UX Design

### Before
{ASCII diagram of current state}

### After
{ASCII diagram of new state}

### Interaction Changes
- {Change 1}
- {Change 2}

---

## Mandatory Reading

**CRITICAL: Read these files before implementing:**

| File | Lines | Why |
|------|-------|-----|
| `path/to/file.ts` | 15-45 | Pattern for X to mirror |

**External Documentation:**
- [Doc Title](url#section) - Why needed

---

## Patterns to Mirror

**Naming Convention:**
```typescript
// FROM: src/features/example/service.ts:10-15
{actual code snippet}
```

**Error Handling:**
```typescript
// FROM: src/core/api/errors.ts:50-60
{actual code snippet}
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `path/new.ts` | CREATE | {why} |
| `path/existing.ts` | UPDATE | {why} |

---

## NOT Building (Scope Limits)

- {Explicit out-of-scope item 1}
- {Explicit out-of-scope item 2}

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: {ACTION} {target}

- **IMPLEMENT**: {specific detail}
- **MIRROR**: `path/to/pattern.ts:XX-YY`
- **IMPORTS**: {required imports}
- **GOTCHA**: {known issue to avoid}
- **VALIDATE**: `{executable command}`

### Task 2: {ACTION} {target}
...

---

## Validation Commands

### Level 1: Static Analysis
```bash
bun run lint && npx tsc --noEmit
```

### Level 2: Unit Tests
```bash
bun test {specific-pattern}
```

### Level 3: Full Suite
```bash
bun test && bun run build
```

---

## Acceptance Criteria

- [ ] All specified functionality implemented
- [ ] Validation commands pass (Level 1-3)
- [ ] Unit tests added with 80%+ coverage
- [ ] Code follows project patterns exactly
- [ ] No regressions in existing tests
```

---

## Output

**File created**: `.agents/plans/{feature-name}.plan.md`

**Report to user:**
- Summary of feature and approach
- Full path to plan file
- Complexity assessment
- Key risks or considerations
- Confidence score (1-10) for one-pass implementation success
- Next step: "To implement, run: `/execute-plan .agents/plans/{feature-name}.plan.md`"

## Success Criteria

- **Context Complete**: All patterns, gotchas, and integration points documented
- **Implementation Ready**: Tasks executable top-to-bottom without questions
- **Pattern Faithful**: Every new file mirrors existing codebase style
- **Validation Defined**: Every task has executable verification command
- **One-Pass Target**: Confidence score 1-10 for first-attempt success
