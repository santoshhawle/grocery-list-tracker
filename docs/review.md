# Code Review Report

**Date:** 2026-06-01
**Reviewer:** PR Review Agent
**Scope:** KAN-3 — Mark Grocery Items as Bought (uncommitted working-tree changes on `feature-expiry`)
**Branch / Commit:** `feature-expiry` (HEAD: `b6a64e3` — only `docs/requirements.md` committed; all implementation files are staged/untracked pending commit)

Reviewed files:
- `client/src/types.ts`
- `client/src/utils/groceryUtils.ts`
- `client/src/services/groceryStorage.ts`
- `client/src/pages/GroceryListPage.tsx`
- `client/src/pages/grocery/GroceryItemRow.tsx`
- `client/src/pages/grocery/GrocerySection.tsx`
- `client/src/services/__tests__/groceryStorage.test.ts`
- `client/src/pages/grocery/__tests__/GroceryItemRow.test.tsx`
- `client/src/pages/__tests__/GroceryListPage.test.tsx`
- `docs/requirements.md`

---

## Summary

The KAN-3 implementation is well-structured, cleanly separated across service, utility, and component layers, and covers all 13 acceptance criteria from `docs/requirements.md`. All 41 feature-specific tests pass. The primary blocking issue is that the `items` list `useEffect` (line 28 of `GroceryListPage.tsx`) writes to `localStorage` without a try/catch, violating NFR-06 and the error-handling contract established by the sibling `saveBoughtIds` function. Two medium-priority issues also need attention: the `bought` property is not part of the canonical `GroceryItem` type (it is only an intersection type at the section layer), and the Save/Cancel/Edit/Delete action buttons carry only `title` attributes instead of `aria-label`, which does not provide accessible names to screen readers on all platforms. Everything else is solid.

**Overall Status:** Needs Minor Changes

---

## Review Checklist

### 1. Correctness — Pass

All functional requirements and acceptance criteria from `docs/requirements.md` are met:

- **FR-01 through FR-04 (toggle):** `handleToggleBought` in `GroceryListPage.tsx` (lines 78-88) correctly uses an immutable `Set` copy pattern. Toggle is reachable by keyboard because it is a `<button type="button">` — browsers natively fire `click` on Enter and Space for buttons (AC-09, AC-10 verified by test).
- **FR-05 through FR-09 (sections):** `GrocerySection` always renders even when `items.length === 0` (FR-08). Count badge at line 38 of `GrocerySection.tsx` reflects `items.length` live (FR-09, AC-08).
- **FR-10, FR-11 (empty states):** Correct messages passed via `emptyMessage` prop (AC-05, AC-06).
- **FR-12 through FR-14 (visual):** `line-through` and `opacity-50` classes applied conditionally on `bought` prop in `GroceryItemRow.tsx` lines 44 and 84 (AC-01, AC-02).
- **FR-15 through FR-17 (persistence):** `loadBoughtIds` / `saveBoughtIds` use `wbt_grocery_bought` key. `isMounted` guard on lines 31-37 of `GroceryListPage.tsx` prevents overwriting `localStorage` on initial render, protecting the rehydration scenario (AC-07).
- **BR-03 (insertion order):** Items are stored in insertion order in the `items` array. The derived `toBuyItems` / `boughtItems` arrays (lines 90-96 of `GroceryListPage.tsx`) use `Array.filter`, which preserves array order. Correct.
- **Delete orphan cleanup (lines 53-60):** When an item is deleted, its id is also removed from `boughtIds`. Correct.

No logic errors found.

---

### 2. Security — Pass

- No secrets, API keys, or tokens are present in any of the reviewed files.
- No user input is passed to SQL, shell commands, file paths, or `eval`-equivalent constructs. The grocery item name and quantity are rendered as React text nodes (not `dangerouslySetInnerHTML`), so XSS injection is not a risk.
- `localStorage` values are deserialized with an explicit type guard in `loadBoughtIds` (line 13 of `groceryStorage.ts`): `parsed.filter((v): v is string => typeof v === 'string')` — prevents unexpected types from polluting the `Set`.
- `console.error` at line 24 of `groceryStorage.ts` logs the raw error object, not any user data. The pre-commit hook blocks `console.log` but not `console.error`, so this will not block the commit. Acceptable per NFR-06.

No security issues found.

---

### 3. Error Handling — Warning

**Finding 1 — Medium: `localStorage.setItem` for the item list has no try/catch.**

`GroceryListPage.tsx`, line 28:
```ts
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}, [items]);
```

`saveBoughtIds` in `groceryStorage.ts` wraps its `setItem` in try/catch and returns a `WriteResult`. The sibling write for the item list (using `STORAGE_KEY = 'grocery-list'`) does not. If `localStorage` is unavailable or full, this call throws an unhandled exception that bubbles up and crashes the React render. NFR-06 requires the toggle to remain functional in-memory without crashing; this bare write is the only path that can violate that requirement.

