# Implementation Plan

> Generated from: docs/architecture.md  
> Design review: docs/design-review.md  
> Date: 2026-06-01  
> Ticket: KAN-3 — Mark Grocery Item as Bought  
> Status: Implemented

---

## Summary

This plan decomposes KAN-3 into 12 discrete tasks across four priority tiers. The feature is pure client-side: no server, database, or routing changes are required. The three critical issues from the design review (CI-01 table-to-card refactor, CI-02 GroceryItem type migration, CI-03 handleDelete orphan cleanup) are each elevated to named prerequisite tasks at P0. The plan is structured so that the service module and the type migration can proceed in parallel before the component work begins, and all testing tasks follow the components they exercise. The estimated total effort is 5–6 developer days assuming a single engineer working sequentially.

---

## Dependency Graph Overview

```
TASK-001 (GroceryItem → types.ts)  ──┐
                                      ├──► TASK-003 (groceryStorage service)
TASK-002 (WriteResult export)  ───────┘         │
                                                 │
                                      ┌──────────┘
                                      │
TASK-001 ──────────────────────────── ┼──► TASK-004 (table-to-card refactor)
                                      │         │
                                      │         ▼
                                      │    TASK-005 (GroceryItemRow component)
                                      │         │
                                      │         ▼
                                      │    TASK-006 (GrocerySection component)
                                      │         │
                                      │         ▼
                                      └────────►TASK-007 (boughtIds state + toggle)
                                                     │
                                                     ▼
                                               TASK-008 (handleDelete orphan cleanup)
                                                     │
                                              ┌──────┘
                                              │
                                              ▼
                              TASK-009 (groceryStorage unit tests)  ─┐
                              TASK-010 (GroceryItemRow unit tests)   ├──► TASK-012 (a11y audit)
                              TASK-011 (GroceryListPage integration) ─┘
```

Simplified chain:

```
Type migration + WriteResult export
    → groceryStorage service
        → Table-to-card refactor
            → GroceryItemRow
                → GrocerySection
                    → boughtIds state + toggle wiring
                        → handleDelete orphan cleanup
                            → Unit + integration tests
                                → Accessibility audit
```

---

## Task List

### P0 — Foundation

---

#### TASK-001: Migrate `GroceryItem` interface to `client/src/types.ts`

- **Description**: The `GroceryItem` interface is currently defined inline at the top of `GroceryListPage.tsx` (lines 7–12). Move it into `client/src/types.ts` as an exported interface alongside the other domain types (`User`, `WellbeingLog`, etc.). Remove the inline declaration from `GroceryListPage.tsx` and add the corresponding import. This establishes the canonical type location before any sub-components are authored — without this step every new file that imports `GroceryItem` will either duplicate the definition or create an import dependency on a page file.
- **Depends on**: None
- **Blocks**: TASK-003, TASK-004, TASK-005, TASK-006, TASK-007
- **Parallel with**: TASK-002
- **Estimated effort**: XS (< 30 min)
- **Definition of done**:
  - `client/src/types.ts` exports `GroceryItem { id, name, quantity, expiryDate }`.
  - `GroceryListPage.tsx` imports `GroceryItem` from `../types` and has no local `interface GroceryItem` declaration.
  - `npx tsc --noEmit` in `client/` passes with zero errors.
  - No other files changed.
- **Notes**: This is design decision D-01. The existing `STORAGE_KEY` constant and helper functions (`daysUntil`, `expiryStatus`, `formatDate`, `StatusBadge`) remain in `GroceryListPage.tsx` for now; they are addressed in TASK-004.

---

#### TASK-002: Confirm `WriteResult` is exported from `notificationStorage` (or extract to shared types)

- **Description**: The `groceryStorage` service (TASK-003) must return `WriteResult { success: boolean }` from `saveBoughtIds` (design decision D-04). `WriteResult` is already defined and exported in `client/src/services/notificationStorage.ts`. Verify this export exists and is importable. If it is not re-exported from a shared location, either (a) import it directly from `notificationStorage` in `groceryStorage`, or (b) move it to `client/src/types.ts`. Option (a) is preferred at this story's scope because the type already has a stable home and adding it to `types.ts` would mix service-layer types with domain types.
- **Depends on**: None
- **Blocks**: TASK-003
- **Parallel with**: TASK-001
- **Estimated effort**: XS (15 min — likely already done, just needs verification)
- **Definition of done**:
  - A decision is documented inline (comment) in `groceryStorage.ts` about where `WriteResult` is imported from.
  - `npx tsc --noEmit` passes.
