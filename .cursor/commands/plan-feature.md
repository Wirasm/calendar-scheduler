# Create Feature Implementation Plan

## First: Get Input

**Ask the user**: "What feature do you want to plan? Please describe the feature and its purpose."

Store their response as `FEATURE_DESCRIPTION`.

---

## Objective

Transform `FEATURE_DESCRIPTION` into a battle-tested implementation plan through systematic codebase exploration, pattern extraction, and strategic research.

**Core Principle**: PLAN ONLY - no code written. Create a context-rich document that enables one-pass implementation success.

**Execution Order**: CODEBASE FIRST, RESEARCH SECOND. Solutions must fit existing patterns before introducing new ones.

## Context

Run these commands to understand project structure:
- `ls -la src/` - Project structure
- `cat package.json | head -30` - Package info
- `ls src/features/` - Existing features

Read `CLAUDE.md` for project conventions.

## Process

### Phase 1: PARSE - Feature Understanding

**EXTRACT from input:**
- Core problem being solved
- User value and business impact
- Feature type: NEW_CAPABILITY | ENHANCEMENT | REFACTOR | BUG_FIX
- Complexity: LOW | MEDIUM | HIGH
- Affected systems list

**FORMULATE user story:**
```
As a <user type>
I want to <action/goal>
So that <benefit/value>
```

**PHASE_1_CHECKPOINT:**
- [ ] Problem statement is specific and testable
- [ ] User story follows correct format
- [ ] Complexity assessment has rationale
- [ ] Affected systems identified

**GATE**: If requirements are AMBIGUOUS → STOP and ASK user for clarification before proceeding.

---

### Phase 2: EXPLORE - Codebase Intelligence

**Explore the codebase thoroughly to discover:**

1. **Similar implementations** - find analogous features with file:line references
2. **Naming conventions** - extract actual examples of function/class/file naming
3. **Error handling patterns** - how errors are created, thrown, caught
4. **Logging patterns** - logger usage, message formats
5. **Type definitions** - relevant interfaces and types
6. **Test patterns** - test file structure, assertion styles
7. **Integration points** - where new code connects to existing
8. **Dependencies** - relevant libraries already in use

**DOCUMENT discoveries in table format:**

| Category | File:Lines | Pattern Description | Code Snippet |
|----------|-----------|---------------------|--------------|
| NAMING | `src/features/X/service.ts:10-15` | camelCase functions | `export function createThing()` |
| ERRORS | `src/features/X/errors.ts:5-20` | Custom error classes | `class ThingNotFoundError` |

**PHASE_2_CHECKPOINT:**
- [ ] At least 3 similar implementations found with file:line refs
- [ ] Code snippets are ACTUAL (copy-pasted from codebase, not invented)
- [ ] Integration points mapped with specific file paths
- [ ] Dependencies cataloged with versions from package.json

---

### Phase 3: RESEARCH - External Documentation

**ONLY AFTER Phase 2 is complete** - solutions must fit existing codebase patterns first.

**SEARCH for:**
- Official documentation for involved libraries (match versions from package.json)
- Known gotchas, breaking changes, deprecations
- Security considerations and best practices
- Performance optimization patterns

**FORMAT references with specificity:**
```markdown
- [Library Docs v{version}](https://url#specific-section)
  - KEY_INSIGHT: {what we learned that affects implementation}
  - APPLIES_TO: {which task/file this affects}
  - GOTCHA: {potential pitfall and how to avoid}
```

**PHASE_3_CHECKPOINT:**
- [ ] Documentation versions match package.json
- [ ] URLs include specific section anchors (not just homepage)
- [ ] Gotchas documented with mitigation strategies

---

### Phase 4: DESIGN - UX Transformation

**CREATE ASCII diagrams showing user experience before and after:**

