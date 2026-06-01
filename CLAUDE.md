# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Remote Wellbeing Tracker** — a monorepo containing an Express/Node.js API server (`server/`) and a React SPA (`client/`), plus SDLC pipeline tooling in `.claude/`.

---

## Commands

### Root (run both together)
```bash
npm run install:all      # install all dependencies (root + server + client)
npm run dev              # start server (port 3001) + client (port 5173) concurrently
```

### Server (`cd server`)
```bash
npm run dev              # tsx watch with --experimental-sqlite flag
npm run build            # tsc compile to dist/
npm run start            # run compiled dist/index.js
npm test                 # vitest run (all server tests)
npx vitest run <pattern> # run a single test file or test name pattern
```

### Client (`cd client`)
```bash
npm run dev              # vite dev server at localhost:5173
npm run build            # tsc + vite build to dist/
npm test                 # vitest run (all client tests)
npm run test:watch       # vitest in watch mode
npx vitest run <pattern> # run a single test file or test name pattern
```

### Type checking
```bash
cd client && npx tsc --noEmit
cd server && npx tsc --noEmit
```

---

## Environment Setup

Copy `server/.env.example` to `server/.env` and set:
- `PORT` — defaults to `3001`
- `JWT_SECRET` — must be changed in production
- `CLIENT_URL` — defaults to `http://localhost:5173`

A demo user (`demo@example.com` / `password123`) is seeded automatically on first server start.

---

## Architecture

### Server (`server/src/`)

**Database** (`database.ts`): Single `DatabaseSync` instance using Node.js 22's built-in `node:sqlite` module (requires `--experimental-sqlite` flag). WAL mode enabled. Three tables: `teams`, `users`, `wellbeing_logs`. The DB file lives at `server/data/wellbeing.db`. The module is imported as a singleton — all routes share the same instance.

**Auth flow**: JWT tokens signed with `JWT_SECRET`, 7-day expiry. The `authenticate` middleware in `middleware/auth.ts` attaches `req.user` (type `JWTPayload`) to every protected request. Manager-only routes additionally call `requireManager`. All routes under `/api/logs`, `/api/suggestions`, `/api/team`, `/api/calendar` are behind `authenticate`. Auth routes (`/api/auth`) have a stricter rate limit (15 req/15 min vs 200 global).

**Routes**:
- `routes/auth.ts` — register (creates or joins a team by name) + login
- `routes/logs.ts` — CRUD for daily wellbeing logs; `GET /export` streams CSV via `utils/csvSerialize.ts`
- `routes/suggestions.ts` — rule-based wellbeing suggestions derived from recent log averages
- `routes/team.ts` — manager-only aggregated team insights
- `routes/calendar.ts` — calendar block suggestions based on personal day-of-week patterns

**CSV export** (`utils/csvSerialize.ts`): RFC 4180 compliant; prepends UTF-8 BOM for Excel; neutralises CSV injection by prefixing `=`, `+`, `-`, `@` with a tab.

### Client (`client/src/`)

**API layer** (`api.ts`): Single `api` object wraps all `fetch` calls. JWT token read from `localStorage` key `wbt_token`. On 401, token is cleared and user is redirected to `/login`. The `exportCsv` method triggers a browser download via a created anchor element.

**Auth state** (`contexts/AuthContext.tsx`): Rehydrates from `localStorage` (`wbt_token` + `wbt_user`) on mount. `useAuth()` hook exposes `user`, `isLoading`, `login`, `logout`. `PrivateRoute` redirects unauthenticated users to `/login`.

**Notification system**: Three-layer design:
1. `services/notificationService.ts` — pure wrapper around the Browser Notifications API (zero React deps)
2. `services/notificationStorage.ts` — `localStorage`-backed persistence for notification settings and daily check-in flags (keyed by `userId`)
3. `hooks/useNotificationScheduler.ts` — React hook that schedules `setTimeout`-based notifications; handles midnight reset, stale flag cleanup, and auth-loading guard

**Routing**: React Router 6. Currently active routes: `/login`, `/register`, `/grocery`. All other paths redirect to `/grocery`.

**Vite proxy**: In dev, `/api/*` is proxied to `http://localhost:3001` — no CORS issues when running both servers.

---

## Commit Convention

Commits are enforced by commitlint + Husky. Format: `<type>(<scope>): <description>`

**Types:** `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

**Required scopes:** `requirements`, `architecture`, `design-review`, `impl-plan`, `implementation`, `tests`, `pr`, `ci`, `deps`, `config`, `auth`, `api`, `client`, `server`

Example: `feat(client): add grocery item bought toggle`

**Pre-commit hook** (`./husky/pre-commit`) blocks commits that contain `console.log` in production TypeScript files, hardcoded secrets, or TypeScript errors in either sub-project.

---

## SDLC Pipeline

This repo uses an 8-step agentic SDLC. All agents live in `.claude/agents/`, slash commands in `.claude/commands/`.

| Slash Command | Purpose |
|---|---|
| `/sdlc-start <ticket>` | Start full pipeline for a story |
| `/sdlc-status` | Show pipeline state (reads docs/) |
| `/sdlc-next` | Advance to the next step |
| `/sdlc-approve` | Approve current gate and proceed |

Pipeline artifacts are written to `docs/`: `requirements.md` → `architecture.md` → `design-review.md` → `impl-plan.md` → `review.md` → `verification-report.md`.

Story specs for in-progress work are kept in `docs/` (e.g., `docs/kan-3-mark-item-bought.md`).