- **Notes**: Reading `notificationStorage.ts` confirms `WriteResult` is exported at line 8. The implementing engineer only needs to import it. No code change may be required here beyond confirming the import path.

---

#### TASK-003: Implement `groceryStorage` service module

- **Description**: Create `client/src/services/groceryStorage.ts`. The module must:
  - Define `const BOUGHT_KEY = 'wbt_grocery_bought'` as a named constant (MS-03).
  - Export `loadBoughtIds(): Set<string>` — reads `BOUGHT_KEY` from `localStorage`, parses the JSON array, returns a `Set<string>`. Returns an empty `Set` on any error (missing key, malformed JSON, `SecurityError`, etc.).
  - Export `saveBoughtIds(ids: Set<string>): WriteResult` — serialises the `Set` as `JSON.stringify([...ids])` and writes to `BOUGHT_KEY`. Returns `{ success: true }` on success. Catches any thrown error, calls `console.error(error)`, and returns `{ success: false }` without rethrowing.
  - Import `WriteResult` from `../services/notificationStorage` (or `../types` per TASK-002 decision).
  - Zero React dependencies — the module is plain TypeScript.
- **Depends on**: TASK-001 (GroceryItem type is not used here, but TASK-001 must complete so the type file is stable), TASK-002 (WriteResult import path confirmed)
- **Blocks**: TASK-007, TASK-009
- **Parallel with**: TASK-004 (table-to-card refactor has no dependency on the storage service)
- **Estimated effort**: S (1–2 h)
- **Definition of done**:
  - `client/src/services/groceryStorage.ts` exists with `loadBoughtIds` and `saveBoughtIds` exported.
  - `BOUGHT_KEY` is a named `const`, not an inline string literal in function bodies.
  - `saveBoughtIds` return type is `WriteResult`.
  - `loadBoughtIds` returns an empty `Set` (not `null` / `undefined`) on any error path.
  - `npx tsc --noEmit` passes.
  - No DOM or React import in the file.
- **Notes**: Mirror the structure of `notificationStorage.ts`. The `try/catch` error handling pattern, the module-level key constants, and the `WriteResult` return type are all directly reusable from that file. See ADR-003 for rationale.

---

#### TASK-004: Replace table layout with two-section card scaffold in `GroceryListPage`

- **Description**: This is the CI-01 prerequisite refactor. The current `GroceryListPage.tsx` renders all items inside an HTML `<table>` (lines 185–245). Replace the entire table block with a two-section card scaffold that will host `GrocerySection` components. At this stage, `GrocerySection` does not yet exist — render the items as a plain list temporarily (or as a `<div>` placeholder) so the table is fully removed and the page still renders without crashing. Concurrently:
  - Move `daysUntil`, `expiryStatus`, `formatDate`, `StatusBadge`, and `rowBg` out of the page file and into `client/src/utils/groceryUtils.ts` (MS-01), since they will be needed by `GroceryItemRow`.
  - Remove the per-item footer ("N items · saved to browser storage") that was inside the table container; this will be replaced by section count badges.
  - The add-item form, page heading, and `Header` component are untouched.
  - Keep all existing state (`items`, `form`, `error`, `editingId`, `editForm`) and handlers (`handleAdd`, `handleDelete`, `startEdit`, `saveEdit`) intact — these will be rewired in TASK-007.
- **Depends on**: TASK-001 (GroceryItem in types.ts required so extracted utilities can import it cleanly)
- **Blocks**: TASK-005, TASK-006, TASK-007
- **Parallel with**: TASK-003
- **Estimated effort**: M (3–4 h)
- **Definition of done**:
  - No `<table>`, `<thead>`, `<tbody>`, or `<td>` elements remain in `GroceryListPage.tsx`.
  - `daysUntil`, `expiryStatus`, `formatDate`, `StatusBadge`, and `rowBg` are exported from `client/src/utils/groceryUtils.ts` and imported in `GroceryListPage.tsx` (for now) and will later be consumed by `GroceryItemRow`.
  - The grocery page renders without TypeScript or runtime errors in the dev server.
  - Existing items still display (even if in a temporary non-styled layout).
  - `npx tsc --noEmit` passes.
