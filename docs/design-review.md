# Design Review

**Date**: 2026-06-01
**Reviewer**: Senior Design Reviewer Agent
**Document Reviewed**: docs/architecture.md
**Ticket**: KAN-3 — Mark Grocery Item as Bought
**Status**: APPROVED WITH CONDITIONS

---

## Executive Summary

The architecture for KAN-3 is fundamentally sound. It correctly scopes the feature to a pure client-side change, follows the established service-layer pattern (`notificationStorage`), and documents trade-offs with care. Three issues require correction before implementation begins: (1) the `GroceryListPage` currently renders a table layout that is architecturally incompatible with the two-section card layout described in this document — the refactor cost must be acknowledged; (2) the `GroceryItem` type is defined inline in `GroceryListPage.tsx` but the architecture says it will be "promoted to `types.ts`" without committing to that decision; (3) `handleDelete` in the existing code does not remove orphaned bought ids, and the architecture notes this as a "MUST" without escalating it to a named task. These are correctable gaps, not design failures. With the conditions below addressed in the implementation plan, the feature is safe to build.

---

## Strengths

- Correct pattern choice: local component state + thin service module mirrors the `notificationStorage` / `notificationService` split already in production, keeping the codebase internally consistent.
- ADR-001 through ADR-005 are thorough, enumerate rejected alternatives, and honestly document the negative consequences of each decision.
- The `groceryStorage` service is designed with zero React dependencies, making unit tests trivially easy to write without mounting a component — this matches the existing `notificationStorage.test.ts` pattern exactly.
- Bought-state separation from item-list state (ADR-001) is the correct call: it avoids touching the existing `grocery-list` persistence path and keeps the two concerns independently evolvable.
- The `Set<string>` / filter-on-render approach (ADR-002) is the right data structure: O(1) lookup, single source of truth, no risk of two arrays drifting out of sync.
- Accessibility coverage is explicit and correct: aria-label dynamic updates, native `<button>` for keyboard operability, 44 x 44 px touch target requirement, and strikethrough + opacity (not colour alone) as the visual signal.
- The animation risk (section 7.4) is called out proactively with a correct explanation of why CSS transitions cannot animate DOM removal.
- `crypto.randomUUID()` secure-context requirement (section 7.5) is noted — a real production concern.

---

## Critical Issues (Must Fix Before Implementation)

### CI-01: Existing Table Layout is Incompatible with the Described Two-Section Design

**Dimension**: Functional Completeness / Integration

The current `GroceryListPage.tsx` renders items inside an HTML `<table>` (with `<thead>`, `<tbody>`, and five `<td>` columns: Item, Quantity, Expiry Date, Status, Actions). The architecture describes two `<GrocerySection>` components, each containing a list of `GroceryItemRow` cards rendered as styled rows — not table cells.

These are two structurally different DOM layouts. The `GroceryItemRow` interface defined in section 3.3 accepts `onToggle`, `onEdit`, `onDelete` props as a card component; the existing table rows inline `startEdit`, `handleDelete`, and all editing state directly in the table row markup.

**Impact**: The implementation plan must explicitly account for this layout refactor. It is not a small "wire in the new component" task — it requires replacing the entire table with two `<GrocerySection>` blocks and extracting all inline row logic into `GroceryItemRow`. Failing to plan for this will cause scope creep mid-sprint.

**Required action**: Section 10 (Next Steps) must be updated to call out the table-to-card layout migration as a prerequisite refactor step. The architecture document must not imply this is simply "adding" new components onto the existing structure.

---

### CI-02: `GroceryItem` Type Location is Unresolved — "or promoted to `types.ts`" is Not a Decision

**Dimension**: Data Architecture / Maintainability

Section 3, `GroceryItem` type row, says: "Defined in `GroceryListPage` (or promoted to `types.ts`)". This is not a decision — it is deferred ambiguity. The current `types.ts` holds all shared domain types. `GroceryItem` is referenced by `GroceryListPage`, `GrocerySection`, and `GroceryItemRow`. As soon as more than one file imports it, it must live in a shared location.

