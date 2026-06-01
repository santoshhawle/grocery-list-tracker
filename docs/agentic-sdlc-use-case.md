# Agentic SDLC Use Case with Claude Code

**Project:** Remote Wellbeing Tracker — Grocery List Feature  
**Ticket:** KAN-3 — Mark Grocery Item as Bought  
**Branch:** `feature-expiry` → `main`  
**PR:** https://github.com/santoshhawle/grocery-list-tracker/pull/1  
**Date:** 2026-06-01

---

## Overview

This document captures how Claude Code's agentic capabilities were used to run a complete, automated Software Development Life Cycle (SDLC) for a real feature story — from a raw JIRA ticket through to a merged Pull Request — with human approval gates at each phase boundary.

The pipeline replaced a traditionally manual process (BA writes requirements, architect designs system, lead reviews, dev implements, QA tests, reviewer approves PR) with a sequence of specialized AI agents, each with a single responsibility, orchestrated by Claude Code.

---

## SDLC Phases Executed

| # | Phase | Agent/Skill | Artifact Produced |
|---|-------|------------|-------------------|
| 1 | Requirements Analysis | `jira-requirements-analyst` | `docs/requirements.md` |
| 2 | System Architecture | `system-architect` | `docs/architecture.md` |
| 3 | Design Review | `design-reviewer` | `docs/design-review.md` + updated `architecture.md` |
| 4 | Implementation Planning | `architecture-task-planner` | `docs/impl-plan.md` |
| 5 | Code Implementation | `code-implementer` | 9 source/test files, 103 passing tests |
| 6 | Code Review | `pr-review-agent` | `docs/review.md` |
| 7 | Verification | `verify-agent` | Verification suite report |
| 8 | PR Creation | `pr-lifecycle-creator` | PR #1 + `CHANGELOG.md` |

Each phase produced a durable artifact in `docs/`. A human reviewed and approved each artifact before the next phase began — agents cannot advance the pipeline autonomously.

---

## Phase Details

### Phase 1 — Requirements Analysis

**Trigger:** User provided JIRA ticket ID `KAN-3`.

**What happened:**
1. Agent fetched full ticket details (title, description, acceptance criteria, labels) via the JIRA MCP.
2. Analyzed the story for ambiguities across 5 categories: Functional, NFR, UX, Technical, Business Rules.
3. Presented 15 categorized clarifying questions to the user.
4. User answered; agent applied recommended defaults for unanswered questions.
5. Wrote and committed `docs/requirements.md` with 17 FRs, 13 ACs in Given/When/Then format, 6 NFRs, 5 Business Rules, Out-of-Scope, and Dependencies.

**Commit:** `docs(requirements): capture requirements for KAN-3 - Mark Grocery Items as Bought`

---

### Phase 2 — System Architecture

**Trigger:** `docs/requirements.md` approved by user.

**What happened:**
1. Agent read requirements and analyzed the existing codebase structure.
2. Chose Component-State + Service-Layer pattern (pure client-side, no server changes).
3. Identified 5 key components: `GroceryListPage`, `GrocerySection`, `GroceryItemRow`, `groceryStorage` service, `GroceryItem` type.
4. Wrote 5 Architecture Decision Records (ADRs) covering storage key strategy, state derivation via `.filter()`, service encapsulation, sub-component extraction, and key naming convention.
5. Produced `docs/architecture.md` with component diagram, technology stack table, data flows, and NFR considerations.

---

### Phase 3 — Design Review

**Trigger:** `docs/architecture.md` produced by system-architect.

**What happened:**
1. Agent evaluated architecture across 8 dimensions: functional completeness, NFRs, security, data architecture, integrations, operational concerns, complexity, and decision rationale.
2. Found and resolved **3 Critical Issues** directly in `architecture.md`:
   - **CI-01:** Existing page was a `<table>` layout — incompatible with card-based design; table→card migration elevated to a required P0 task.
   - **CI-02:** `GroceryItem` type location was ambiguous; pinned to `client/src/types.ts`.
   - **CI-03:** `handleDelete` must remove orphaned ids from `boughtIds` to prevent localStorage accumulation.
3. Found and resolved **4 Significant Concerns** (redundant props, return type inconsistency, `useRef` mount guard pattern, silent write failure risk).
4. Produced `docs/design-review.md` with status **APPROVED WITH CONDITIONS** and marked 6 sections in `architecture.md` with `<!-- Updated by design-reviewer -->` annotations.

