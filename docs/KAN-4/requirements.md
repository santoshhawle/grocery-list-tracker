# KAN-4 — User Login and Registration

**Story:** As a remote team member, I want to create an account and log in so that I can access my personal wellbeing data securely.

**Date captured:** 2026-06-01
**Branch:** feature-login
**Status:** Requirements — awaiting approval

---

## 1. Background and Context

The Remote Wellbeing Tracker is a monorepo application with an Express/Node.js API (`server/`) and a React SPA (`client/`). All personal wellbeing data is scoped to authenticated users. Authentication is required before any protected route (`/grocery`, and future routes `/dashboard`, `/check-in`, etc.) can be accessed.

The server already has a working `POST /api/auth/register` and `POST /api/auth/login` endpoint. The client has `LoginPage.tsx` and `RegisterPage.tsx` scaffolded but contains several gaps and inconsistencies that this story must address.

---

## 2. User Stories

### US-1 — Login
> As an existing user, I want to enter my email and password and be redirected to the application so that I can access my data.

### US-2 — Registration
> As a new user, I want to create an account with my name, email, password, optional role, and optional team name, so that I can start logging my wellbeing.

### US-3 — Session Persistence
> As a returning user, I want my session to be remembered across browser refreshes (without re-logging in) until I explicitly log out or the token expires.

### US-4 — Protected Routes
> As the system, I want unauthenticated users to be redirected to `/login` when they try to access any protected route, so that personal data remains private.

### US-5 — Logout
> As a logged-in user, I want to log out and have my local session cleared, so that others using the same device cannot access my account.

---

## 3. Functional Requirements

### 3.1 Login (`POST /api/auth/login` + `LoginPage`)

| ID | Requirement |
|----|-------------|
| FR-1.1 | The login form MUST accept an email address and a password. |
| FR-1.2 | On successful login the server returns `{ token, user }`. The client stores the JWT in `localStorage` under key `wbt_token` and the user object under `wbt_user`. |
| FR-1.3 | After successful login the user MUST be redirected to `/grocery`. |
| FR-1.4 | If credentials are invalid the server returns HTTP 401; the client MUST display the error message returned in `{ error }`. |
| FR-1.5 | The submit button MUST be disabled and show a loading state while the request is in flight. |
| FR-1.6 | Email field MUST use `type="email"` and `autoComplete="email"`. Password field MUST use `type="password"` and `autoComplete="current-password"`. |
| FR-1.7 | Demo credentials (`demo@example.com` / `password123`) MUST be visibly displayed on the login page to assist evaluators. |
| FR-1.8 | A link to `/register` MUST be present on the login page. |

### 3.2 Registration (`POST /api/auth/register` + `RegisterPage`)

| ID | Requirement |
|----|-------------|
| FR-2.1 | The registration form MUST accept: full name, email address, password, role (`user` \| `manager`), and an optional team name. |
| FR-2.2 | Client-side validation MUST enforce password length >= 8 characters before submitting to the server. |
| FR-2.3 | The server normalises email to lowercase and trims whitespace before inserting; duplicate emails return HTTP 409 with `{ error: 'Email already registered' }`. The client MUST display this error. |
| FR-2.4 | On successful registration the server returns `{ token, user }`. The client stores auth data identically to FR-1.2 and redirects to `/grocery`. **Note:** `RegisterPage` currently redirects to `/dashboard` — this MUST be corrected to `/grocery` to match the active route table. |
| FR-2.5 | The submit button MUST be disabled and show a loading state while the request is in flight. |
| FR-2.6 | Role defaults to `'user'` if not explicitly changed. The team name field is optional; leaving it blank means the user is not assigned to a team. |
| FR-2.7 | A link to `/login` MUST be present on the registration page. |
| FR-2.8 | Password field MUST use `autoComplete="new-password"`. |

### 3.3 Session Persistence (`AuthContext`)

| ID | Requirement |
|----|-------------|
| FR-3.1 | On app mount, `AuthProvider` MUST attempt to rehydrate user state from `localStorage` (`wbt_token` + `wbt_user`). |
| FR-3.2 | If `localStorage` data is corrupt or missing, auth state MUST silently reset to `user: null` without throwing. |
| FR-3.3 | While rehydration is in progress, `isLoading` MUST be `true`; all protected routes MUST render a spinner rather than redirect. |
| FR-3.4 | JWT token expiry is 7 days. On any 401 response from the API, the client MUST clear `localStorage` and redirect the user to `/login`. |

