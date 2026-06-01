# KAN-4 — Architecture Design: User Login and Registration

**Story:** As a remote team member, I want to create an account and log in so that I can access my personal wellbeing data securely.

**Date:** 2026-06-01
**Branch:** feature-login
**Status:** Architecture — awaiting review

---

## 1. Overview

KAN-4 is a **bug-fix and gap-closure story** — the server-side auth endpoints are already complete and production-ready. Work is concentrated on the client side (two pages, one context, one guard component) and on adding missing test coverage for both the server auth routes and the client auth forms.

No new files need to be created. Every change targets an existing file. This keeps the diff small and reviewable.

---

## 2. Scope of Changes

| Area | File | Change Type | Summary |
|------|------|-------------|---------|
| Client — Page | `client/src/pages/RegisterPage.tsx` | Bug fix | Fix BUG-1: `navigate('/dashboard')` → `navigate('/grocery')` |
| Client — Component | `client/src/components/PrivateRoute.tsx` | Bug fix | Fix stale redirect: `navigate('/dashboard')` → `navigate('/grocery')` for role guard |
| Client — Tests | `client/src/pages/__tests__/LoginPage.test.tsx` | New file | Unit tests for LoginPage form behaviour (GAP-3) |
| Client — Tests | `client/src/pages/__tests__/RegisterPage.test.tsx` | New file | Unit tests for RegisterPage form behaviour (GAP-3) |
| Server — Tests | `server/src/__tests__/auth.test.ts` | New file | Integration tests for POST /api/auth/register and POST /api/auth/login (GAP-2) |

No changes are required to:
- `server/src/routes/auth.ts` — already implements all FR requirements correctly
- `client/src/api.ts` — already implements 401-auto-clear and correct auth helpers
- `client/src/contexts/AuthContext.tsx` — already implements all FR-3.x and FR-5.x requirements
- `client/src/App.tsx` — route table is correct; `RegisterPage` fix resolves the redirect mismatch

---

## 3. Client Architecture

### 3.1 RegisterPage.tsx — Bug Fix

**Location:** `client/src/pages/RegisterPage.tsx` line 35

**Current (broken):**
```ts
navigate('/dashboard');
```

**Target (correct):**
```ts
navigate('/grocery');
```

This is the only required change. All other requirements (FR-2.1 through FR-2.8) are already satisfied by the existing implementation:
- Full name, email, password, role, optional teamName fields — present
- Client-side password length guard (`>= 8 chars`) — present at line 24
- `autoComplete="new-password"` on password field — present
- Submit button disabled during loading — present
- Error display for server-returned errors — present
- Link to `/login` — present
- Role defaults to `'user'` — present via initial state

### 3.2 PrivateRoute.tsx — Bug Fix

**Location:** `client/src/components/PrivateRoute.tsx` line 21

**Current (broken):**
```ts
return <Navigate to="/dashboard" replace />;
```

**Target (correct):**
```ts
return <Navigate to="/grocery" replace />;
```

`/dashboard` is not a registered route in `App.tsx`. The role-guard redirect should send non-managers to the current application home (`/grocery`), which is what FR-4.2 requires.

### 3.3 LoginPage.tsx — No Changes Required

All FR-1.x requirements are already satisfied:
- `type="email"` + `autoComplete="email"` — present
- `type="password"` + `autoComplete="current-password"` — present
- Redirect to `/grocery` on success — present
- Error display on 401 — present (via caught Error.message)
- Loading state / disabled submit — present
- Demo credentials displayed — present (the card at bottom of form)
- Link to `/register` — present

GAP-1 (ShoppingCart icon vs Heart icon) is cosmetic and explicitly low-priority; it is **not addressed** in this story.

### 3.4 AuthContext.tsx — No Changes Required

All FR-3.x and FR-5.x requirements are already satisfied:
- Rehydration from localStorage on mount — present (`useEffect`)
- Corrupt data handled silently — present (try/catch resets to `null`)
- `isLoading` guard — present
- `clearUserData` only called when user is non-null — present (`if (user) clearUserData(user.id)`)

---

## 4. Server Architecture

### 4.1 auth.ts routes — No Changes Required

The existing `POST /api/auth/register` and `POST /api/auth/login` handlers already implement:
- Input validation (type checks, length checks)
- Email normalisation (lowercase, trim, max 254 chars)
- bcrypt cost-12 hashing
- Duplicate email → HTTP 409 `{ error: 'Email already registered' }`
- Invalid credentials → HTTP 401 `{ error: 'Invalid credentials' }`
- JWT sign with 7-day expiry
- Team create-or-join by name