**Recommendation:** Wrap line 28 in a try/catch, or extract a `saveItems` helper in `groceryStorage.ts` that mirrors the pattern used by `saveBoughtIds`.

**Finding 2 — Low: `loadBoughtIds` parse failure silently discards data.**

`groceryStorage.ts`, lines 7-17 — the outer try/catch swallows all errors from `localStorage.getItem` and `JSON.parse`. NFR-06 explicitly requires that errors be logged to the browser console. If the key exists but is malformed, the error is silently discarded.

**Recommendation:** Add `console.error(error)` in the catch block of `loadBoughtIds`, mirroring `saveBoughtIds`.

---

### 4. Test Coverage — Pass

**groceryStorage.test.ts (13 tests):**
- Happy path: `loadBoughtIds` returns correct `Set`, `saveBoughtIds` writes and returns `{ success: true }`.
- Error paths: `SecurityError` on `getItem`, malformed JSON, non-array JSON, `QuotaExceededError` on `setItem`.
- Contract tests: exact key `wbt_grocery_bought`, empty `Set`, round-trip fidelity, `console.error` spy on failure.

**GroceryItemRow.test.tsx (14 tests):**
- Render: name, quantity, formatted date.
- ARIA: toggle `aria-label` for bought and unbought states (AC-11, AC-12).
- Keyboard: Enter and Space via `userEvent.keyboard` (AC-09, AC-10).
- Visual state: `line-through` and `opacity-50` applied/removed correctly (AC-01, AC-02).
- Touch targets: `min-h-[44px]` and `min-w-[44px]` class presence (NFR-03).

**GroceryListPage.test.tsx (16 tests):**
- Initial render, section headings, empty-state messages.
- Adding an item, count badge update.
- Toggle to bought, toggle back to unbought, localStorage state after each.
- Persistence round-trip (item pre-populated in storage appears in Bought section on render — AC-07).
- `isMounted` guard: verifies `wbt_grocery_bought` is NOT written on initial render.
- Delete orphan cleanup: bought id removed from storage on delete; unbought item delete leaves bought storage intact.
- Empty states when all items bought / no items bought.
- Count badge accuracy with 4 items, 2 bought (AC-08).

**Coverage gaps (Low priority):**
- No test covers insertion-order preservation when multiple items exist and a middle item is toggled (AC-03, AC-04). The logic is correct (filter preserves array order), but the requirement is not explicitly exercised with an assertion on relative order.
- No test covers the `localStorage` write failure path for the item list (uncaught exception from line 28 of `GroceryListPage.tsx`).
- No test covers `loadBoughtIds` when the error is silently swallowed without logging.

---

### 5. Code Clarity — Pass

- Function and variable names are self-explanatory: `handleToggleBought`, `toBuyItems`, `boughtItems`, `loadBoughtIds`, `saveBoughtIds`, `isMounted`.
- The `isMounted` guard pattern is not self-documenting. A brief comment would help future maintainers understand why the first effect fire is intentionally skipped.

  `GroceryListPage.tsx`, lines 31-37:
  ```ts
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;   // skip the first fire — initial state is loaded from storage, not saved back
    }
    groceryStorage.saveBoughtIds(boughtIds);
  }, [boughtIds]);
  ```

- The `bought: false as const` and `bought: true as const` pattern in `GroceryListPage.tsx` lines 92 and 96 is intentional (it lets TypeScript narrow the union in the derived arrays) but the intent is not immediately obvious.

- Magic string `'grocery-list'` (line 8 of `GroceryListPage.tsx`) does not follow the `wbt_` prefix convention from BR-05 and the CLAUDE.md architecture note. The existing items list predates this story, but the inconsistency is worth flagging.

**Recommendation (Low):** Add a one-line comment to the `isMounted` guard and consider renaming `STORAGE_KEY` to `'wbt_grocery_items'` to align with the prefix convention (note: this is a separate story scope concern — document it but do not fix in this PR).

---

### 6. DRY Principle — Warning

**Finding 1 — Medium: `mockStorage` helper is duplicated verbatim.**

The `mockStorage` IIFE appears in two test files with identical implementations:
- `client/src/services/__tests__/groceryStorage.test.ts`, lines 6-17
- `client/src/pages/__tests__/GroceryListPage.test.tsx`, lines 13-24

Both include `getItem`, `setItem`, `removeItem`, `clear`, `length`, `key`, and the `_store` debug accessor.

**Recommendation:** Extract the shared mock into `client/src/test/mockLocalStorage.ts` (alongside the existing `client/src/test/setup.ts`) and import it in both test files. This eliminates the duplication and ensures any future changes to the mock (e.g., simulating `SecurityError`) are applied consistently.

