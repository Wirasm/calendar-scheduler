---
agent: 'agent'
description: 'Meta command creator - generates slash commands following established patterns'
---

# Meta Command Creator - Generate Slash Commands

## First: Get Input

**Ask the user**: "What command do you want to create? Please provide:
1. Command name (e.g., 'deploy', 'test-feature')
2. Purpose description (what should this command do?)"

Store their response as `COMMAND_REQUEST`.

---

## Objective

Create a new slash command based on `COMMAND_REQUEST`.

You are creating a command for AI agents. The agent executing the generated command has these capabilities:
- File read/write/edit tools
- Bash execution
- Web search for research
- Extended thinking for complex analysis

**Meta Principle**: Write instructions you would want to receive. Specificity drives results - concrete prompts outperform vague ones.

**Simplicity Principle**: Not everything needs to be a command. A well-crafted documentation entry often beats a complex slash command. Only create commands for repeatable, multi-step workflows.

## Context

Review existing commands in `.github/prompts/` for patterns.

## Process

### Phase 0: GATE - Should This Be a Command?

**STOP and ask**: Is a slash command the right solution?

| Signal | Recommendation |
|--------|----------------|
| One-time task | Just do it directly, no command needed |
| Simple preference | Add to documentation instead |
| Vague/exploratory | Use exploration tools directly |
| Repeatable multi-step workflow | YES - create a command |
| Team-shared process | YES - create a command |

**If the answer is "just do it directly" or "add to docs"** → STOP and recommend that instead.

---

### Phase 1: CLASSIFY - Determine Command Type

**Two fundamental types:**

#### TOOL Commands (Simple, Focused)
- Single-purpose utility
- Immediate result
- Short, often < 50 lines

#### WORKFLOW Commands (Complex, Orchestrated)
- Multi-phase execution
- Produces artifacts (files, reports)
- Phase checkpoints for self-validation
- Often 100-300 lines

---

### Phase 2: EXPLORE - Study Existing Patterns

Read 2-3 existing commands in `.github/prompts/` for patterns:
- YAML frontmatter style
- Structure and sections
- How instructions are written

---

### Phase 3: GENERATE - Write the Command

**For TOOL commands:**
```markdown
---
agent: 'agent'
description: '{Brief description}'
---

# {Command Title}

{Brief description of what this does}

## Process

1. {Step one}
2. {Step two}
3. {Report result}

## Success Criteria

{How to know it worked}
```

**For WORKFLOW commands:**
```markdown
---
agent: 'agent'
description: '{Brief description}'
---

# {Command Title}

## Objective

{What this command does and why}

**Core Principle**: {Guiding philosophy}

## Context

{What to check/read before starting}

## Process

### Phase 1: {Phase Name}

{Specific instructions}

**Checkpoint:**
- [ ] Validation item 1
- [ ] Validation item 2

### Phase 2: {Phase Name}

{Continue phases...}

## Output

**File**: `{output path if any}`

**Report to user**: {what to tell the user when done}

## Success Criteria

{Measurable outcomes}
```

---

### Phase 4: VALIDATE - Quality Review

Apply the "Would I want to receive this?" test:

| Check | Question |
|-------|----------|
| CLARITY | Is every step unambiguous? |
| SPECIFICITY | Are instructions concrete, not vague? |
| RIGHT_SIZE | Is complexity appropriate? |

---

## Output

**Save command to**: `.github/prompts/{command-name}.prompt.md`

**Report to user:**

```
## Command Created

**File**: `.github/prompts/{command-name}.prompt.md`
**Usage**: `/command-name`
**Type**: TOOL/WORKFLOW

Test it by running the command to verify it works as expected.
```