**Impact**: If the implementing engineer leaves it in `GroceryListPage`, the sub-components will have a circular-looking import from a page file. If they add it to `types.ts` without a documented decision, reviewers will flag it in PR.

**Required action**: The architecture must commit to a single answer. The correct answer for this codebase is `types.ts` — it already holds all domain types. This review resolves the question and the architecture document has been updated accordingly (see `<!-- Updated by design-reviewer -->` annotation in `docs/architecture.md`).

---

### CI-03: `handleDelete` Orphaned-Id Cleanup is Described as a "MUST" But Has No Implementation Ownership

**Dimension**: Data Architecture / Functional Completeness

Section 9, Assumption 5, states: "When `handleDelete` removes an item from `items`, it MUST also remove the item's id from `boughtIds` (and call `saveBoughtIds`). This is not called out explicitly in the requirements but is required for correctness."

The word "MUST" here is correct — without this cleanup, `wbt_grocery_bought` accumulates orphaned UUIDs indefinitely. But the current `handleDelete` implementation in `GroceryListPage.tsx` (line 84–87) does not do this, and it is not surfaced as a named task in section 10.

**Impact**: This is a data integrity bug if it ships without the cleanup. In-memory behaviour is correct (the orphaned id will never match an item in the rendered list), but `localStorage` will grow with stale ids. More critically, if item ids are ever recycled (not currently the case with `crypto.randomUUID()`, but a future concern), a stale id could incorrectly mark a newly-created item as bought on page load.

**Required action**: The implementation plan must include "extend `handleDelete` to also remove the deleted id from `boughtIds` and call `saveBoughtIds`" as a discrete, explicitly-named task. Section 10 of the architecture has been updated to reflect this.

---

## Significant Concerns (Should Address)

### SC-01: `saveBoughtIds` Returns `void` — Caller Cannot Detect Write Failure

**Dimension**: Integration / Operational Concerns

The `notificationStorage` service returns a `WriteResult { success: boolean }` from every write function, allowing callers to react to failure (e.g., show a toast, log contextually). The proposed `saveBoughtIds(ids: Set<string>): void` discards the failure signal entirely.

While NFR-06 says the error must only be logged to console (no user-facing crash), the `void` return type forecloses the option for the implementing engineer to add a degraded-mode indicator in future. It also diverges from the established `notificationStorage` pattern without a documented reason.

**Recommendation**: Change `saveBoughtIds` to return `WriteResult` (matching `notificationStorage`), even if the initial caller ignores the return value. This keeps the service API consistent and preserves the option to surface a warning banner ("Shopping list may not be saved — storage is full") in a future story without changing the service contract.

---

### SC-02: No User-Visible Feedback When `localStorage` Write Fails

**Dimension**: Operational Concerns / UX

NFR-06 explicitly requires that on storage failure, "the error MUST be logged to the browser console (no user-facing crash)". The architecture faithfully implements this. However, silent failures are a UX problem in disguise: if a user toggles items for 20 minutes believing they are persisted, then refreshes and finds all state lost, the experience is confusing even though there was no crash.

This is a requirements-level decision that the architecture cannot override. However, the architecture should at least surface this as a known UX risk so a product decision can be made.

**Recommendation**: Add a note to section 7.3 or 9 (Open Questions) that acknowledges the UX risk of silent write failures and leaves a decision hook for a future story (e.g., a small inline banner: "Changes may not be saved — storage unavailable").

---

### SC-03: `GrocerySection` Props Interface Has an Impedance Mismatch

**Dimension**: Integration / API Contracts

Section 3.2 defines `GrocerySection` props as:
```
title: string, count: number, items: GroceryItem[], boughtIds: Set<string>,
emptyMessage: string, onToggle(id): void, onEdit(item): void, onDelete(id): void
```

But section 3.1 says `GroceryListPage` "Renders `<GrocerySection>` twice" and passes pre-filtered `toBuyItems` and `boughtItems` arrays. If `toBuyItems` is already filtered to the section's items, passing `boughtIds` into `GrocerySection` is redundant — `GrocerySection` would need to further filter an already-filtered list, or `GroceryItemRow` receives a `bought` boolean. The `count` prop is also redundant if `items.length` conveys the same value.

