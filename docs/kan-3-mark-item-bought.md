# User Story: Mark Grocery Item as Bought

**Story ID:** KAN-3
**Epic:** Grocery List Management
**Priority:** High
**Story Points:** 3

---

## User Story

> **As a** shopper,
> **I want to** mark grocery items as bought while I'm shopping,
> **So that** I can track what I've already picked up without removing it from the list.

---

## Background / Context

The current grocery list lets users add, edit, and delete items but has no way to indicate an item has been collected. Users shopping in-store need to tick off items as they go, while keeping a visible record of what's done vs. still needed.

---

## Acceptance Criteria

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | An item is in the list | The user clicks the checkbox | The item is marked as bought — visually struck-through and dimmed |
| AC2 | An item is marked as bought | The user clicks the checkbox again | The item is unmarked and returns to its normal state |
| AC3 | Items are in the list | The page loads | Bought state is persisted (survives page refresh) |
| AC4 | Some items are bought | The user views the list | Unbought items appear at the top; bought items are grouped at the bottom |
| AC5 | All items are bought | The user views the list | A "All done! 🎉" summary message is shown |
| AC6 | An item is bought | The expiry status badge | Is still visible so expired/soon warnings are not hidden |

---

## UI / UX Behaviour

- **Checkbox** appears as the first column in the table row
- **Bought row style:** text `line-through`, row opacity reduced (`opacity-50`), border-left color changes to gray regardless of expiry status
- **Sort order:** unbought items always render above bought items
- **Persist:** bought state saved to `localStorage` alongside existing item data (add `bought: boolean` to `GroceryItem`)
- **No delete on buy:** buying does not remove the item; user must explicitly delete

---

## Out of Scope

- Server-side persistence of bought state
- "Clear all bought items" bulk action *(future story)*
- Bought history / audit log *(future story)*

---

## Definition of Done

- [ ] Checkbox renders in each table row
- [ ] Clicking toggles `bought` state and updates visual style
- [ ] Bought items sort below unbought items
- [ ] "All done" message appears when every item is checked
- [ ] State persists across page refresh via `localStorage`
- [ ] Works on mobile (touch-friendly checkbox target)
- [ ] No TypeScript errors / existing tests still pass

---

**Created by:** Santosh Hawle
**Date:** 2026-05-31
