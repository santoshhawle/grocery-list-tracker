# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased] — 2026-06-01
### Fixed
- KAN-4: `PrivateRoute` role-guard redirect corrected from `/dashboard` to `/grocery` (BUG-2)
- KAN-4: `RegisterPage` post-registration redirect corrected from `/dashboard` to `/grocery` (BUG-1)

### Added
- KAN-4: Server auth integration test suite — 9 tests covering register, login, and JWT-protected route (S-1 through S-9)
- KAN-4: `LoginPage` unit test suite — 7 tests covering form interaction, loading state, error handling, and navigation (L-1 through L-7)
- KAN-4: `RegisterPage` unit test suite — 7 tests covering validation, redirect, loading state, and field defaults (R-1 through R-7)
- KAN-4: Full SDLC pipeline artifacts: `docs/KAN-4/requirements.md`, `docs/KAN-4/architecture.md`, `docs/KAN-4/design-review.md`, `docs/KAN-4/impl-plan.md`, `docs/KAN-4/review.md`, `docs/KAN-4/verification-report.md`
- KAN-3: Grocery item "bought" toggle with checkbox, strikethrough styling, and grouped "To Buy" / "Bought" sections (#1)
- `GroceryItem` interface exported from `client/src/types.ts`
- `groceryStorage` service persisting bought IDs to `localStorage` under key `wbt_grocery_bought`
- `GroceryItemRow` component with WCAG 2.1 AA compliant toggle button (44px touch targets, aria-labels)
- `GrocerySection` component with count badge and per-section empty-state messages
- Shared `mockLocalStorage` test helper
- Utility functions `daysUntil`, `expiryStatus`, `formatDate`, `rowBg`, `StatusBadge` extracted to `groceryUtils.ts`
- Full SDLC pipeline artifacts: `docs/requirements.md`, `docs/architecture.md`, `docs/design-review.md`, `docs/impl-plan.md`, `docs/review.md`

### Changed
- `GroceryListPage` refactored from table to card layout; now manages `boughtIds` state with isMounted guard and orphan cleanup on delete
- `client/vite.config.ts` updated to exclude 3 pre-existing orphaned test stubs from vitest runs