- **Notes**: This task intentionally leaves the list rendering in an intermediate state. The final card layout is completed in TASK-005 and TASK-006 when the sub-components are available. The existing empty-state card ("Your grocery list is empty") can remain as-is for now — it will be revisited in TASK-007 when sections are wired. See design-review CI-01 and architecture section 10 step 2.

---

### P1 — Core Features

---

#### TASK-005: Implement `GroceryItemRow` component

- **Description**: Create `client/src/pages/grocery/GroceryItemRow.tsx` (or co-locate at `client/src/pages/GroceryItemRow.tsx` per OQ-03 decision — prefer the sub-folder approach for grocery-specific components). The component must implement the full interface from architecture section 3.3:
  - Props: `item: GroceryItem`, `bought: boolean`, `onToggle(id: string): void`, `onEdit(item: GroceryItem): void`, `onDelete(id: string): void`.
  - When `bought` is `true`, apply `line-through` and `opacity-50` Tailwind classes to the item name.
  - Toggle button: `aria-label` is `"Mark <item.name> as bought"` when `bought === false`; `"Mark <item.name> as not bought"` when `bought === true`. Button is a native `<button>` element (keyboard accessible without additional `onKeyDown`). Meets 44 x 44 CSS px touch target via `min-h-[44px] min-w-[44px]` padding.
  - Display `item.name`, `item.quantity`, `formatDate(item.expiryDate)`, and `StatusBadge` (imported from `groceryUtils.ts`).
  - Inline edit mode: replicate the existing table-row edit mode (controlled inputs for name, quantity, expiryDate; save/cancel buttons). The edit state (`editingId`, `editForm`) remains in `GroceryListPage` — `GroceryItemRow` receives `onEdit` and the current edit state as props or derives it from a passed `isEditing` prop. Choose the simpler approach: pass `isEditing: boolean` and `editForm` / `onEditChange` / `onSave` / `onCancel` props so `GroceryItemRow` is a fully controlled component.
  - Apply expiry row background colouring (`rowBg`) — unless `bought` is `true`, in which case bought visual treatment (strikethrough + opacity) takes precedence and expiry colouring is suppressed (see MS-05 — explicit decision needed; default to suppressing expiry colour on bought items).
  - Use the `Check`, `Pencil`, `Trash2`, `X` icons from Lucide React (already installed).
- **Depends on**: TASK-001 (GroceryItem type), TASK-004 (groceryUtils.ts available)
- **Blocks**: TASK-006, TASK-007, TASK-010
- **Parallel with**: None (TASK-003 is independent but TASK-005 does not need it)
- **Estimated effort**: M (3–4 h)
- **Definition of done**:
  - `GroceryItemRow` renders an item with correct name, quantity, expiry date, and status badge.
  - Toggle button has correct `aria-label` for both bought and unbought states.
  - `bought === true` applies `line-through opacity-50` and suppresses expiry row background.
  - Inline edit mode renders controlled inputs and save/cancel buttons.
  - `npx tsc --noEmit` passes with no implicit `any`.
  - Component renders without errors in the dev server when wired into the page.
- **Notes**: The sub-folder `client/src/pages/grocery/` is recommended to avoid polluting the top-level pages directory with grocery-specific sub-components. `GrocerySection` (TASK-006) should live in the same folder.

---

#### TASK-006: Implement `GrocerySection` component

- **Description**: Create `client/src/pages/grocery/GrocerySection.tsx`. The component must implement the interface from architecture section 3.2 (as updated by design decisions D-01 and D-02):
  - Props: `title: string`, `items: GroceryItem[]`, `emptyMessage: string`, `onToggle(id: string): void`, `onEdit(item: GroceryItem): void`, `onDelete(id: string): void`. Note: `count` and `boughtIds` are NOT props — `count` is derived from `items.length`, and `bought: boolean` is computed in `GroceryListPage` before passing into this section.
  - Render a `<h2>` heading: `{title} ({items.length})`.
  - When `items.length === 0`, render the `emptyMessage` string in a styled empty-state container.
  - When `items.length > 0`, render a `GroceryItemRow` for each item. The `bought` prop on each row is not known at this level — `GroceryListPage` must pass a pre-computed `bought` boolean per item. To enable this cleanly, accept `items` as `Array<GroceryItem & { bought: boolean }>` or pass `boughtIds` through. The cleanest resolution consistent with D-02 is to accept `items: GroceryItem[]` and a parallel `bought: boolean[]` (by index) — but the simplest and most consistent with the architecture is to have `GroceryListPage` pass a typed `SectionItem` array. Use `items: Array<GroceryItem & { bought: boolean }>` to keep the component self-contained. `GroceryListPage` constructs these arrays via `toBuyItems.map(i => ({ ...i, bought: false }))` and `boughtItems.map(i => ({ ...i, bought: true }))`.
  - No internal state.
