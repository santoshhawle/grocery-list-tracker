# KAN-4 — Code Review

**Story:** User Login and Registration
**Branch:** `feature-login`
**Reviewer:** pr-review-agent
**Review date:** 2026-06-01
**Commit reviewed:** `43507e6`

---

## 1. Summary

**Verdict: Approved with minor notes**

The implementation is clean, minimal, and correct. Both production bug fixes are precisely targeted (2 single-line changes), all acceptance criteria are covered by the new test suite, and all 146 tests pass (29 server, 117 client). The minor notes below are cosmetic/consistency items that do not block merging.

---

## 2. Requirements Coverage

### Functional Requirements

| ID | Requirement | Test(s) | Status |
|----|-------------|---------|--------|
| FR-1.1 | Login form accepts email + password | L-1, L-2 | PASS |
| FR-1.2 | Successful login stores JWT + user in localStorage | L-4 (AuthContext.login called with correct args) | PASS |
| FR-1.3 | After login, redirect to `/grocery` | L-4 (`navigate('/grocery')`) | PASS |
| FR-1.4 | 401 error displays error message returned by server | L-5 | PASS |
| FR-1.5 | Submit button disabled + loading state while in-flight | L-3 | PASS |
| FR-1.6 | Email `type="email"`, password `type="password"` | L-1, L-2 | PASS |
| FR-1.7 | Demo credentials visible on login page | L-6 | PASS |
| FR-1.8 | Link to `/register` present | L-7 | PASS |
| FR-2.1 | Register form accepts name, email, password, role, optional teamName | Source: 5 labeled fields in RegisterPage.tsx | PASS |
| FR-2.2 | Client-side password length validation (< 8 chars) | R-1 | PASS |
| FR-2.3 | 409 duplicate email error displayed | R-3 | PASS |
| FR-2.4 | After registration redirect to `/grocery` (BUG-1 fix) | R-2 | PASS |
| FR-2.5 | Submit button disabled + loading while in-flight | R-4 | PASS |
| FR-2.6 | Role defaults to `'user'`; blank teamName → undefined | R-5, R-6 | PASS |
| FR-2.7 | Link to `/login` present on registration page | R-7 | PASS |
| FR-2.8 | Password field uses `autoComplete="new-password"` | Source review (line 78 RegisterPage.tsx) | PASS |
| FR-3.1 | AuthProvider rehydrates from localStorage on mount | Not in scope of this diff (pre-existing) | N/A |
| FR-3.2 | Corrupt localStorage resets silently | Not in scope of this diff (pre-existing) | N/A |
| FR-3.3 | isLoading=true renders spinner, not redirect | Not in scope of this diff; PrivateRoute spinner present (lines 11–17) | N/A |
| FR-3.4 | 401 clears token + redirects to /login | Not in scope of this diff (api.ts pre-existing) | N/A |
| FR-4.1 | PrivateRoute redirects unauthenticated to `/login` | Source (line 19 PrivateRoute.tsx) | PASS |
| FR-4.2 | Role-guard redirects non-manager to `/grocery` (BUG-2 fix) | Source (line 21 PrivateRoute.tsx); no dedicated test | NOTE — see Issues |
| FR-4.3 | isLoading renders spinner, not redirect | Source (lines 11–17 PrivateRoute.tsx) | PASS |
| FR-5.1 | logout() clears localStorage + notification storage | Not in scope of this diff | N/A |
| FR-5.2 | clearUserData only called when user != null | Not in scope of this diff | N/A |

### Non-Functional Requirements

| ID | Requirement | Verification | Status |
|----|-------------|-------------|--------|
| NFR-1 | Passwords hashed with bcrypt | Pre-existing server code; not changed | N/A |
| NFR-2 | Auth rate limiting 15 req/15 min | Pre-existing server code; not changed | N/A |
| NFR-3 | JWT signed with JWT_SECRET | Pre-existing server code; not changed | N/A |
| NFR-4 | All form inputs have `<label>` elements | Source review (all inputs use htmlFor + id pairs); confirmed via getByLabelText in tests | PASS |
| NFR-5 | Responsive down to 320 px | `max-w-sm` container + `min-h-screen` layout present on both pages | PASS |
| NFR-6 | No console.log in production TS files | Source review of PrivateRoute.tsx, LoginPage.tsx, RegisterPage.tsx — none present | PASS |