---

### Phase 4 — Implementation Planning

**Trigger:** `docs/architecture.md` approved (with design-review corrections applied).

**What happened:**
1. Agent read both `architecture.md` and `design-review.md`.
2. Decomposed work into **12 tasks across 4 priority tiers** (P0–P3).
3. Built a full dependency graph — identified that two tracks (type/layout and storage service) could run in parallel, converging at `GroceryItemRow`.
4. Each task included: description, depends-on, blocks, parallel-with, effort estimate (XS–XL), and definition of done.
5. All 3 critical issues from design review were explicitly represented as P0 prerequisite tasks.

**Parallel execution opportunity identified:**
- Track A: `TASK-001` (type migration) → `TASK-004` (table→card)
- Track B: `TASK-002` (WriteResult) → `TASK-003` (storage service) → `TASK-009` (storage tests)

---

### Phase 5 — Code Implementation

**Trigger:** `docs/impl-plan.md` approved by user.

**What happened:**
1. Agent explored the existing codebase to understand patterns (`notificationStorage`, `AuthContext`, existing routes).
2. Implemented all 12 tasks in P0→P1→P2→P3 dependency order.
3. Produced **9 new/modified files**, **43 new tests** (103 total passing).
4. Applied all architectural decisions from ADRs: separate localStorage key `wbt_grocery_bought`, `WriteResult` return type, `useRef` mounted guard, service encapsulation pattern.

**Files produced:**

| File | Purpose |
|------|---------|
| `client/src/types.ts` | Exported `GroceryItem` interface |
| `client/src/utils/groceryUtils.ts` | Extracted expiry utilities |
| `client/src/services/groceryStorage.ts` | localStorage service (load/save bought IDs) |
| `client/src/pages/GroceryListPage.tsx` | Refactored page with bought state wiring |
| `client/src/pages/grocery/GroceryItemRow.tsx` | Item row component with toggle + ARIA |
| `client/src/pages/grocery/GrocerySection.tsx` | Section component with count badge |
| `client/src/services/__tests__/groceryStorage.test.ts` | 12 unit tests |
| `client/src/pages/grocery/__tests__/GroceryItemRow.test.tsx` | 14 unit tests |
| `client/src/pages/__tests__/GroceryListPage.test.tsx` | 17 integration tests |

---

### Phase 6 — Code Review

**Trigger:** Code implementation complete.

**What happened:**
1. Agent ran `git diff main...HEAD` and evaluated changes across 7 areas.
2. Identified **3 medium-priority issues** requiring fixes before PR:
   - Missing `try/catch` on `localStorage.setItem` for item list (NFR-06 violation)
   - `mockStorage` helper duplicated verbatim in 2 test files (DRY violation)
   - Action buttons (Save/Cancel/Edit/Delete) used `title` not `aria-label` (WCAG 2.1 SC 4.1.2)
3. Produced `docs/review.md` with overall status **Needs Minor Changes**.

All issues were immediately fixed before proceeding to verification.

---

### Phase 7 — Verification

**Trigger:** Review issues fixed.

**What happened (two-track verification):**

**Track 1 — Code:**
- `npm test` in `client/`: **103 tests passed, 0 failed** across 9 test files
- `npx tsc --noEmit`: **0 TypeScript errors** in production files
- 3 pre-existing orphaned test stubs (future features) identified and excluded via vitest config

**Track 2 — Document Quality:**
- All 5 `docs/` files audited for structure, content accuracy, and formatting
- `docs/requirements.md`: PASS — all 13 ACs verified against implementation
- `docs/design-review.md`: PASS — all 5 agreed decisions confirmed in code
- `docs/architecture.md`: LOW issues (prop surface incomplete in one section)
- `docs/impl-plan.md`: LOW issue (status still "Draft") — fixed
- `docs/review.md`: LOW issue (test count off by 2: 43 vs 41) — fixed

**Overall status: WARN** — all KAN-3 tests pass; 2 medium code issues required fixes (applied).

---

### Phase 8 — PR Creation

**Trigger:** Verification passed; all fixes applied; branch pushed to remote.