- **Depends on**: TASK-005 (GroceryItemRow must exist to render), TASK-001 (GroceryItem type)
- **Blocks**: TASK-007, TASK-010
- **Parallel with**: None
- **Estimated effort**: S (1–2 h)
- **Definition of done**:
  - `GrocerySection` renders heading with correct item count.
  - Empty-state message renders when `items.length === 0`.
  - Each item delegates to `GroceryItemRow` with correct props.
  - `npx tsc --noEmit` passes.
  - No internal state in `GrocerySection`.
- **Notes**: The `emptyMessage` strings are defined as constants at the `GroceryListPage` call site: `"No items yet. Add one above."` and `"No bought items yet."` — keep them there for now (MS-02 is a minor suggestion, not a requirement at this scope).

---

#### TASK-007: Wire `boughtIds` state, `handleToggleBought`, and persistence into `GroceryListPage`

- **Description**: This is the core bought-state wiring task. Modify `GroceryListPage.tsx` to:
  1. Add `boughtIds` state: `const [boughtIds, setBoughtIds] = useState<Set<string>>(() => groceryStorage.loadBoughtIds())`.
  2. Add `handleToggleBought(id: string)`: updates `boughtIds` using the functional `Set` toggle pattern from architecture section 6.3.
  3. Add a `useRef` mounted guard (`isMounted`) and a `useEffect([boughtIds])` that calls `groceryStorage.saveBoughtIds(boughtIds)` — suppressing the call on initial mount via the ref guard (design decision D-05). The ref pattern: `const isMounted = useRef(false); useEffect(() => { if (!isMounted.current) { isMounted.current = true; return; } groceryStorage.saveBoughtIds(boughtIds); }, [boughtIds])`.
  4. Compute derived arrays: `const toBuyItems = items.filter(i => !boughtIds.has(i.id))` and `const boughtItems = items.filter(i => boughtIds.has(i.id))`.
  5. Replace the temporary list placeholder (from TASK-004) with two `<GrocerySection>` components: one for "To Buy" (using `toBuyItems`) and one for "Bought" (using `boughtItems`).
  6. Replace the existing full-page empty state (the centred ShoppingCart card shown when `items.length === 0`) with the two-section layout — sections render with empty-state messages when their respective item arrays are empty (resolving OQ-05: the two sections always render, the centred empty state is removed).
  7. Pass `handleToggleBought`, `startEdit`, and `handleDelete` as callbacks into `GrocerySection` → `GroceryItemRow`.
  8. Import `groceryStorage` from `../services/groceryStorage`.
- **Depends on**: TASK-003 (groceryStorage), TASK-004 (table removed), TASK-005 (GroceryItemRow), TASK-006 (GrocerySection)
- **Blocks**: TASK-008, TASK-011
- **Parallel with**: None
- **Estimated effort**: M (3–4 h)
- **Definition of done**:
  - Toggling an item moves it between sections in the same render cycle.
  - Count badges on both section headings update correctly.
  - `wbt_grocery_bought` is written to `localStorage` on toggle, not on mount.
  - Page reload restores bought/unbought state from `localStorage`.
  - All acceptance criteria AC-01 through AC-13 are manually verifiable in the dev server.
  - `npx tsc --noEmit` passes.
- **Notes**: The `useRef` mounted guard pattern (D-05) is critical to prevent a spurious write on every page load. Verify by opening DevTools Application > Storage and confirming no write to `wbt_grocery_bought` on initial page load (before any toggle).

---

#### TASK-008: Extend `handleDelete` to remove orphaned ids from `boughtIds`

- **Description**: The current `handleDelete` in `GroceryListPage.tsx` only removes the item from `items` state (line 84–87). Per design decision D-03 and architecture assumption 5, it must also remove the deleted item's id from `boughtIds` and persist the updated set. Update `handleDelete` to:
  ```
  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    setBoughtIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (editingId === id) setEditingId(null);
  }
  ```
  The `useEffect([boughtIds])` (wired in TASK-007) will fire after the `setBoughtIds` call and persist the cleaned set via `groceryStorage.saveBoughtIds`. No additional `saveBoughtIds` call is needed inside `handleDelete` itself.