```
╔═══════════════════════════════════════════════════════════════════╗
║                         BEFORE STATE                               ║
╠═══════════════════════════════════════════════════════════════════╣
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐ ║
║   │   Screen/   │ ──────► │   Action    │ ──────► │   Result    │ ║
║   │  Component  │         │   Current   │         │   Current   │ ║
║   └─────────────┘         └─────────────┘         └─────────────┘ ║
║                                                                    ║
║   USER_FLOW: [describe current step-by-step experience]           ║
║   PAIN_POINT: [what's missing, broken, or inefficient]            ║
╚═══════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════╗
║                          AFTER STATE                               ║
╠═══════════════════════════════════════════════════════════════════╣
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐ ║
║   │   Screen/   │ ──────► │   Action    │ ──────► │   Result    │ ║
║   │  Component  │         │    NEW      │         │    NEW      │ ║
║   └─────────────┘         └─────────────┘         └─────────────┘ ║
║                                                                    ║
║   USER_FLOW: [describe new step-by-step experience]               ║
║   VALUE_ADD: [what user gains from this change]                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

**DOCUMENT interaction changes:**

| Location | Before | After | User_Action | Impact |
|----------|--------|-------|-------------|--------|
| `/route` | State A | State B | Click X | Can now Y |

**PHASE_4_CHECKPOINT:**
- [ ] Before state accurately reflects current system behavior
- [ ] After state shows ALL new capabilities
- [ ] Data flows are traceable from input to output
- [ ] User value is explicit and measurable

---

### Phase 5: ARCHITECT - Strategic Design

**ANALYZE deeply:**
- ARCHITECTURE_FIT: How does this integrate with vertical slice structure?
- EXECUTION_ORDER: What must happen first → second → third?
- FAILURE_MODES: Edge cases, race conditions, error scenarios?
- PERFORMANCE: Will this scale? Database queries optimized?
- SECURITY: Attack vectors? Data exposure risks? Auth/authz?
- MAINTAINABILITY: Will future devs understand this code?

**DECIDE and document:**

```markdown
APPROACH_CHOSEN: [description]
RATIONALE: [why this over alternatives - reference codebase patterns]

ALTERNATIVES_REJECTED:
- [Alternative 1]: Rejected because [specific reason]
- [Alternative 2]: Rejected because [specific reason]

NOT_BUILDING (explicit scope limits):
- [Item 1 - explicitly out of scope and why]
- [Item 2 - explicitly out of scope and why]
```

**PHASE_5_CHECKPOINT:**
- [ ] Approach aligns with existing vertical slice architecture
- [ ] Dependencies ordered correctly (types → repository → service → routes)
- [ ] Edge cases identified with specific mitigation strategies
- [ ] Scope boundaries are explicit and justified

---

### Phase 6: GENERATE - Implementation Plan File

**OUTPUT_PATH**: `.agents/plans/{kebab-case-feature-name}.plan.md`

Create directory if needed: `mkdir -p .agents/plans`

**Create the plan file** with comprehensive structure including:
- Summary and user story
- Problem and solution statements
- Metadata (type, complexity, systems affected)
- UX Design (before/after diagrams, interaction changes)
- Mandatory reading (files and external docs)
- Patterns to mirror (actual code snippets)
- Files to change (table with actions and justifications)
- NOT Building (explicit scope limits)
- Step-by-step tasks (each with IMPLEMENT, MIRROR, IMPORTS, GOTCHA, VALIDATE)
- Testing strategy
- Validation commands (Level 1-6)
- Acceptance criteria and completion checklist
- Risks and mitigations
- Notes

---

## Output

**OUTPUT_FILE**: `.agents/plans/{kebab-case-feature-name}.plan.md`

**REPORT_TO_USER:**

```markdown
## Plan Created

**File**: `.agents/plans/{feature-name}.plan.md`

**Summary**: {2-3 sentence feature overview}

**Complexity**: {LOW/MEDIUM/HIGH} - {brief rationale}

**Scope**:
- {N} files to CREATE
- {M} files to UPDATE
- {K} total tasks

**Key Patterns Discovered**:
- {Pattern 1 from exploration with file:line}
- {Pattern 2 from exploration with file:line}

**UX Transformation**:
- BEFORE: {one-line current state}
- AFTER: {one-line new state}

**Risks**:
- {Primary risk}: {mitigation}

**Confidence Score**: {1-10}/10 for one-pass implementation success
- {Rationale for score}

**Next Step**: To execute, run: `/execute-plan .agents/plans/{feature-name}.plan.md`
```

## Success Criteria

- **CONTEXT_COMPLETE**: All patterns, gotchas, integration points documented from actual codebase
- **IMPLEMENTATION_READY**: Tasks executable top-to-bottom without questions, research, or clarification
- **PATTERN_FAITHFUL**: Every new file mirrors existing codebase style exactly
- **VALIDATION_DEFINED**: Every task has executable verification command
- **UX_DOCUMENTED**: Before/After transformation is visually clear with data flows
- **ONE_PASS_TARGET**: Confidence score 8+ indicates high likelihood of first-attempt success