**Finding 2 — Low: Inline form shape `{ name: string; quantity: string; expiryDate: string }` is repeated three times.**

The object shape appears in:
- `GroceryItemRow.tsx` `EditState` interface (line 8)
- `GrocerySection.tsx` props interface (lines 15-16)
- `GroceryListPage.tsx` state type (lines 19, 22)

**Recommendation:** Extract as a named type `GroceryFormData` in `types.ts`. Not a blocker, but reduces friction for future form field additions.

---

### 7. Dependency Safety — Pass

Packages relevant to KAN-3:

| Package | Version in package.json | Notes |
|---|---|---|
| `react` | `^18.2.0` | Stable. React 19 is available but not required for this feature. |
| `react-dom` | `^18.2.0` | Matches React version. |
| `lucide-react` | `^0.344.0` | Used for `Check`, `Pencil`, `Trash2`, `X` icons. No known CVEs. |
| `vitest` | `^4.1.6` | Current major. No known CVEs. |
| `@testing-library/react` | `^16.3.2` | Current. Compatible with React 18. |
| `@testing-library/user-event` | `^14.6.1` | Current. |
| `typescript` | `^5.3.3` | TypeScript 5.8 is available; no breaking changes that affect this code. |
| `vite` | `^5.1.0` | Vite 6 is available; no migration required for this feature. |

No packages with known CVEs were identified for the code paths exercised by this feature. Running `npm audit` in `client/` is recommended before the PR is merged, as transitive dependency advisories can appear between review sessions. The deprecation warning about `esbuild` / `oxc` options from `vite:react-babel` is a Vite/plugin version mismatch — not a security issue, but it will generate noise in CI logs.

---

## Action Items

| Priority | Area | File | Issue | Suggested Fix |
|----------|------|------|-------|---------------|
| Medium | Error Handling | `client/src/pages/GroceryListPage.tsx` line 28 | `localStorage.setItem(STORAGE_KEY, ...)` has no try/catch — can crash the component if storage is full | Wrap in try/catch or delegate to a `saveItems` helper in `groceryStorage.ts` mirroring `saveBoughtIds` |
| Medium | DRY | `groceryStorage.test.ts` lines 6-17 and `GroceryListPage.test.tsx` lines 13-24 | `mockStorage` IIFE duplicated verbatim in two test files | Extract to `client/src/test/mockLocalStorage.ts` and import in both |
| Medium | Accessibility | `client/src/pages/grocery/GroceryItemRow.tsx` lines 103-134 | Save, Cancel, Edit, Delete buttons have only `title` attributes; `title` is not a reliable accessible name on touch devices and some screen readers | Replace `title="Save"` etc. with `aria-label="Save"` (or add both) |
| Low | Error Handling | `client/src/services/groceryStorage.ts` lines 7-17 | `loadBoughtIds` catch block silently discards errors without logging — violates NFR-06 spirit | Add `console.error(error)` in the catch block |
| Low | Code Clarity | `client/src/pages/GroceryListPage.tsx` lines 31-37 | `isMounted` guard has no explanatory comment | Add one-line comment: `// skip first fire — initial state is loaded from storage, not saved back` |
| Low | Test Coverage | `GroceryListPage.test.tsx` | No test asserts relative insertion order is preserved when a middle item is toggled (AC-03, AC-04) | Add a test that adds items A, B, C, toggles B, and asserts A then C remain in "To Buy" in order |
| Low | Code Clarity | `client/src/pages/GroceryListPage.tsx` line 8 | `STORAGE_KEY = 'grocery-list'` does not follow `wbt_` prefix convention from BR-05 | Backlog item to rename to `wbt_grocery_items` in a follow-up story (out of scope for KAN-3 but worth tracking) |

---

## Positive Observations

1. **`loadBoughtIds` defensive parsing is exemplary.** The explicit `Array.isArray` guard combined with the per-element `typeof v === 'string'` type predicate (line 13 of `groceryStorage.ts`) means no amount of malformed `localStorage` state can produce a `Set` with non-string members. This is exactly the right level of paranoia for user-controlled storage.

2. **The `isMounted` guard correctly solves the rehydration vs. persistence conflict.** Using a `useRef` (not `useState`) for the mount flag ensures the guard itself never triggers a re-render, and placing initial state in the lazy initializer (not a `useEffect`) means the guard reliably fires exactly once. The round-trip persistence test in `GroceryListPage.test.tsx` verifies this works end-to-end.

3. **Test file organisation and naming is clean and consistent.** Grouping tests into `describe` blocks by concern (rendering, aria-label, toggle interactions, visual state, touch target) makes failures instantly diagnosable. The use of `within(getSection(...))` scoping in `GroceryListPage.test.tsx` correctly isolates assertions to a specific DOM section, avoiding false positives when the same item name could theoretically appear in both sections during a transition.