---

## 5. Test Architecture

### 5.1 Server Integration Tests — `server/src/__tests__/auth.test.ts`

**Test runner:** vitest  
**Approach:** In-memory SQLite database (`:memory:`) with the same schema as production, imported directly. No HTTP server needed — route handlers are tested at the Express router level using `supertest`.

**Test setup pattern** (matches existing pattern in `logsExport.test.ts`):
```ts
import { app } from '../index';
import supertest from 'supertest';
const request = supertest(app);
```

**Test cases:**

| Test ID | Endpoint | Scenario | Expected |
|---------|----------|----------|---------|
| S-1 | POST /api/auth/register | Valid payload | HTTP 201, `{ token, user }` — user has correct name/email/role |
| S-2 | POST /api/auth/register | Duplicate email | HTTP 409, `{ error: 'Email already registered' }` |
| S-3 | POST /api/auth/register | Missing required field (no name) | HTTP 400 |
| S-4 | POST /api/auth/register | Password < 8 chars | HTTP 400 |
| S-5 | POST /api/auth/register | With teamName — team created | HTTP 201, team row exists in DB |
| S-6 | POST /api/auth/login | Valid credentials | HTTP 200, `{ token, user }` |
| S-7 | POST /api/auth/login | Wrong password | HTTP 401, `{ error: 'Invalid credentials' }` |
| S-8 | POST /api/auth/login | Unknown email | HTTP 401 |
| S-9 | POST /api/auth/login | Missing fields | HTTP 400 |

**Database isolation:** Each test file gets a fresh in-memory database via `beforeEach` reset or a test-scoped setup. The existing `database.ts` singleton pattern means the test file must either reset the DB state between tests or use a per-test DB instance via dependency injection.

> **Implementation note:** Because `database.ts` exports a singleton, the recommended approach is to `DELETE FROM users; DELETE FROM teams;` in a `beforeEach` hook rather than re-importing the module. This matches the established pattern in `logsExport.test.ts`.

### 5.2 Client Unit Tests — LoginPage

**File:** `client/src/pages/__tests__/LoginPage.test.tsx`  
**Test runner:** vitest + `@testing-library/react`  
**Mocking strategy:** Mock `../api` module (vi.mock); mock `../contexts/AuthContext` to expose a spy `login` function; mock `react-router-dom`'s `useNavigate`.

**Test cases:**

| Test ID | Scenario | Expected |
|---------|----------|---------|
| L-1 | Renders email input with `type="email"` | Input present with correct type |
| L-2 | Renders password input with `type="password"` | Input present with correct type |
| L-3 | Submit button disabled while loading | Button disabled after submit, re-enabled on completion |
| L-4 | Successful login — `login()` called, navigate to `/grocery` | `login` spy called with token+user; `navigate` called with `/grocery` |
| L-5 | Server returns 401 error | Error message rendered; no navigation |
| L-6 | Demo credentials card rendered | Text "demo@example.com" visible on page |
| L-7 | Link to `/register` present | Anchor with href `/register` in DOM |

### 5.3 Client Unit Tests — RegisterPage

**File:** `client/src/pages/__tests__/RegisterPage.test.tsx`  
**Test runner:** vitest + `@testing-library/react`  
**Mocking strategy:** Same as LoginPage tests.

**Test cases:**

| Test ID | Scenario | Expected |
|---------|----------|---------|
| R-1 | Password < 8 chars — client-side error shown, API not called | Error text rendered; `api.auth.register` not called |
| R-2 | Successful registration — navigate to `/grocery` (not `/dashboard`) | `navigate` called with `/grocery` |
| R-3 | Server returns 409 duplicate email error | "Email already registered" rendered |
| R-4 | Submit button disabled while loading | Button disabled during in-flight request |
| R-5 | Role field defaults to `user` | Select element has value `user` on render |
| R-6 | teamName left blank — submitted as `undefined` | `api.auth.register` called without `teamName` key |
| R-7 | Link to `/login` present | Anchor with href `/login` in DOM |

---

## 6. Data Flow

### Login Flow