The cleaner design (and the one implied by section 3.3 `GroceryItemRow` props `bought: boolean`) is:
- `GrocerySection` receives pre-filtered `items` (already the correct subset).
- `GrocerySection` derives `count` from `items.length` internally, removing `count` from props.
- `GroceryItemRow` receives `bought: boolean` directly, removing the need for `GrocerySection` to hold or pass `boughtIds`.

**Recommendation**: Resolve the inconsistency before the implementation plan is written. The architecture has been annotated with the recommended resolution (see `<!-- Updated by design-reviewer -->` in section 3.2).

---

### SC-04: `useEffect([boughtIds])` Dependency on a `Set` Reference — React Equality Trap

**Dimension**: Functional Completeness / Performance

Section 6.3, step 5 describes: "The `useEffect([boughtIds])` fires, calling `groceryStorage.saveBoughtIds(boughtIds)`."

React uses `Object.is` for dependency comparison. A new `Set` instance is created on every toggle (`new Set(prev)` in `setBoughtIds`), so the reference changes on every toggle — this is correct. However, the architecture does not address what happens on initial mount: `useEffect` with `[boughtIds]` will also fire on mount, causing an unnecessary `saveBoughtIds` write on every page load with the value already in `localStorage`.

**Impact**: Minor performance noise and a redundant `localStorage` write on mount. It could also mask bugs during testing if tests observe the initial write as a spurious side effect.

**Recommendation**: Document the intended behaviour explicitly. Common mitigations are (a) a `useRef` mounted guard, (b) initialising with `undefined` and skipping the first effect, or (c) separating load-on-mount from save-on-change. The architecture should specify which approach the implementing engineer should use.

---

## Minor Suggestions (Consider)

### MS-01: `GroceryItem` Expiry-Related Utilities Should Be Co-located or Shared

The current `GroceryListPage.tsx` contains `daysUntil`, `expiryStatus`, `formatDate`, and `StatusBadge` as local functions. When `GroceryListPage` is refactored to use `GroceryItemRow`, these utilities need a home. The architecture does not address where expiry-display logic lives post-refactor.

**Suggestion**: Note in the architecture that `StatusBadge` and expiry helpers either move into `GroceryItemRow` or into a shared utility file (`client/src/utils/groceryUtils.ts`). This prevents the implementing engineer from leaving them as orphaned exports on a page file.

---

### MS-02: `GrocerySection` Empty-State Message Coupling

FR-10 and FR-11 mandate specific empty-state strings ("No items yet. Add one above." and "No bought items yet."). The architecture correctly passes `emptyMessage` as a prop, keeping `GrocerySection` generic. However, the architecture does not specify where these strings are defined — inline at the call site in `GroceryListPage`, or in a constants file.

**Suggestion**: Define string constants near the component or in a `constants.ts` to make them easy to find and change for i18n later.

---

### MS-03: `wbt_grocery_bought` Key Should Be a Named Constant in `groceryStorage`

The architecture describes the key as `wbt_grocery_bought` in prose and in diagrams. The implementation should define it as `const BOUGHT_KEY = 'wbt_grocery_bought'` within `groceryStorage.ts` so key typos are caught at compile time. This mirrors the `STORAGE_KEY = 'grocery-list'` constant already in `GroceryListPage.tsx`.

---

### MS-04: Test Coverage Plan Is Incomplete for `GroceryListPage` Integration

Section 5 (Technology Stack) mentions: "add `@testing-library/react` tests for `GroceryItemRow` (aria-label, keyboard toggle) and `GroceryListPage` (section render, count badge, persistence round-trip)". However it does not specify tests for:
- `handleDelete` orphaned-id cleanup (see CI-03).
- The `useEffect` mount-guard behaviour (see SC-04).
- Empty-state rendering when all items are bought.

**Suggestion**: Expand the test specification in section 10 to enumerate these cases explicitly so the implementation plan inherits them.