### 3.4 Protected Routes (`PrivateRoute`)

| ID | Requirement |
|----|-------------|
| FR-4.1 | Any route wrapped in `<PrivateRoute />` MUST redirect unauthenticated users to `/login`. |
| FR-4.2 | Routes requiring `requiredRole="manager"` MUST redirect non-manager users to `/grocery` (the current default home). |
| FR-4.3 | While `isLoading` is `true`, `PrivateRoute` MUST render a full-screen spinner and NOT redirect. |

### 3.5 Logout

| ID | Requirement |
|----|-------------|
| FR-5.1 | Calling `logout()` from `AuthContext` MUST clear `wbt_token` and `wbt_user` from `localStorage`, call `clearUserData(userId)` to remove notification storage, and set `user` to `null`. |
| FR-5.2 | `clearUserData` MUST only be called if a user is currently logged in (i.e., `user !== null`). |

---

## 4. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Passwords MUST be hashed with bcrypt (cost factor 12) before storage. Plain-text passwords MUST never be logged or stored. |
| NFR-2 | Auth API endpoints are rate-limited to 15 requests per 15 minutes per IP to mitigate brute-force attacks. |
| NFR-3 | JWT tokens MUST be signed with `JWT_SECRET` from environment; the default dev secret value MUST be replaced in production. |
| NFR-4 | All form inputs MUST have associated `<label>` elements for accessibility. |
| NFR-5 | The login and registration pages MUST be responsive and usable on mobile viewports (min width 320 px). |
| NFR-6 | No `console.log` calls in production TypeScript files (enforced by pre-commit hook). |

---

## 5. Acceptance Criteria

| AC | Scenario | Expected Result |
|----|----------|-----------------|
| AC-1 | User submits valid credentials on Login page | JWT stored, user redirected to `/grocery` |
| AC-2 | User submits wrong password on Login page | Error message displayed; no redirect |
| AC-3 | User registers with all required fields | Account created, JWT stored, redirected to `/grocery` |
| AC-4 | User tries to register with duplicate email | "Email already registered" error displayed |
| AC-5 | User registers with password < 8 chars | Client-side error shown before API call |
| AC-6 | Authenticated user refreshes browser | Session restored from localStorage; no redirect to login |
| AC-7 | Unauthenticated user visits `/grocery` | Redirected to `/login` |
| AC-8 | User logs out | localStorage cleared, `user` set to `null`, notification data cleared |
| AC-9 | API returns 401 while user is browsing | Token cleared, user redirected to `/login` |
| AC-10 | `RegisterPage` post-registration redirect | Redirects to `/grocery`, not `/dashboard` |

---

## 6. Known Issues / Gaps to Address

| Issue | Location | Description |
|-------|----------|-------------|
| BUG-1 | `RegisterPage.tsx` line 36 | `navigate('/dashboard')` should be `navigate('/grocery')` — `/dashboard` is not a registered route in `App.tsx`. |
| GAP-1 | `LoginPage.tsx` | Uses `ShoppingCart` icon — consider aligning with `Heart` icon used on register, or using a neutral app icon. (Low priority; cosmetic.) |
| GAP-2 | Server | No integration test exists for `POST /api/auth/register` or `POST /api/auth/login`. Tests should be added. |
| GAP-3 | Client | No unit tests for `LoginPage` or `RegisterPage` form behaviour exist. Tests should be added. |

---

## 7. Out of Scope

- Password reset / forgot password flow
- OAuth / social login
- Email verification on registration
- Two-factor authentication
- Session invalidation server-side (token blacklist)

---

## 8. Dependencies

| Dependency | Notes |
|------------|-------|
| `bcryptjs` | Server — password hashing |
| `jsonwebtoken` | Server — JWT sign/verify |
| `express-rate-limit` | Server — auth route rate limiting |
| `localStorage` | Client — token and user persistence |
| React Router 6 | Client — route guards and navigation |
