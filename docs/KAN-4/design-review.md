# KAN-4 — Design Review: User Login and Registration

**Reviewed by:** design-reviewer agent  
**Date:** 2026-06-01  
**Architecture artifact:** `docs/KAN-4/architecture.md`  
**Overall verdict:** APPROVED WITH MINOR NOTES — all blockers resolved below; no architecture changes required

---

## 1. Summary

The architecture is well-scoped and accurate. The two bug fixes are correctly identified and their one-line changes are confirmed against the live source. The test plan is thorough and follows established project patterns. No design changes are needed before implementation.

---

## 2. Architecture Verification Against Source

### 2.1 BUG-1 — RegisterPage.tsx navigate('/dashboard')

**Verified.** `client/src/pages/RegisterPage.tsx` line 35 reads `navigate('/dashboard')`. The fix to `navigate('/grocery')` is correct. `/dashboard` has no corresponding entry in `App.tsx`; `/grocery` is the active default protected route.

### 2.2 BUG-2 — PrivateRoute.tsx role-guard redirect

**Verified.** `client/src/components/PrivateRoute.tsx` line 21 reads `return <Navigate to="/dashboard" replace />;`. The fix to `navigate('/grocery')` is correct and aligns with FR-4.2.

### 2.3 LoginPage.tsx — No changes required

**Confirmed.** All FR-1.x requirements are satisfied by the current implementation. The `navigate('/grocery')` redirect, error display, loading state, demo credentials card, and `/register` link are all present and correct.

### 2.4 AuthContext.tsx — No changes required

**Confirmed.** Rehydration from localStorage, corrupt-data guard, `isLoading` initialised to `true`, and `clearUserData` called only when `user !== null` are all implemented correctly.

### 2.5 Server auth routes — No changes required

**Confirmed.** `server/src/routes/auth.ts` implements all required validation, bcrypt cost-12 hashing, email normalisation, duplicate-email 409 response, JWT 7-day sign, and team create-or-join. No changes needed.

---

## 3. Test Architecture Review

### 3.1 Server integration tests pattern

The architecture correctly identifies the `vi.mock('../database', ...)` in-memory `:memory:` SQLite pattern from `logsExport.test.ts`. This pattern:

- Avoids touching the production `wellbeing.db` file
- Requires all three tables (`teams`, `users`, `wellbeing_logs`) to be created inside the mock factory — not just `users` and `teams`
- Uses a `supertest` wrapper around an Express app created inline (not the singleton `app` from `index.ts`)

**Recommendation (non-blocking):** The architecture's Section 5.1 mentions `import { app } from '../index'` as the test setup pattern. However, `logsExport.test.ts` builds a minimal Express app inline (`makeApp()`) rather than importing the full `app`. This avoids pulling in all middleware, rate limiters, and the startup side effects of `index.ts`. The implementation should follow `logsExport.test.ts`'s `makeApp()` pattern — import only `authRouter` and mount it directly — rather than importing the full `app` from `index.ts`.

**Impact:** Minor. The architecture's intent is correct; only the import strategy needs adjustment during implementation. No architecture revision required.

### 3.2 Database schema in test mock

The architecture's mock creates only `users` and `teams` tables. The auth routes do not reference `wellbeing_logs`, so this is sufficient. However, if the test file imports `app` from `index.ts` (see 3.1 above), the `wellbeing_logs` table must also be present to avoid a startup error. If using `makeApp()` with only the auth router, the two-table schema is correct.

### 3.3 beforeEach cleanup strategy

The architecture recommends `DELETE FROM users; DELETE FROM teams;` in `beforeEach`. This is the correct approach and consistent with `logsExport.test.ts`'s `DELETE FROM wellbeing_logs` pattern. Cascading foreign keys (`ON DELETE CASCADE` / `ON DELETE SET NULL`) mean only `users` and `teams` need to be deleted; `wellbeing_logs` rows referencing deleted users are removed automatically.

**Note:** Teams must be deleted after users (or with foreign keys respected) to avoid constraint errors. Recommended order: `DELETE FROM users` first (this nullifies `team_id` due to `ON DELETE SET NULL`), then `DELETE FROM teams`.

### 3.4 Client test mocking strategy

The mocking strategy described (mock `../api`, mock `useAuth`, mock `useNavigate`) is standard and consistent with the project's existing client test files. No issues.

### 3.5 Test case R-6 — teamName blank submitted as undefined