**What happened:**
1. Agent committed all implementation files with a structured commit message following commitlint conventions.
2. Pushed `feature-expiry` branch to `origin` (handled network retry via GitHub MCP when direct push failed).
3. Created `CHANGELOG.md` from scratch (first changelog for the repo) using Keep a Changelog format.
4. Submitted PR via GitHub MCP with all 5 required sections and a **22-item dynamic reviewer checklist** tailored to the actual diff.

**PR:** https://github.com/santoshhawle/grocery-list-tracker/pull/1

---

## Claude Code Features Used

### 1. Skills System

Skills are reusable, named workflow definitions stored in `.claude/skills/`. Each skill defines what it does, how to invoke it, prerequisites, and output contracts.

**How invoked:** User types `@"skill-name (agent)"` or `/skill-name` in the prompt. Claude Code loads the skill's instruction file and launches the corresponding sub-agent.

**Skills used in this session:**

| Skill | File | Role |
|-------|------|------|
| `jira-requirements-analyst` | `.claude/skills/jira-requirements-analyst/` | Fetch JIRA ticket, clarify, write requirements |
| `system-architect` | `.claude/skills/system-architect/` | Design architecture from requirements |
| `design-reviewer` | `.claude/skills/design-reviewer/` | Validate architecture across 8 dimensions |
| `architecture-task-planner` | `.claude/skills/architecture-task-planner/` | Break architecture into prioritized task list |
| `code-implementer` | `.claude/skills/code-implementer/` | Write production code from plan |
| `pr-review-agent` | `.claude/skills/pr-review-agent/` | Structured 7-area code review |
| `verify-agent` | `.claude/skills/verify-agent/` | Two-track code + docs verification |
| `pr-lifecycle-creator` | `.claude/skills/pr-lifecycle-creator/` | Create complete PR via GitHub MCP |

**Why skills instead of direct prompting:**  
Skills encode the *institutional knowledge* of each pipeline step — what questions to ask, what to check, what format to produce. They are reusable across tickets and projects, ensuring every story gets the same quality gates.

---

### 2. Sub-Agents (Agent Tool)

Each skill is backed by a **specialized sub-agent** launched via the `Agent` tool with `subagent_type`. Sub-agents run in isolated contexts — they have their own tool access, their own reasoning, and return a single result to the orchestrator.

**Why sub-agents:**
- **Context isolation:** Each phase's work doesn't pollute the next phase's context window.
- **Specialization:** Each agent has a tailored system prompt for its role (architect, reviewer, etc.).
- **Parallelism:** Independent agents can run concurrently (e.g., code verification tracks).
- **Resumability:** Agents return an `agentId` — the orchestrator can `SendMessage` to continue them after human input.

**Agent interaction pattern used:**

```
User → Orchestrator (Claude Code)
         └─ Agent tool (subagent_type="jira-requirements-analyst")
               ├─ MCP tool: getJiraIssue
               ├─ Presents questions to user (via orchestrator)
               ├─ User answers
               └─ Writes docs/requirements.md → returns summary
         └─ Agent tool (subagent_type="system-architect")
               ├─ Read docs/requirements.md
               ├─ Glob/Grep codebase
               └─ Writes docs/architecture.md → returns summary
         ... (each phase)
```

---

### 3. MCP (Model Context Protocol)

MCP servers extend Claude Code with authenticated access to external services. Two MCP servers were active in this session:

#### JIRA MCP

| Tool Used | Why |
|-----------|-----|
| `mcp__jira__getAccessibleAtlassianResources` | Retrieve the Atlassian cloud ID for the workspace |
| `mcp__jira__getJiraIssue` | Fetch full ticket KAN-3 — title, description, acceptance criteria, labels, linked issues, status |

**Why JIRA MCP instead of copy-paste:**  
The agent fetched the canonical, live ticket — including acceptance criteria that a developer might miss when copying manually. It also allowed the agent to reference the ticket ID in commit messages and PR descriptions programmatically.

#### GitHub MCP

| Tool Used | Why |
|-----------|-----|
| `mcp__github__get_me` | Identify the authenticated GitHub user for PR attribution |
| `mcp__github__create_or_update_file` | Create/update `CHANGELOG.md` on the remote branch |
| `mcp__github__push_files` | Push multiple files in a single commit when direct `git push` failed due to network |
| `mcp__github__create_pull_request` | Submit the PR with full description, body, and metadata |
| `mcp__github__list_branches` | Verify `feature-expiry` branch exists on remote before PR creation |
| `mcp__github__get_file_contents` | Read existing remote file SHAs before updating (required for file update API) |