```
User fills LoginPage form
  → handleSubmit() called
  → setLoading(true), setError('')
  → api.auth.login(email, password) [POST /api/auth/login]
     → server: lookup user by email, bcrypt.compare
     → server: jwt.sign({ id, email, name, role, teamId }, JWT_SECRET, 7d)
     → server: return { token, user }
  → client: AuthContext.login(token, user)
     → storeAuth(): localStorage.setItem('wbt_token', token) + localStorage.setItem('wbt_user', JSON.stringify(user))
     → setUser(user)
  → navigate('/grocery')
  → PrivateRoute renders <Outlet /> (user is set, isLoading is false)
```

### Registration Flow

```
User fills RegisterPage form
  → handleSubmit() called
  → client-side guard: password.length < 8 → setError(), return early
  → setLoading(true)
  → api.auth.register({ name, email, password, role, teamName? }) [POST /api/auth/register]
     → server: validate inputs, normalise email
     → server: bcrypt.hashSync(password, 12)
     → server: create/join team if teamName provided
     → server: INSERT INTO users
     → server: jwt.sign, return { token, user }
  → client: AuthContext.login(token, user)
  → navigate('/grocery')   ← BUG-1 fix applied here
```

### Session Rehydration Flow (on app mount)

```
AuthProvider useEffect fires
  → isLoading = true (initial state)
  → localStorage.getItem('wbt_token') + 'wbt_user'
  → if both present: setUser(JSON.parse(storedUser))
  → if corrupt: clearAuth() (silently)
  → isLoading = false
→ PrivateRoute checks isLoading:
    if true  → render spinner (never redirect)
    if false, no user → <Navigate to="/login" />
    if false, user present → <Outlet />
```

### 401 Auto-Logout Flow

```
api.request() receives res.status === 401
  → localStorage.removeItem('wbt_token')
  → localStorage.removeItem('wbt_user')
  → window.location.href = '/login'
  (AuthContext state reset happens implicitly on navigation + re-mount)
```

---

## 7. Acceptance Criteria Coverage

| AC | Requirement | Where Addressed |
|----|-------------|----------------|
| AC-1 | Valid login → `/grocery` | LoginPage.tsx (already correct) |
| AC-2 | Wrong password → error shown | LoginPage.tsx error display + api.ts 401 throw |
| AC-3 | Registration → `/grocery` | RegisterPage.tsx BUG-1 fix |
| AC-4 | Duplicate email → error shown | RegisterPage.tsx error display |
| AC-5 | Password < 8 → client error | RegisterPage.tsx line 24 guard |
| AC-6 | Browser refresh → session restored | AuthContext.tsx rehydration (already correct) |
| AC-7 | Unauthenticated → `/login` | PrivateRoute.tsx (already correct) |
| AC-8 | Logout → localStorage cleared | AuthContext.tsx logout() (already correct) |
| AC-9 | 401 while browsing → `/login` | api.ts auto-clear (already correct) |
| AC-10 | Register redirect → `/grocery` | RegisterPage.tsx BUG-1 fix |

---

## 8. Non-Functional Requirements Coverage

| NFR | How Met |
|-----|---------|
| NFR-1 (bcrypt cost 12) | `server/src/routes/auth.ts` line 41 — `bcrypt.hashSync(password, 12)` |
| NFR-2 (rate limit 15/15min) | `server/src/index.ts` auth route rate limiter (existing) |
| NFR-3 (JWT_SECRET from env) | `server/src/middleware/auth.ts` — reads `process.env.JWT_SECRET` |
| NFR-4 (accessible labels) | Both pages already use `<label htmlFor="...">` on all inputs |
| NFR-5 (responsive, min 320px) | Both pages use `max-w-sm w-full` with `p-4` — suitable for 320px+ |
| NFR-6 (no console.log) | No console.log calls present in any modified file |

---

## 9. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Server test DB isolation — singleton `database.ts` makes per-test DB reset tricky | Medium | Use `beforeEach` DELETE statements; document pattern clearly |
| Client test mocking of `useNavigate` across React Router versions | Low | Use `vi.mock('react-router-dom', ...)` — pattern already established in other test files in this repo |
| PrivateRoute role-guard redirect bug (`/dashboard`) may affect future manager routes | Low | Fix applied as part of this story; all existing routes are non-manager routes so no regression risk |

---

## 10. Implementation Order

Recommended order to minimise broken intermediate states:

1. Fix `RegisterPage.tsx` (BUG-1) — one-line change, immediately testable
2. Fix `PrivateRoute.tsx` role-guard redirect — one-line change
3. Write server auth integration tests (`auth.test.ts`)
4. Write client `LoginPage.test.tsx`
5. Write client `RegisterPage.test.tsx`
6. Run full test suite to confirm all tests pass
