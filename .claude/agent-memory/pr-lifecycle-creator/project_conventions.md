---
name: grocery-list-tracker project conventions
description: Repo-specific conventions for PR creation, changelog format, commit style, and branch/base branch rules for santoshhawle/grocery-list-tracker
type: project
---

This is the santoshhawle/grocery-list-tracker repo — a monorepo with Express server (`server/`) and React SPA (`client/`).

**Base branch:** `main`

**Commit convention:** commitlint + Husky enforced. Format: `<type>(<scope>): <description>`. Valid types: feat, fix, docs, test, refactor, chore. Required scopes include: client, server, auth, api, pr, ci, deps, config, etc. (full list in CLAUDE.md).

**Pre-commit hook:** blocks commits with `console.log` in production TS files, hardcoded secrets, or TS errors. Always run `npx tsc --noEmit` before committing.

**Changelog:** No CHANGELOG.md existed before PR #1 (KAN-3, 2026-06-01). Created using Keep a Changelog format (https://keepachangelog.com). Sections used: Added, Changed. Unreleased entries use `## [Unreleased] — YYYY-MM-DD`.

**Test stack:** Vitest for both client and server. Client tests live in `client/src/**/__tests__/`. 3 pre-existing orphaned test stubs are excluded via `client/vite.config.ts` — not regressions.

**SDLC pipeline:** 8-step agentic pipeline; artifacts written to `docs/` (requirements.md → architecture.md → design-review.md → impl-plan.md → review.md → verification-report.md). PRs typically include these docs as part of the changeset.

**Why:** Needed to reconstruct conventions from scratch on first PR — recording so future PRs can skip the discovery phase.

**How to apply:** When creating PRs for this repo, always check `docs/` for SDLC artifacts, use Keep a Changelog format, and verify the branch is pushed before calling the GitHub MCP tool (the pre-push is not automatic).
