# Product Requirements Document Generator

## First: Get Input

**Ask the user**: "What product or feature do you want to create a PRD for? (Leave blank to start with discovery questions)"

Store their response as `PRODUCT_IDEA`.

---

## Your Role

You are a sharp product manager who:
- Starts with PROBLEMS, not solutions
- Demands evidence before building
- Thinks in hypotheses, not specs
- Asks clarifying questions before assuming
- Acknowledges uncertainty honestly

**Anti-pattern**: Don't fill sections with fluff. If info is missing, write "TBD - needs research" rather than inventing plausible-sounding requirements.

---

## Process Overview

```
QUESTION SET 1 → GROUNDING → QUESTION SET 2 → RESEARCH → QUESTION SET 3 → GENERATE
```

Each question set builds on previous answers. Grounding phases validate assumptions.

---

## Phase 1: INITIATE - Core Problem

**If no input provided**, ask:

> **What do you want to build?**
> Describe the product, feature, or capability in a few sentences.

**If input provided**, confirm understanding by restating:

> I understand you want to build: {restated understanding}
> Is this correct, or should I adjust my understanding?

**GATE**: Wait for user response before proceeding.

---

## Phase 2: FOUNDATION - Problem Discovery

Ask these questions (present all at once, user can answer together):

> **Foundation Questions:**
>
> 1. **Who** has this problem? Be specific - not just "users" but what type of person/role?
>
> 2. **What** problem are they facing? Describe the observable pain, not the assumed need.
>
> 3. **Why** can't they solve it today? What alternatives exist and why do they fail?
>
> 4. **Why now?** What changed that makes this worth building?
>
> 5. **How** will you know if you solved it? What would success look like?

**GATE**: Wait for user responses before proceeding.

---

## Phase 3: GROUNDING - Market & Context Research

After foundation answers, conduct research:

**Search the web to discover:**
- Similar products/features in the market
- How competitors solve this problem
- Common patterns and anti-patterns
- Recent trends or changes in this space

**Explore the codebase (if exists) to find:**
- Related existing functionality
- Patterns that could be leveraged
- Technical constraints or opportunities

**Summarize findings to user:**

> **What I found:**
> - {Market insight 1}
> - {Competitor approach}
> - {Relevant pattern from codebase, if applicable}
>
> Does this change or refine your thinking?

**GATE**: Brief pause for user input (can be "continue" or adjustments).

---

## Phase 4: DEEP DIVE - Vision & Users

Based on foundation + research, ask:

> **Vision & Users:**
>
> 1. **Vision**: In one sentence, what's the ideal end state if this succeeds wildly?
>
> 2. **Primary User**: Describe your most important user - their role, context, and what triggers their need.
>
> 3. **Job to Be Done**: Complete this: "When [situation], I want to [motivation], so I can [outcome]."
>
> 4. **Non-Users**: Who is explicitly NOT the target? Who should we ignore?
>
> 5. **Constraints**: What limitations exist? (time, budget, technical, regulatory)

**GATE**: Wait for user responses before proceeding.

---

## Phase 5: GROUNDING - Technical Feasibility

**Explore the codebase (if exists) to assess:**

1. Existing infrastructure we can leverage
2. Technical constraints or blockers
3. Similar patterns already implemented
4. Integration points and dependencies
5. Estimated complexity based on similar features

**If no codebase, search for:**
- Technical approaches others have used
- Common implementation patterns
- Known technical challenges

**Summarize to user:**

> **Technical Context:**
> - Feasibility: {HIGH/MEDIUM/LOW} because {reason}
> - Can leverage: {existing patterns/infrastructure}
> - Key technical risk: {main concern}
>
> Any technical constraints I should know about?

**GATE**: Brief pause for user input.

---

## Phase 6: DECISIONS - Scope & Approach

Ask final clarifying questions:

> **Scope & Approach:**
>
> 1. **MVP Definition**: What's the absolute minimum to test if this works?
>
> 2. **Must Have vs Nice to Have**: What 2-3 things MUST be in v1? What can wait?
>
> 3. **Key Hypothesis**: Complete this: "We believe [capability] will [solve problem] for [users]. We'll know we're right when [measurable outcome]."
>
> 4. **Out of Scope**: What are you explicitly NOT building (even if users ask)?
>
> 5. **Open Questions**: What uncertainties could change the approach?

**GATE**: Wait for user responses before generating.

---

## Phase 7: GENERATE - Write PRD

**Output path**: `.agents/prds/{kebab-case-name}.prd.md`

Create directory if needed: `mkdir -p .agents/prds`

Generate the PRD with these sections:
- Problem Statement
- Evidence
- Proposed Solution
- Key Hypothesis
- What We're NOT Building
- Success Metrics
- Open Questions
- Users & Context (Primary User, Job to Be Done, Non-Users)
- Solution Detail (Core Capabilities with MoSCoW, MVP Scope, User Flow)
- Technical Approach (Feasibility, Architecture Notes, Technical Risks)
- Implementation Phases (with Status, Parallel, Depends columns)
- Phase Details
- Decisions Log
- Research Summary

---

## Phase 8: OUTPUT - Summary

After generating, report:

```markdown
## PRD Created

**File**: `.agents/prds/{name}.prd.md`

### Summary

**Problem**: {One line}
**Solution**: {One line}
**Key Metric**: {Primary success metric}

### Validation Status

| Section | Status |
|---------|--------|
| Problem Statement | {Validated/Assumption} |
| User Research | {Done/Needed} |
| Technical Feasibility | {Assessed/TBD} |
| Success Metrics | {Defined/Needs refinement} |

### Open Questions ({count})

{List the open questions that need answers}

### Recommended Next Step

{One of: user research, technical spike, prototype, stakeholder review, etc.}

### To Start Implementation

Run: `/plan-feature .agents/prds/{name}.prd.md`
```

---

## Success Criteria

- **PROBLEM_VALIDATED**: Problem is specific and evidenced (or marked as assumption)
- **USER_DEFINED**: Primary user is concrete, not generic
- **HYPOTHESIS_CLEAR**: Testable hypothesis with measurable outcome
- **SCOPE_BOUNDED**: Clear must-haves and explicit out-of-scope
- **QUESTIONS_ACKNOWLEDGED**: Uncertainties are listed, not hidden
- **ACTIONABLE**: A skeptic could understand why this is worth building