**Verified against source.** `RegisterPage.tsx` line 32: `teamName: form.teamName.trim() || undefined`. When the field is blank, `undefined` is passed to `api.auth.register`. Test R-6 verifies this correctly. The implementation should use `toEqual(expect.not.objectContaining({ teamName: expect.anything() }))` or check that the argument to `api.auth.register` has no `teamName` key.

---

## 4. Security Review

| Check | Status | Notes |
|-------|--------|-------|
| Passwords hashed with bcrypt cost 12 | Pass | `server/src/routes/auth.ts` line 41 |
| JWT signed with env-provided secret | Pass | `JWT_SECRET` read from env in `middleware/auth.ts` |
| Rate limit on auth routes | Pass | Existing 15 req/15 min limiter in `index.ts` |
| No plain-text password logging | Pass | No `console.log` in auth route; pre-commit hook enforces |
| Email normalisation (lowercase + trim) | Pass | Lines 33-34 of `auth.ts` |
| Token stored only in localStorage (not cookies) | Pass | Acceptable for this application; no XSS mitigations are in scope |
| 401 clears token and redirects | Pass | `api.ts` lines 34-37 |
| Password < 8 validated server-side as well as client-side | Pass | Server: `auth.ts` lines 27-30; Client: `RegisterPage.tsx` line 24 |

No security issues identified.

---

## 5. Consistency with Project Conventions

| Convention | Status | Notes |
|------------|--------|-------|
| Commit format `<type>(<scope>): <description>` | N/A (pipeline concern) | Bug fixes → `fix(client):` scope; new tests → `test(client):` / `test(server):` |
| No `console.log` in production files | Pass | No `console.log` in any modified file |
| vitest + `@testing-library/react` for client tests | Pass | Consistent with existing test files |
| vitest + supertest + in-memory SQLite for server tests | Pass | Consistent with `logsExport.test.ts` |
| `vi.mock` hoisted before imports | Pass | Architecture correctly notes this requirement |
| TypeScript strict mode | Pass | No new TypeScript surface area introduced by bug fixes |

---

## 6. Scope Discipline

The architecture correctly excludes:
- Password reset / forgot password
- OAuth / social login
- Email verification
- Two-factor authentication
- Server-side token blacklist

The cosmetic gap (GAP-1: ShoppingCart vs Heart icon on LoginPage) is correctly deferred as low-priority out-of-scope. No scope creep identified.

---

## 7. Implementation Order Endorsement

The recommended implementation order in Section 10 of the architecture is sound:

1. Fix `RegisterPage.tsx` (BUG-1) — smallest change, immediately verifiable
2. Fix `PrivateRoute.tsx` — one-line, no regression risk
3. Write `server/src/__tests__/auth.test.ts`
4. Write `client/src/pages/__tests__/LoginPage.test.tsx`
5. Write `client/src/pages/__tests__/RegisterPage.test.tsx`
6. Run full test suite

This order means the two bug fixes can be manually verified immediately, before any test scaffolding is added.

---

## 8. Issues Requiring Attention

### MINOR-1 — Server test: use makeApp() pattern, not full app import (non-blocking)

**Location:** Architecture Section 5.1  
**Description:** The note says `import { app } from '../index'`, but the project pattern (from `logsExport.test.ts`) is to build a minimal Express app inline and mount only the relevant router. The implementer should follow that pattern.  
**Action:** Implement `makeApp()` that creates `express()`, adds `express.json()`, and mounts only `authRouter` at `/api/auth`.  
**Blocking:** No — the architecture intent is correct; this is an implementation-level guidance.

### MINOR-2 — beforeEach cleanup order: delete users before teams (non-blocking)

**Location:** Architecture Section 5.1  
**Description:** The schema uses `team_id REFERENCES teams(id) ON DELETE SET NULL`. When deleting test data, users should be cleared before teams to respect foreign key constraints (though with `PRAGMA foreign_keys = ON`, SQLite will nullify `team_id` on team delete anyway). Explicit ordering avoids ambiguity.  
**Action:** `beforeEach` hook should run `DELETE FROM users` then `DELETE FROM teams`.  
**Blocking:** No.

---

## 9. Final Verdict

| Category | Result |
|----------|--------|
| Bug identification accuracy | Correct |
| Scope (no over-engineering) | Correct |
| Test architecture | Correct with minor implementation notes |
| Security | No issues |
| Codebase consistency | Consistent |
| Requirements coverage | Full (all AC 1–10 addressed) |

**Verdict: APPROVED.** The architecture is ready for implementation planning. No changes to `architecture.md` are required. The two minor notes (MINOR-1, MINOR-2) are implementation-level guidance to be followed by the `code-implementer` agent — they do not require an architecture revision.
