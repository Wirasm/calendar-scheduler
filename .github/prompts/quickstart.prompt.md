---
agent: 'agent'
description: 'Interactive setup - explores project first, confirms plan, then executes'
---

# Quickstart Setup Guide

Interactive setup that explores the project first, confirms the plan, then executes.

---

## Phase 1: EXPLORE - Understand the Project

**Before doing anything, explore the project to understand what's actually needed.**

### 1.1 Read Project Documentation

Read these files to understand the project:
- `README.md` - Project overview and setup instructions
- `CLAUDE.md` - Development conventions and commands
- `docs/` directory - Any additional setup documentation

### 1.2 Analyze Package Configuration

Read `package.json` to discover:
- Project name and description
- Available scripts (dev, build, lint, test)
- Dependencies and their versions

Check which package manager is used:
- `bun.lockb` → Bun
- `package-lock.json` → npm
- `yarn.lock` → Yarn
- `pnpm-lock.yaml` → pnpm

### 1.3 Discover Environment Requirements

**Critical**: Read `.env.example` or `.env.template` to understand:
- What environment variables are needed
- Which are required vs optional
- What format/values are expected
- Where to obtain credentials (comments often explain this)

Check if user already has environment configured:
- `.env.local` (Next.js convention)
- `.env` (general convention)

### 1.4 Check Project Structure

Understand the tech stack:
- `next.config.*` → Next.js
- `vite.config.*` → Vite
- `drizzle.config.*` → Drizzle ORM
- `prisma/` → Prisma ORM
- `tsconfig.json` → TypeScript

---

## Phase 2: ANALYZE - Determine Setup Steps

**Based on exploration, build a setup plan:**

1. **Package manager**: Which one and install command
2. **Required env variables**: From .env.example (look for placeholders like `your-xxx` or `xxx`)
3. **Optional env variables**: Those with sensible defaults already set
4. **Database setup**: What ORM, migration commands
5. **Validation commands**: Type check, lint, test from package.json scripts
6. **Dev server**: How to start the app

**Parse .env.example to categorize variables:**

| Variable | Required? | Has Default? | How to Get It |
|----------|-----------|--------------|---------------|
| (from file) | (placeholder = required) | (real value = optional) | (from comments) |

---

## Phase 3: CONFIRM - Present Plan to User

**Present your findings and get confirmation before executing:**

> **Setup Plan**
>
> I've explored the project and here's what I found:
>
> **Tech Stack:**
> - Framework: {detected}
> - Package Manager: {detected}
> - Database: {detected or "None"}
> - TypeScript: {yes/no}
>
> **Setup Steps I'll Execute:**
> 1. Install dependencies: `{command}`
> 2. Configure environment: {N} required variables, {M} optional
> 3. Database: {what needs to happen}
> 4. Validation: {commands}
> 5. Start server: `{command}`
>
> **Environment Variables:**
>
> *Required (you'll need to provide these):*
> | Variable | Where to Get It |
> |----------|-----------------|
> | {var} | {source from .env.example comments} |
>
> *Optional (have defaults):*
> | Variable | Default |
> |----------|---------|
> | {var} | {value} |
>
> **Does this look right? Should I proceed?**

**GATE**: Wait for user confirmation.

---

## Phase 4: CHECK - Current State

Check what's already done:
- Is the runtime installed? (run `{pm} --version`)
- Are dependencies installed? (check `node_modules/`)
- Is environment configured? (check for `.env.local` or `.env`)

Report findings to user.

---

## Phase 5: INSTALL - Dependencies

Run the appropriate install command based on detected package manager.

If errors occur, report them with context and suggest fixes.

---

## Phase 6: CONFIGURE - Environment Variables

### 6.1 Check Existing Configuration

Read any existing `.env.local` or `.env` file.

### 6.2 Guide Environment Setup

**For each REQUIRED variable that's missing:**

Ask the user to provide it, explaining:
- What it's for
- Expected format
- Where to get it (from .env.example comments)

**For OPTIONAL variables:**

Ask if user wants to customize or use defaults.

### 6.3 Create/Update Environment File

Write the collected values to the appropriate env file.

---

## Phase 7: DATABASE - Setup (if applicable)

**Only if project has database configuration.**

Detect the database tool (Drizzle, Prisma, etc.) and offer:
- Push schema to database
- Run migrations
- Skip

Also inform about any manual steps needed (like auth triggers for Supabase).

---

## Phase 8: VALIDATE - Check Setup

Run validation commands from package.json:
- Type check
- Lint
- Optionally tests

Report results and help fix any errors.

---

## Phase 9: START - Run Development Server

Start the dev server and verify it's running.

---

## Phase 10: REPORT - Summary

```markdown
## Quickstart Complete

### Project Info
- **Framework**: {detected}
- **Package Manager**: {detected}
- **Database**: {detected or "None"}

### What Was Done
- [x] Dependencies installed
- [x] Environment configured ({N} variables)
- [x] Database: {status}
- [x] Validation: {status}
- [x] Server: Running at {URL}

### Environment Summary
| Variable | Status |
|----------|--------|
| {var} | ✓ Set / ⚠️ Default / ✗ Missing |

### Useful Commands
{From package.json scripts}

### Next Steps
{Based on what was discovered}

### Issues
{Any problems encountered, or "None"}
```

---

## Error Handling

**If exploration reveals something unexpected:**

Report what you found, explain possible interpretations, and ask user how to proceed.

**If a step fails:**

1. Report the error with context
2. Check README/docs for known issues
3. Suggest fixes
4. Ask if user wants to continue or abort