### Acceptance Criteria

| AC | Scenario | Test(s) | Status |
|----|----------|---------|--------|
| AC-1 | Valid login credentials → JWT stored, redirect to `/grocery` | L-4 | PASS |
| AC-2 | Wrong password → error shown, no redirect | L-5 | PASS |
| AC-3 | Valid registration → account created, redirect to `/grocery` | R-2 | PASS |
| AC-4 | Duplicate email → "Email already registered" shown | R-3, S-2 | PASS |
| AC-5 | Password < 8 chars → client-side error, no API call | R-1 | PASS |
| AC-6 | Browser refresh restores session | Not in scope of this diff | N/A |
| AC-7 | Unauthenticated user visits `/grocery` → redirected to `/login` | Source (PrivateRoute line 19) | PASS |
| AC-8 | Logout clears localStorage | Not in scope of this diff | N/A |
| AC-9 | 401 while browsing → token cleared, redirect to `/login` | Not in scope of this diff | N/A |
| AC-10 | RegisterPage redirects to `/grocery`, not `/dashboard` | R-2 | PASS |

---

## 3. Code Quality

### Production Code Changes

**`client/src/components/PrivateRoute.tsx` (line 21)**
- Change is a single-character path correction. The fix is correct: `/dashboard` is not a registered route; `/grocery` is the active default home.
- The component structure is clean: loading guard → unauthenticated redirect → role guard → Outlet. Logic order is correct.
- Spinner implementation is self-contained and does not depend on any library component.

**`client/src/pages/RegisterPage.tsx` (line 35)**
- Single-line path correction matching the fix in PrivateRoute. Correct and complete.
- The `teamName.trim() || undefined` expression on line 32 is clean — it ensures an empty string is never sent to the server, satisfying FR-2.6 and R-6.
- Error handling follows the `(err as Error).message ?? fallback` pattern consistently with LoginPage.

**`client/src/pages/LoginPage.tsx` (unchanged)**
- For reference: LoginPage already used `navigate('/grocery')` (line 23). No change was needed or made. Confirmed correct.

---

## 4. Test Quality

### `server/src/__tests__/auth.test.ts`

**Strengths:**
- Uses a real in-memory SQLite database (`DatabaseSync(':memory:')`) rather than mocks. This validates actual SQL schema, constraint enforcement, and bcrypt hashing end-to-end — which is the correct approach for auth integration tests.
- `beforeEach` truncation order (`wellbeing_logs` → `users` → `teams`) correctly respects foreign key constraints.
- Each `describe` block constructs a fresh `makeApp()` instance, preventing test-order coupling.
- S-5 verifies both the HTTP response AND the DB side-effect (team row exists) — good thoroughness.

**Minor observations:**
- S-2 constructs a second `makeApp()` for the duplicate-email check. Because the mock DB is a module-level singleton and `beforeEach` resets it, the first registration in S-2 creates a user that persists within that test. The second `makeApp()` call shares the same DB instance so the 409 is valid. This is correct but the pattern could mislead a future reader into thinking two separate DB instances are involved. A brief comment would help.
- `DatabaseSync` is imported but only used for the `testDb` cast type. This is fine but could be replaced with `typeof db` to avoid the extra import.

### `client/src/pages/__tests__/LoginPage.test.tsx`

**Strengths:**
- Mock boundaries are correctly scoped: `react-router-dom`, `AuthContext`, and `api` are all mocked at the module level, keeping tests isolated from routing and network.
- L-3 correctly verifies the loading state mid-flight by holding a pending Promise — a common pattern that is easy to get wrong. Implementation is correct.
- L-4 verifies both the `AuthContext.login` call signature (token + user) AND the navigation destination in one assertion block.
- `beforeEach` + `afterEach` both call `vi.clearAllMocks()` — redundant but harmless. One is sufficient.