---

### MS-05: `expiryDate` Field Interaction with Bought Visual State Is Undefined

When an item is in the "Bought" section, it still has an `expiryDate`. The current row background colour is driven by `expiryStatus` (red for expired, amber for expiring soon). The architecture does not specify whether bought items in the "Bought" section should still show expiry status badges and row colouring, or whether the "bought" visual treatment (strikethrough + opacity) supersedes expiry colouring.

**Suggestion**: Add a note in section 7.2 (Accessibility) or section 3.3 (`GroceryItemRow`) specifying the intended interaction between bought state and expiry state visuals. The safe default is that bought items suppress expiry colouring (opacity-50 already de-emphasises them), but this should be an explicit decision.

---

## Open Questions

- **OQ-04**: Should the edit action be available on items in the "Bought" section? The current architecture does not restrict editing to "To Buy" items, and `GroceryItemRow` accepts `onEdit` regardless of bought state. Editing a bought item is arguably valid but may be unexpected UX. This should be a conscious decision, not an accident of the implementation.

- **OQ-05**: When the grocery list is empty (zero items in both `items` array and `boughtIds`), the current page renders a full-page empty state ("Your grocery list is empty" centred card). Does this empty state replace both `GrocerySection` components, or do the two sections render with zero items each? The architecture's section 6.1 does not address the empty-list-from-start case after the refactor.

- **OQ-06**: The `grocery-list` key (without `wbt_` prefix) is a known inconsistency called out in ADR-005. Should a migration guard be added to the state initialiser that reads `grocery-list` and rewrites it to `wbt_grocery_list` on first load? This is listed as out-of-scope but if done as part of this story the cost is minimal.

---

## Agreed Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D-01 | `GroceryItem` type is defined in `client/src/types.ts`, not inline in `GroceryListPage`. | The type is referenced by at least three components (`GroceryListPage`, `GrocerySection`, `GroceryItemRow`); it belongs in the shared types file alongside `User`, `WellbeingLog`, etc. |
| D-02 | `GrocerySection` receives pre-filtered `items: GroceryItem[]` and derives `count` from `items.length`. The `boughtIds: Set<string>` prop is removed from `GrocerySection`; instead `GroceryItemRow` receives `bought: boolean` directly from `GroceryListPage` (via `GrocerySection` pass-through or direct render). | Eliminates the redundant props and removes the impedance mismatch identified in SC-03. |
| D-03 | `handleDelete` MUST remove the deleted item's id from `boughtIds` and call `saveBoughtIds`. | Prevents orphaned ids accumulating in `localStorage`; required for data integrity as noted in Assumption 5 of the architecture. |
| D-04 | `saveBoughtIds` returns `WriteResult { success: boolean }` to match the `notificationStorage` pattern. | Keeps the service layer API consistent; preserves caller flexibility without requiring any change to the initial caller. |
| D-05 | A `useRef` mounted guard is used in the `useEffect` that calls `saveBoughtIds` to suppress the redundant write on initial mount. | Prevents a spurious `localStorage` write on every page load; keeps test assertions clean. |

---

## Review Checklist

- [x] Functional completeness verified — two gaps found (CI-01 table refactor, CI-03 handleDelete cleanup), corrected in architecture
- [x] Scalability and performance reviewed — no scalability concerns at grocery-list scale; SC-04 useEffect mount issue noted
- [x] Security model evaluated — no new attack surface; localStorage XSS risk is pre-existing and unchanged
- [x] Data architecture assessed — type location resolved (D-01), orphaned-id cleanup addressed (D-03), storage size is negligible
- [x] API contracts reviewed — GrocerySection props impedance mismatch resolved (D-02); saveBoughtIds return type updated (D-04)
- [x] Operational concerns addressed — silent failure UX risk noted (SC-02); console.error pattern is correct
- [x] Complexity and maintainability assessed — appropriate complexity; expiry utility co-location flagged (MS-01)
- [x] Decision rationale documented — ADR-001 through ADR-005 are thorough; D-01 through D-05 added by this review
