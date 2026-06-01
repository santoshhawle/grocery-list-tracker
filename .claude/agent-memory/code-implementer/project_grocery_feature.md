---
name: KAN-3 Grocery Bought Feature
description: Implementation details and decisions made for the Mark Grocery Item as Bought feature (KAN-3)
type: project
---

KAN-3 (Mark Grocery Item as Bought) was implemented on 2026-06-01 and is complete on the `feature-expiry` branch.

**Why:** Required feature to let users track picked-up grocery items without losing their list; state persisted client-side only to `wbt_grocery_bought` localStorage key.

**How to apply:** When working on follow-on grocery features, the file layout and state patterns are:
- `client/src/types.ts` — `GroceryItem` interface lives here
- `client/src/utils/groceryUtils.ts` — `daysUntil`, `expiryStatus`, `formatDate`, `rowBg`, `StatusBadge`
- `client/src/services/groceryStorage.ts` — `loadBoughtIds()`, `saveBoughtIds()` using `wbt_grocery_bought` key
- `client/src/pages/grocery/GroceryItemRow.tsx` — individual item card with toggle button
- `client/src/pages/grocery/GrocerySection.tsx` — section wrapper (To Buy / Bought)
- `client/src/pages/GroceryListPage.tsx` — page; uses `useRef` mount guard to skip initial `saveBoughtIds` write

Pre-existing test failures (not caused by this feature): `CheckInPage.test.tsx`, `SettingsPage.test.tsx`, `ExportControls.test.tsx` all import modules that don't exist yet.