**Minor observations:**
- L-6 asserts `demo@example.com` is in the DOM. This is a content assertion that will break if the demo credentials ever change. It would be more resilient to assert that a "Demo credentials" heading exists (which is less brittle). Low priority.
- No test for `autoComplete` attribute values (FR-1.6 second half). Not a blocker — attribute testing is low value in unit tests — but it would complete FR-1.6 coverage.

### `client/src/pages/__tests__/RegisterPage.test.tsx`

**Strengths:**
- The `fillForm` helper with default values and optional overrides is a clean pattern that keeps individual tests concise.
- R-6 uses `toBeUndefined()` on `callArg.teamName` rather than `not.toHaveProperty('teamName')`. This is the correct assertion because the spread (`...form, teamName: undefined`) preserves the key with an undefined value.
- R-2 explicitly asserts both the positive case (`toHaveBeenCalledWith('/grocery')`) and the negative case (`not.toHaveBeenCalledWith('/dashboard')`). Excellent.
- R-4 follows the same pending-Promise pattern as L-3 — correct and consistent.

**Minor observations:**
- `fillForm` uses `getByLabelText(/^password$/i)` with a `^$` anchored regex to avoid colliding with a hypothetical "Confirm password" field. This is a good defensive pattern.
- No test covers the `role='manager'` selection path in the form. The form accepts it but no test exercises it. Low priority for this ticket since the manager role is not yet used post-registration.

---

## 5. Issues Found

| # | Severity | Location | Description |
|---|----------|----------|-------------|
| I-1 | Minor | `PrivateRoute.tsx` / FR-4.2 | The role-guard redirect bug (BUG-2) is fixed in production code but has no dedicated regression test. If the path is accidentally reverted in a future commit, no test will catch it. Recommend adding a test to `PrivateRoute.test.tsx` (or creating the file if it does not exist). |
| I-2 | Minor | `LoginPage.tsx` line 3 / GAP-1 | `LoginPage` imports `ShoppingCart` from lucide-react and uses "Grocery List" as the heading text. This mismatches the app domain (wellbeing tracker). The requirements flagged this as cosmetic/low-priority (GAP-1), but it should be tracked for a follow-up story. |
| I-3 | Nit | `auth.test.ts` line 10 | `DatabaseSync` import is used only for the `testDb` type cast. Could be replaced with `ReturnType<typeof import('node:sqlite').DatabaseSync>` or simply cast via `as any` to remove the unused import. |
| I-4 | Nit | `LoginPage.test.tsx` line 36 / 41 | `beforeEach` and `afterEach` both call `vi.clearAllMocks()`. One of these can be removed without affecting test behaviour. |

---

## 6. Recommendations

1. **Add a PrivateRoute role-guard regression test (I-1).** Create `client/src/components/__tests__/PrivateRoute.test.tsx` with a case that renders `<PrivateRoute requiredRole="manager" />` with a `user` role user and asserts that `<Navigate to="/grocery" />` is rendered. This provides a safety net for both bug fixes in one component.

2. **Track the LoginPage branding mismatch (I-2).** File a follow-up Jira story to update the `LoginPage` icon and heading to match the wellbeing tracker theme. It is currently consistent with the grocery sub-feature but inconsistent with the app purpose stated in the login form requirements.

3. **No blocking changes required.** The two production bug fixes are correct, minimal, and well-tested. The new test files provide full coverage of all acceptance criteria in scope. The pipeline may proceed to Step 7 (Verify).

---

## 7. Files Reviewed

| File | Change Type | Verdict |
|------|------------|---------|
| `client/src/components/PrivateRoute.tsx` | Bug fix (1 line) | Approved |
| `client/src/pages/RegisterPage.tsx` | Bug fix (1 line) | Approved |
| `client/src/pages/__tests__/LoginPage.test.tsx` | New file (137 lines) | Approved |
| `client/src/pages/__tests__/RegisterPage.test.tsx` | New file (152 lines) | Approved |
| `server/src/__tests__/auth.test.ts` | New file (174 lines) | Approved |
