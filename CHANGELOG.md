# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased] — 2026-06-01
### Added
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
