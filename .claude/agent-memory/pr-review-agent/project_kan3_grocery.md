---
name: KAN-3 Grocery Feature Context
description: Context about the KAN-3 Mark Grocery Items as Bought feature — its scope, key decisions, and review findings
type: project
---

KAN-3 adds a bought-toggle mechanism to the GroceryListPage. Items split into "To Buy" and "Bought" sections; state persisted via `localStorage` key `wbt_grocery_bought`. Implementation is client-side only — no server changes.

**Why:** Remote workers need to track picked-up items without losing their original list. Pure client-side for this story; backend persistence is explicitly out of scope.

**How to apply:** When suggesting changes to grocery functionality, note that `wbt_grocery_bought` is the authoritative persistence key. The `isMounted` ref guard in `GroceryListPage.tsx` intentionally prevents overwriting localStorage on initial render — preserve this pattern.

Key finding from review: the `items` list `localStorage.setItem` (line 28 of GroceryListPage.tsx, key `grocery-list`) has no try/catch, unlike the bought-ids path. This is a medium-priority fix needed before merge.

Also note: `STORAGE_KEY = 'grocery-list'` does not follow the `wbt_` prefix convention — backlog item to align in a future story.
