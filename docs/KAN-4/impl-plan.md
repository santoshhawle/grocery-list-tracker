# KAN-4 — Implementation Plan: User Login and Registration

**Story:** As a remote team member, I want to create an account and log in so that I can access my personal wellbeing data securely.

**Date:** 2026-06-01  
**Branch:** feature-login  
**Architecture ref:** docs/KAN-4/architecture.md

---

## Ordered Task List

### T-1 — Fix RegisterPage post-registration redirect
| Field | Value |
|-------|-------|
| **File** | `client/src/pages/RegisterPage.tsx` line 35 |
| **Change type** | Bug fix |
| **Change** | `navigate('/dashboard')` → `navigate('/grocery')` |
| **ACs covered** | AC-3, AC-10 |
| **Complexity** | XS |
| **Blocks** | T-5 (RegisterPage tests must verify the fixed path) |

---

### T-2 — Fix PrivateRoute role-guard redirect
| Field | Value |
|-------|-------|
| **File** | `client/src/components/PrivateRoute.tsx` line 21 |
| **Change type** | Bug fix |
| **Change** | `<Navigate to="/dashboard" replace />` → `<Navigate to="/grocery" replace />` |
| **ACs covered** | AC-7 |
| **Complexity** | XS |
| **Blocks** | T-4 (LoginPage tests assert redirect destination after auth) |

---

### T-3 — Server auth integration tests
| Field | Value |
|-------|-------|
| **File** | `server/src/__tests__/auth.test.ts` (new file) |
| **Change type** | New test file |
| **Tests written** | S-1 through S-9 (9 cases — see architecture §5.1) |
| **ACs covered** | AC-1, AC-2, AC-3, AC-4, AC-5 (server side) |
| **Complexity** | M |
| **Blocks** | nothing |
| **Depends on** | nothing (server routes unchanged; can be written in parallel with T-1/T-2) |

---

### T-4 — Client LoginPage unit tests
| Field | Value |
|-------|-------|
| **File** | `client/src/pages/__tests__/LoginPage.test.tsx` (new file) |
| **Change type** | New test file |
| **Tests written** | L-1 through L-7 (7 cases — see architecture §5.2) |
| **ACs covered** | AC-1, AC-2, AC-9 |
| **Complexity** | S |
| **Blocks** | nothing |
| **Depends on** | T-2 (PrivateRoute fix must land before L-4 navigate assertion is meaningful) |

---

### T-5 — Client RegisterPage unit tests
| Field | Value |
|-------|-------|
| **File** | `client/src/pages/__tests__/RegisterPage.test.tsx` (new file) |
| **Change type** | New test file |
| **Tests written** | R-1 through R-7 (7 cases — see architecture §5.3) |
| **ACs covered** | AC-3, AC-4, AC-5, AC-10 |
| **Complexity** | S |
| **Blocks** | nothing |
| **Depends on** | T-1 (BUG-1 fix must be applied before R-2 can assert `/grocery`) |

---

## Dependency Graph

```
T-1 (RegisterPage bug fix)
  └─ blocks T-5 (RegisterPage tests)

T-2 (PrivateRoute bug fix)
  └─ blocks T-4 (LoginPage tests)

T-3 (server tests)        ← no dependencies; can run in parallel with T-1/T-2

T-4 (LoginPage tests)     ← depends on T-2
T-5 (RegisterPage tests)  ← depends on T-1
```

**Critical path:** T-1 → T-5 (or T-2 → T-4)  
**Parallel opportunity:** T-1 + T-2 + T-3 can all be done simultaneously.

---

## Definition of Done

- [ ] `RegisterPage.tsx` line 35 reads `navigate('/grocery')` (not `/dashboard`)
- [ ] `PrivateRoute.tsx` line 21 reads `<Navigate to="/grocery" replace />`
- [ ] `server/src/__tests__/auth.test.ts` exists with all 9 cases (S-1–S-9) passing
- [ ] `client/src/pages/__tests__/LoginPage.test.tsx` exists with all 7 cases (L-1–L-7) passing
- [ ] `client/src/pages/__tests__/RegisterPage.test.tsx` exists with all 7 cases (R-1–R-7) passing
- [ ] `cd server && npm test` exits 0 with no skipped tests
- [ ] `cd client && npm test` exits 0 with no skipped tests
- [ ] `cd client && npx tsc --noEmit` exits 0
- [ ] `cd server && npx tsc --noEmit` exits 0
- [ ] Pre-commit hook passes (no `console.log`, no hardcoded secrets, no TS errors)
- [ ] All 10 ACs from requirements.md are covered by at least one passing test or an explicit "already correct" note in architecture.md

---

## Implementation Notes & Gotchas

### Server test DB isolation (important)
`database.ts` exports a **singleton** `DatabaseSync` instance. You cannot re-import it to get a fresh DB. Use `beforeEach` `DELETE` statements to reset state between tests — this is the established pattern in `logsExport.test.ts`:
```ts
beforeEach(() => {
  db.exec('DELETE FROM wellbeing_logs');
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM teams');
});
```
Do **not** attempt to mock `database.ts` or swap the DB path — that will diverge from the production schema and defeat the point of integration testing.

### Server test imports
Use `supertest` against the exported `app` — no need to start a real HTTP server:
```ts
import { app } from '../index';
import supertest from 'supertest';
const request = supertest(app);
```

### Client mock pattern
All three client mocks are needed for the auth page tests:
```ts
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
vi.mock('../../api', () => ({ api: { auth: { login: mockLogin } } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ login: mockAuthLogin }) }));
```
Check `client/src/pages/__tests__/` for any existing test files — copy their mock setup verbatim to avoid version-specific pitfalls with React Router's `vi.mock`.

### Test file placement
Client tests go in `client/src/pages/__tests__/` (directory must be created if absent).  
Server tests go in `server/src/__tests__/` (directory already exists per `logsExport.test.ts`).

### R-2 test is the regression guard for BUG-1
Test R-2 (`navigate` called with `/grocery`) is the automated safety net for BUG-1. Write it to assert the exact string `/grocery` — this will catch any future accidental reversion to `/dashboard`.

### No new routes, no schema changes
There is nothing to migrate. The server is already fully functional. All 9 server test cases test existing behaviour.
