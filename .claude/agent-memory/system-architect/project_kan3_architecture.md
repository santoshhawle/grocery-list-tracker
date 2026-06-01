---
name: KAN-3 Architecture Decisions
description: Key architectural decisions and patterns established for the Mark Grocery Item as Bought feature
type: project
---

Architecture for KAN-3 (Mark Grocery Item as Bought) is documented in docs/architecture.md (v1.0, 2026-06-01).

Pattern chosen: Component-State + Service-Layer (pure client-side). No server changes.

Key decisions:
- Bought state stored separately in `wbt_grocery_bought` localStorage key (NOT embedded in GroceryItem objects)
- Sections derived via `.filter()` on a single `items[]` + `boughtIds: Set<string>` — insertion order trivially correct
- New `client/src/services/groceryStorage.ts` service module, matching notificationStorage pattern
- `GroceryListPage` extracts two sub-components: `GrocerySection` and `GroceryItemRow`
- Existing `grocery-list` key (missing `wbt_` prefix) is NOT renamed in this story

**Why:** Each decision documented in ADR-001 through ADR-005 in architecture.md.

**How to apply:** When generating impl-plan or reviewing code, ensure bought state uses the separate key and items array is never reordered — only filtered.