- **Depends on**: TASK-007 (boughtIds state and saveBoughtIds persistence effect must exist first)
- **Blocks**: TASK-011 (the integration test for orphan cleanup requires this to be implemented)
- **Parallel with**: TASK-009, TASK-010
- **Estimated effort**: XS (30 min)
- **Definition of done**:
  - Deleting a bought item removes it from both `items` and `boughtIds`.
  - After deletion, `wbt_grocery_bought` in `localStorage` no longer contains the deleted item's id.
  - Deleting an unbought item does not affect `boughtIds`.
  - `npx tsc --noEmit` passes.
- **Notes**: This is a data integrity fix, not an additive feature. It is essential that it ships in the same PR as the bought-state feature, not deferred. See CI-03 in design-review.md.

---

### P2 — Supporting Features

---

#### TASK-009: Write unit tests for `groceryStorage`

- **Description**: Create `client/src/services/__tests__/groceryStorage.test.ts` mirroring the structure and patterns of `notificationStorage.test.ts`. Test cases must cover:
  - `loadBoughtIds`: returns empty `Set` when key does not exist; returns correct `Set<string>` when key has valid JSON array; returns empty `Set` when localStorage throws (`SecurityError`); returns empty `Set` when stored value is malformed JSON.
  - `saveBoughtIds`: writes serialised array to `BOUGHT_KEY` and returns `{ success: true }`; returns `{ success: false }` when `localStorage.setItem` throws (`QuotaExceededError`); correctly round-trips a multi-item `Set` (write then read returns equivalent Set).
  - Key correctness: assert the exact key string `'wbt_grocery_bought'` is used — prevents future key regressions.
  - Use the same `mockStorage` factory pattern from `notificationStorage.test.ts` with `vi.stubGlobal('localStorage', mockStorage)`.
- **Depends on**: TASK-003 (service must be implemented before it can be tested)
- **Blocks**: None
- **Parallel with**: TASK-008, TASK-010
- **Estimated effort**: S (1–2 h)
- **Definition of done**:
  - `npx vitest run groceryStorage` passes with all tests green.
  - All error paths (storage unavailable, malformed data) are covered.
  - No DOM or React imports in the test file.
  - Test file structure and mock pattern matches `notificationStorage.test.ts`.

---

#### TASK-010: Write unit tests for `GroceryItemRow`

- **Description**: Create `client/src/pages/grocery/__tests__/GroceryItemRow.test.tsx` using `@testing-library/react`. Test cases must cover:
  - Renders item name, quantity, and formatted expiry date.
  - `aria-label` is `"Mark Milk as bought"` when `bought === false`.
  - `aria-label` is `"Mark Milk as not bought"` when `bought === true`.
  - Clicking the toggle button calls `onToggle` with the correct item id.
  - Pressing `Enter` on the focused toggle button calls `onToggle`.
  - Pressing `Space` on the focused toggle button calls `onToggle`.
  - When `bought === true`, the item name element has the `line-through` class and `opacity-50` class.
  - When `bought === false`, neither class is applied.
  - The toggle button meets the 44 px touch target (assert `min-h-[44px]` class is present or computed style).
- **Depends on**: TASK-005 (GroceryItemRow must be implemented first)
- **Blocks**: None
- **Parallel with**: TASK-008, TASK-009
- **Estimated effort**: M (2–3 h)
- **Definition of done**:
  - `npx vitest run GroceryItemRow` passes with all tests green.
  - aria-label tests cover both bought and unbought states.
  - Keyboard tests use `userEvent.keyboard('{Enter}')` and `userEvent.keyboard(' ')`.
  - No tests rely on snapshot matching — assertions are specific and behavioural.

---

#### TASK-011: Write integration tests for `GroceryListPage`