**Why GitHub MCP instead of `gh` CLI:**  
The GitHub MCP provided authenticated API access that remained available even when the local network could not reach `github.com:443` directly. The pr-lifecycle-creator agent fell back to MCP when `git push` failed, transparently recovering.

---

### 4. CLAUDE.md

`CLAUDE.md` is the project-level instruction file that Claude Code loads automatically for every session in the repository. It acts as a persistent "team handbook" for the AI.

**Location:** `C:\2026\AI\Cloude Code\capstone project\CLAUDE.md`

**What it provided in this session:**

| Section | How it was used |
|---------|----------------|
| **Project Overview** | Agents understood this was a monorepo with `server/` and `client/` — prevented targeting the wrong project |
| **Commands** | `code-implementer` and `verify-agent` knew exactly which commands to run (`npm test`, `npx tsc --noEmit`, `npx vitest run`) without guessing |
| **Architecture** | Agents understood existing patterns (`notificationStorage`, `AuthContext`, `localStorage` key naming `wbt_*`) and followed them |
| **Commit Convention** | Commits were automatically formatted as `feat(client): ...`, `docs(requirements): ...` with the correct type and scope |
| **Pre-commit Hook** | Agents knew the hook blocks `console.log` in production files and TypeScript errors — the `console.error` in `groceryStorage.ts` catch block was correct and intentional |
| **SDLC Pipeline** | Defined the 8-step pipeline and artifact naming convention (`docs/requirements.md`, etc.) that all agents respected |

**Why CLAUDE.md matters:**  
Without it, every agent would need to re-discover project conventions through codebase exploration. CLAUDE.md provides "zero-ramp" context — agents behave like a team member who has read the project wiki.

---

### 5. Git Hooks (Husky + commitlint)

The project enforces code quality and commit discipline via two automated hooks:

#### Pre-commit Hook (`./husky/pre-commit`)

Blocks commits that contain:
- `console.log` in production TypeScript files (`.ts`, `.tsx` — excluding test files)
- Hardcoded secrets (API keys, passwords in plain text)
- TypeScript compilation errors in either `client/` or `server/`

**Impact on this session:**  
The `code-implementer` agent was aware of the `console.log` restriction (via CLAUDE.md) and used `console.error` for error logging instead. The verify-agent validated TypeScript before commit so the hook would not fire.

#### commit-msg Hook (commitlint)

Enforces the format: `<type>(<scope>): <description>`

Valid types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`  
Required scopes: `requirements`, `architecture`, `client`, `server`, `api`, etc.

**Impact on this session:**  
All commits produced by agents followed this format:
- `docs(requirements): capture requirements for KAN-3 - Mark Grocery Items as Bought`
- `feat(client): implement KAN-3 mark grocery item as bought`

Agents read the convention from CLAUDE.md and applied it — the hooks passed on every commit without needing `--no-verify`.

---

### 6. Memory System

Claude Code's file-based memory at `.claude/projects/.../memory/` persisted cross-session user preferences and project context.

**Used for:**
- Remembering user's preferred interaction style
- Tracking that this project uses the 8-step agentic SDLC pattern
- Storing project-specific conventions discovered during the session

---

### 7. Parallel Tool Execution

Claude Code can execute multiple independent tool calls in a single message. This was used throughout:

- Reading multiple source files simultaneously before applying fixes (e.g., reading `GroceryListPage.tsx`, `GroceryItemRow.tsx`, `groceryStorage.ts`, both test files, `vite.config.ts`, and docs files in a single parallel batch before writing any fixes)
- Running `git remote -v`, `git status`, and `git log` simultaneously
- Launching independent research queries in parallel within sub-agents

---

### 8. Human Approval Gates

Each phase ended with an explicit human decision point. Claude Code did not advance automatically:

| Gate | What the human approved |
|------|------------------------|
| After Phase 1 | Requirements document — confirmed scope, ACs, out-of-scope |
| After Phase 2 | Architecture — confirmed component design, ADRs |
| After Phase 3 | Design review — accepted critical issues and resolutions |
| After Phase 4 | Implementation plan — confirmed 12-task breakdown and priorities |
| After Phase 6 | Review findings — authorized fixing all issues before verification |
| After Phase 7 | Verification report — confirmed all checks passed |

This "human in the loop" pattern is a core principle of agentic SDLC: agents automate the *execution*, humans own the *decisions*.

---

## Pipeline Architecture Diagram

```
User (JIRA Ticket ID: KAN-3)
        │
        ▼
