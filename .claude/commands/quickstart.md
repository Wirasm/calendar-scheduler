---
description: Interactive setup guide - explores project, confirms steps, then executes
---

# Quickstart Setup Guide

---

## Phase 1: EXPLORE - Understand the Project

**Before doing anything, explore the project to understand what's needed.**

### 1.1 Read Project Documentation

```bash
# Check for README
cat README.md 2>/dev/null | head -100

# Check for setup docs
ls docs/ 2>/dev/null
cat docs/SETUP.md 2>/dev/null || cat docs/setup.md 2>/dev/null
```

### 1.2 Analyze Package Configuration

```bash
# Package manager and scripts
cat package.json | head -50

# Check which package manager
ls bun.lockb 2>/dev/null && echo "USES_BUN"
ls package-lock.json 2>/dev/null && echo "USES_NPM"
ls yarn.lock 2>/dev/null && echo "USES_YARN"
ls pnpm-lock.yaml 2>/dev/null && echo "USES_PNPM"
```

### 1.3 Discover Environment Requirements

```bash
# Check for env example/template
cat .env.example 2>/dev/null || cat .env.template 2>/dev/null || cat .env.sample 2>/dev/null

# Check existing env
ls .env.local 2>/dev/null || ls .env 2>/dev/null
```

### 1.4 Check Project Structure

```bash
# Understand the tech stack
ls -la src/ 2>/dev/null
ls -la app/ 2>/dev/null

# Database setup files
ls drizzle.config.* 2>/dev/null
ls prisma/ 2>/dev/null

# Config files
ls next.config.* 2>/dev/null
ls vite.config.* 2>/dev/null
ls tsconfig.json 2>/dev/null
```

### 1.5 Read CLAUDE.md for Project Context

Read `CLAUDE.md` if it exists - it contains project-specific setup instructions and patterns.

---

## Phase 2: ANALYZE - Determine Setup Steps

**Based on exploration, identify:**

1. **Package manager**: Bun / npm / yarn / pnpm
2. **Required environment variables**: From .env.example
3. **Optional environment variables**: Defaults available
4. **Database setup**: Migrations, seeds, schema push
5. **Build/validation steps**: Type check, lint, test
6. **Dev server command**: How to start the app

**Categorize env variables:**

| Variable | Required? | Has Default? | Source |
|----------|-----------|--------------|--------|
| {VAR_NAME} | Yes/No | Yes/No | {where to get it} |

---

## Phase 3: CONFIRM - Present Plan to User

**Before executing, present the discovered setup plan:**

> **Setup Plan**
>
> Based on my exploration of this project, here's what I found:
>
> **Tech Stack:**
> - Framework: {Next.js / Vite / etc.}
> - Package Manager: {Bun / npm / etc.}
> - Database: {Supabase / Postgres / etc.}
>
> **Setup Steps:**
> 1. Install dependencies: `{install command}`
> 2. Configure environment: {N} required variables, {M} optional
> 3. Database setup: {migrations / schema push / none}
> 4. Validation: {type check, lint, test}
> 5. Start server: `{dev command}`
>
> **Environment Variables Needed:**
>
> | Variable | Required | Where to Get It |
> |----------|----------|-----------------|
> | {VAR} | {Yes/No} | {source} |
>
> **Does this look correct? Should I proceed?**

**GATE**: Wait for user confirmation before proceeding.

---

## Phase 4: CHECK - Current State

### 4.1 Check Prerequisites

```bash
# Check runtime version
{package_manager} --version

# Check if dependencies installed
ls node_modules 2>/dev/null || echo "NOT_INSTALLED"

# Check if env configured
ls .env.local 2>/dev/null || ls .env 2>/dev/null || echo "NOT_CONFIGURED"
```

**Report findings:**
- Runtime: {version}
- Dependencies: Installed / Not installed
- Environment: Configured / Not configured

---

## Phase 5: INSTALL - Dependencies

Run the appropriate install command based on detected package manager:

```bash
# Bun
bun install

# npm
npm install

# yarn
yarn install

# pnpm
pnpm install
```

**If errors occur**, report them and suggest fixes.

---

## Phase 6: CONFIGURE - Environment Variables

### 6.1 Check Existing Configuration

```bash
cat .env.local 2>/dev/null || cat .env 2>/dev/null || echo "No env file found"
```

### 6.2 Guide Environment Setup

**For each REQUIRED variable that's missing:**

> **Missing Required Variable: `{VAR_NAME}`**
>
> Description: {what it's for}
> Format: {expected format, e.g., "URL starting with https://"}
> Where to get it: {specific instructions}
>
> Please provide the value:

**For OPTIONAL variables:**

> **Optional Variables**
>
> These have defaults but can be customized:
>
> | Variable | Default | Description |
> |----------|---------|-------------|
> | {VAR} | {default} | {description} |
>
> Would you like to customize any of these?
> - Yes, let me set some
> - No, use defaults

**GATE**: Collect values and create/update env file.

### 6.3 Create Environment File

Based on collected values, create the appropriate env file (`.env.local` or `.env`).

---

## Phase 7: DATABASE - Setup (if applicable)

**Only if project has database configuration:**

### 7.1 Detect Database Setup Method

```bash
# Drizzle
ls drizzle.config.* 2>/dev/null && echo "DRIZZLE"

# Prisma
ls prisma/schema.prisma 2>/dev/null && echo "PRISMA"

# Other
ls migrations/ 2>/dev/null && echo "MIGRATIONS_DIR"
```

### 7.2 Offer Database Setup

> **Database Setup**
>
> This project uses {Drizzle/Prisma/etc.} for database management.
>
> Available actions:
> - Push schema to database
> - Run migrations
> - Skip (I'll do it manually)
>
> ⚠️ This will modify your database.
>
> What would you like to do?

**GATE**: Execute based on user choice.

### 7.3 Additional Database Steps

If there are additional setup steps (like auth triggers, seeds), inform the user:

> **Additional Setup Required**
>
> {Explain what needs to be done manually and why}

---

## Phase 8: VALIDATE - Check Setup

Run validation commands discovered in package.json:

```bash
# Type check (if TypeScript)
{typecheck_command}

# Lint (if configured)
{lint_command}

# Test (optionally)
{test_command}
```

**Report results and suggest fixes for any errors.**

---

## Phase 9: START - Run Development Server

```bash
{dev_command}
```

Wait for server to start and verify it's running.

---

## Phase 10: REPORT - Summary

**Output comprehensive summary:**

```markdown
## Quickstart Complete

### Project Info
- **Framework**: {detected framework}
- **Package Manager**: {detected pm}
- **Database**: {detected db or "None"}

### What Was Done

- [x] Dependencies installed
- [x] Environment configured ({N} variables set)
- [x] Database: {pushed/migrated/skipped}
- [x] Validation: {passed/failed with notes}
- [x] Server started

### Access Points

| Service | URL |
|---------|-----|
| App | {detected URL, e.g., http://localhost:3000} |

### Environment Summary

| Variable | Status |
|----------|--------|
| {VAR} | ✓ Configured / ⚠️ Using default / ✗ Missing |

### Useful Commands

{Commands discovered from package.json scripts}

| Command | Description |
|---------|-------------|
| `{cmd}` | {description} |

### Next Steps

{Based on what was discovered - e.g., "Register a user", "Run migrations", etc.}

### Issues Encountered

{Any problems and their solutions, or "None"}
```

---

## Error Handling

**If exploration reveals unexpected structure:**

> I found some things I didn't expect:
> - {unexpected finding}
>
> This might mean:
> - {possible explanation}
>
> Should I proceed with best guess, or would you like to clarify?

**If a step fails:**

1. Report the specific error
2. Check if it's a known issue (search docs/README)
3. Suggest fixes based on context
4. Ask if user wants to continue or abort