- **Description**: Create `client/src/pages/__tests__/GroceryListPage.test.tsx` using `@testing-library/react` with a stubbed `localStorage`. Test cases must cover:
  - Initial render: "To Buy" section heading renders; "Bought" section heading renders; both sections show empty-state messages when `localStorage` is empty.
  - Adding an item: item appears in "To Buy" section; count badge updates to "To Buy (1)".
  - Toggle to bought: item moves from "To Buy" to "Bought" section; count badges update; `wbt_grocery_bought` in `localStorage` contains the item's id.
  - Toggle back to unbought: item moves from "Bought" back to "To Buy"; `wbt_grocery_bought` no longer contains the id.
  - Persistence round-trip: pre-populate `localStorage` with a bought id; render the page; assert item appears in "Bought" section.
  - `useRef` mount guard: assert `wbt_grocery_bought` is NOT written to `localStorage` on initial render (before any toggle).
  - Delete orphan cleanup (CI-03): add an item, mark it as bought, then delete it; assert `wbt_grocery_bought` does not contain the deleted id.
  - Empty "To Buy" state: mark all items as bought; assert "No items yet. Add one above." renders in "To Buy" section.
  - Empty "Bought" state: render with no bought items; assert "No bought items yet." renders in "Bought" section.
  - Count badge accuracy: 4 items, 2 bought → "To Buy (2)" and "Bought (2)" in headings.
- **Depends on**: TASK-007 (GroceryListPage wiring), TASK-008 (handleDelete orphan cleanup)
- **Blocks**: TASK-012
- **Parallel with**: TASK-009, TASK-010
- **Estimated effort**: L (4–5 h)
- **Definition of done**:
  - `npx vitest run GroceryListPage` passes with all tests green.
  - `localStorage` is stubbed (not real browser storage) for deterministic test behaviour.
  - All 10 test scenarios above are covered.
  - No `@ts-ignore` suppressions in the test file.

---

### P3 — Polish & Hardening

---

#### TASK-012: Accessibility audit — touch target and screen reader verification

- **Description**: Perform a manual accessibility audit of the completed feature in the Vite dev server. Verify:
  - Toggle button meets the 44 x 44 CSS px touch target in Chrome DevTools (computed size, not just class presence).
  - `aria-label` dynamically updates after a toggle (confirm with Chrome Accessibility panel or VoiceOver on macOS / NVDA on Windows).
  - Keyboard navigation: Tab moves focus to the toggle button; Enter and Space fire the toggle; focus does not get lost after a toggle.
  - Section headings (`<h2>`) are announced by a screen reader as landmarks.
  - Strikethrough + opacity (not colour alone) is the primary bought visual signal — verify colour contrast is not the only differentiator.
  - Document any deviations found and either fix them (if minor) or open a follow-up ticket (if scope-expanding).
- **Depends on**: TASK-011 (all implementation and testing complete)
- **Blocks**: None
- **Parallel with**: None
- **Estimated effort**: S (1–2 h)
- **Definition of done**:
  - No WCAG 2.1 AA violations found, or all violations are documented and triaged.
  - Toggle button computed size in Chrome DevTools is >= 44 x 44 CSS px.
  - VoiceOver / NVDA announces `"Mark <name> as bought"` and `"Mark <name> as not bought"` correctly.
  - Findings (pass or fail) are noted in the PR description.

---

## Blocked Tasks

There are no externally blocked tasks in this plan. All dependencies are on other tasks within the same plan. The three originally blocked concerns from the design review have been resolved:

- **CI-01** (table refactor): Resolved — TASK-004 is now a named prerequisite task.
- **CI-02** (GroceryItem type): Resolved — TASK-001 is now a named prerequisite task.
- **CI-03** (handleDelete orphan cleanup): Resolved — TASK-008 is now a named task with a hard dependency on TASK-007.

### Potential blockers to watch

| Risk | Unblocking condition |
|------|----------------------|
| OQ-03 (component file location) has two options: `pages/grocery/` sub-folder vs top-level `pages/`. | Engineer makes the decision at the start of TASK-005 and applies it consistently to TASK-006. No external sign-off required. |
| OQ-04 (edit action on bought items): the architecture does not restrict editing to "To Buy" items. | Current decision: editing is allowed on items in both sections (the safest default; no UX regression). Document this in the PR. |
| OQ-05 (global empty state): the centred "Your grocery list is empty" card. | Current decision: remove it in TASK-007; two sections always render with empty-state messages. |
| MS-05 (expiry colouring on bought items): architecture does not specify. | Current decision specified in TASK-005: suppress expiry row background when `bought === true`. |

---

## Parallel Execution Opportunities

The following tasks have no shared dependencies and can be worked concurrently by two engineers if pair/parallel development is available:

**Sprint 1 — Foundation (can parallelise across two engineers):**
- Track A: TASK-001 (type migration) → TASK-004 (table-to-card refactor)
- Track B: TASK-002 (WriteResult verification) → TASK-003 (groceryStorage service) → TASK-009 (storage unit tests)

