---
name: KAN-3 Design Review Context
description: Key findings and agreed decisions from the KAN-3 (Mark Grocery Item as Bought) architecture review
type: project
---

KAN-3 architecture review was completed 2026-06-01. Status: APPROVED WITH CONDITIONS.

The feature is a pure client-side addition to `/grocery` — no server or DB changes. Bought state is persisted in `localStorage` under key `wbt_grocery_bought` (a separate key from the existing `grocery-list` item-list key, per ADR-001).

**Critical findings that shaped the implementation plan:**

1. The current `GroceryListPage.tsx` uses an HTML `<table>` layout. The architecture describes a two-section card layout (`GrocerySection` + `GroceryItemRow`). These are incompatible — the table must be replaced as a prerequisite refactor before bought-state logic is wired in.

2. `GroceryItem` type location was ambiguous ("or promoted to types.ts"). Resolved: it goes in `client/src/types.ts` alongside other domain types.

3. `handleDelete` must also remove the deleted id from `boughtIds` and call `saveBoughtIds`. This was flagged as a "MUST" in the architecture but had no named implementation task — added explicitly in the updated Next Steps.

**Agreed design decisions (D-01 through D-05):**
- D-01: `GroceryItem` in `types.ts`
- D-02: `GrocerySection` receives pre-filtered items; derives count from `items.length`; no `boughtIds` prop
- D-03: `handleDelete` cleans up orphaned ids in `boughtIds`
- D-04: `saveBoughtIds` returns `WriteResult { success: boolean }` (matches `notificationStorage` pattern)
- D-05: `useRef` mounted guard in the `useEffect([boughtIds])` to suppress spurious write on initial mount

**Why:** Implementation plan (impl-plan.md) must include all five decisions as explicit tasks.
**How to apply:** In future reviews of grocery-feature related work, verify these five decisions are reflected in the implementation. Watch for the table-vs-card layout discrepancy as a common source of scope creep.