┌─────────────────────────┐
│  jira-requirements-     │  ← MCP: JIRA (getJiraIssue)
│  analyst                │  → docs/requirements.md
└────────────┬────────────┘
             │ [Human approves]
             ▼
┌─────────────────────────┐
│  system-architect       │  ← Read: docs/requirements.md
│                         │  ← Glob/Grep: codebase patterns
└────────────┬────────────┘  → docs/architecture.md
             │ [Human approves]
             ▼
┌─────────────────────────┐
│  design-reviewer        │  ← Read: docs/architecture.md
│                         │  → docs/design-review.md
└────────────┬────────────┘  → docs/architecture.md (updated)
             │ [Human approves]
             ▼
┌─────────────────────────┐
│  architecture-task-     │  ← Read: docs/architecture.md
│  planner                │  ← Read: docs/design-review.md
└────────────┬────────────┘  → docs/impl-plan.md
             │ [Human approves]
             ▼
┌─────────────────────────┐
│  code-implementer       │  ← Read: docs/requirements.md
│                         │  ← Read: docs/impl-plan.md
│                         │  ← Glob/Grep/Read: codebase
│                         │  ← Bash: npm test, tsc
└────────────┬────────────┘  → 9 source/test files
             │ [Human approves]
             ▼
┌─────────────────────────┐
│  pr-review-agent        │  ← Bash: git diff main...HEAD
│                         │  ← Read: changed files
└────────────┬────────────┘  → docs/review.md
             │ [Human approves → fix issues]
             ▼
┌─────────────────────────┐
│  verify-agent           │  ← Bash: npm test, tsc --noEmit
│                         │  ← Read: all docs/ files
└────────────┬────────────┘  → Verification report
             │ [Human approves]
             ▼
┌─────────────────────────┐
│  pr-lifecycle-creator   │  ← Bash: git commit, git push
│                         │  ← MCP: GitHub (create_pull_request)
│                         │  ← MCP: GitHub (create_or_update_file)
└────────────┬────────────┘  → PR #1 + CHANGELOG.md
             │
             ▼
  https://github.com/santoshhawle/
  grocery-list-tracker/pull/1
```

---

## Key Outcomes

| Metric | Value |
|--------|-------|
| SDLC phases automated | 8 of 8 |
| JIRA ticket to PR | Single session |
| Lines of production code produced | ~450 |
| Test files created | 3 |
| Tests written | 43 new (103 total passing) |
| TypeScript errors in production files | 0 |
| WCAG 2.1 AA compliance | Yes (aria-labels, 44px touch targets) |
| SDLC artifacts committed | 5 docs (`requirements`, `architecture`, `design-review`, `impl-plan`, `review`) |
| Human interventions required | 7 approval gates + 1 clarification answer |
| Agent-discovered and auto-fixed issues | 3 critical + 4 significant (design review) + 3 medium (code review) |

---

## Why This Approach

| Traditional SDLC | Agentic SDLC with Claude Code |
|-----------------|-------------------------------|
| BA writes requirements manually | Agent fetches ticket, asks targeted questions, writes structured docs |
| Architect designs in isolation | Agent reads requirements, explores codebase patterns, produces ADRs |
| Design review is a meeting | Agent evaluates 8 dimensions, flags critical issues, updates docs |
| Dev implements without structured plan | Agent decomposes into dependency-ordered tasks with effort estimates |
| Code review is asynchronous/delayed | Agent reviews immediately, identifies specific file:line issues |
| QA is a separate phase | Agent runs two-track verification (code + docs) automatically |
| PR description is an afterthought | Agent produces full PR with 22-item dynamic checklist |
| Knowledge lives in people's heads | CLAUDE.md + `docs/` artifacts make all decisions traceable and replayable |

The agentic SDLC does not replace human judgment — it amplifies it. Humans still own every architectural decision, every approval gate, and every scope boundary. Agents handle the execution: the research, the writing, the formatting, the testing, the consistency checking.