**Sprint 2 — Core (sequential, single critical path):**
- TASK-005 → TASK-006 → TASK-007 → TASK-008

**Sprint 3 — Testing (can parallelise):**
- Track A: TASK-010 (GroceryItemRow tests) — can start as soon as TASK-005 is complete, before TASK-007
- Track B: TASK-011 (GroceryListPage integration tests) — requires TASK-007 and TASK-008

**Sprint 4 — Polish:**
- TASK-012 (a11y audit) — sequential, after all tests pass

---

## Suggested Implementation Phases

### Phase 1: Prerequisites and Service Layer (P0 Tasks)

**Goal**: All shared types are in the right place, the storage service is implemented and tested, and the table layout is gone. At the end of this phase the grocery page renders (even if temporarily unstyled), and `groceryStorage` is fully unit-tested in isolation.

**Tasks**: TASK-001, TASK-002, TASK-003, TASK-004

**Milestone**: `npx tsc --noEmit` passes; `npx vitest run groceryStorage` passes; grocery page loads in dev server without the table.

**Estimated duration**: 1–2 developer days

---

### Phase 2: Component Build-Out (P1 Tasks)

**Goal**: The full two-section UI is operational. A user can toggle items between sections, see count badges update, see strikethrough/opacity on bought items, and have their bought state survive a page reload.

**Tasks**: TASK-005, TASK-006, TASK-007, TASK-008

**Milestone**: All acceptance criteria AC-01 through AC-13 are manually verifiable in the Vite dev server. `handleDelete` cleans up orphaned ids. `npx tsc --noEmit` passes.

**Estimated duration**: 2–3 developer days

---

### Phase 3: Test Coverage (P2 Tasks)

**Goal**: Full automated test coverage for the storage service, the item row component, and the page-level integration scenarios including the orphan-cleanup regression test.

**Tasks**: TASK-009, TASK-010, TASK-011

**Milestone**: `npm test` in `client/` passes with all new and existing tests green. Coverage includes all error paths and edge cases from the design review.

**Estimated duration**: 1–1.5 developer days

---

### Phase 4: Accessibility Audit and PR (P3 Task)

**Goal**: Feature is production-ready with WCAG 2.1 AA compliance confirmed and a merged PR.

**Tasks**: TASK-012, then open PR via `pr-lifecycle-creator` skill.

**Milestone**: PR merged to `main`. No outstanding accessibility violations.

**Estimated duration**: 0.5 developer days

---

## Open Questions and Risks

| ID | Question / Risk | Impact | Resolution |
|----|-----------------|--------|------------|
| OQ-03 | File location for `GrocerySection` and `GroceryItemRow`: `client/src/pages/grocery/` sub-folder vs flat `client/src/pages/`? | Low — purely organisational | Decide at start of TASK-005; sub-folder is recommended. |
| OQ-04 | Should edit action be available on bought items in the "Bought" section? | Low — UX only | Default: yes, editing is allowed regardless of bought state. Document decision in PR. |
| OQ-05 | Should the global empty state (centred card, `items.length === 0`) be replaced by the two-section layout? | Medium — visible regression if wrong | Decision: remove the global empty state in TASK-007. Both sections always render. |
| MS-05 | Expiry colouring behaviour when an item is in "Bought" state — does `bought` suppress expiry row background? | Low | Decision: suppress expiry colouring when `bought === true`. Strikethrough + opacity is the primary signal. Document in TASK-005 implementation. |
| SC-02 | Silent `localStorage` failure UX risk — user may lose bought state without knowing | Low at this story's scope (NFR-06 explicitly allows console-only error) | No action in this story. A future story can add a degraded-mode indicator. |
| Animation | NFR-04 uses "SHOULD" for 200 ms ease transition. CSS transitions cannot animate DOM removal. | Low | No animation library introduced. A simple `transition-opacity duration-200` on `GroceryItemRow` provides a subtle visual cue. If a smooth slide animation is required, escalate to a separate story with `framer-motion`. |
| Legacy data | If any existing `grocery-list` localStorage entries lack an `id` field, `loadBoughtIds` will return an empty Set but items will render in "To Buy" with no stable id for toggling | Medium — silently broken for legacy data | Add a migration guard in the `items` state initialiser: if any loaded item lacks an `id`, assign `crypto.randomUUID()` before setting state. This should be included in TASK-007 as a defensive sub-step. |
