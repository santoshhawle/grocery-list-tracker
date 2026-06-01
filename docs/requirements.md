# Requirements: Mark Grocery Items as Bought

**JIRA Ticket:** KAN-3  
**Date Captured:** 2026-06-01  
**Status:** Final  
**Priority:** Medium  

---

## 1. Overview

This feature adds a toggle mechanism to the Grocery List screen that lets users mark individual items as bought. Bought items are visually distinguished and moved to a separate "Bought" section below the active list, while preserving insertion order within each group. State is persisted to `localStorage` so the list survives page refreshes without a backend round-trip.

---

## 2. User Story

> As a **remote worker using the wellbeing tracker**, I want to **mark grocery items as bought**, so that **I can track what I have already picked up while shopping without losing my original list**.

---

## 3. Functional Requirements

### 3.1 Toggle Bought State

- FR-01: The system MUST provide a tappable/clickable control on each grocery item that toggles the item between the "unbought" and "bought" states.
- FR-02: Activating the toggle on an unbought item MUST move that item to the "Bought" section immediately (within the same render cycle).
- FR-03: Activating the toggle on a bought item MUST move that item back to the "To Buy" section immediately (undo / re-activate behavior).
- FR-04: The toggle control MUST be reachable by keyboard (Enter and Space keys) when focused.

### 3.2 List Sections

- FR-05: The Grocery List screen MUST display two visually distinct sections: **"To Buy"** (unbought items) and **"Bought"** (bought items).
- FR-06: Within the "To Buy" section, items MUST be ordered by their original insertion order (oldest first).
- FR-07: Within the "Bought" section, items MUST be ordered by their original insertion order (oldest first), not by the time they were marked bought.
- FR-08: Both section headings MUST always be rendered, even when the corresponding list is empty.
- FR-09: Each section heading MUST display a live item count badge (e.g., "To Buy (3)").

### 3.3 Empty States

- FR-10: When the "To Buy" section contains no items, the system MUST display the message: "No items yet. Add one above."
- FR-11: When the "Bought" section contains no items, the system MUST display the message: "No bought items yet."

### 3.4 Visual Differentiation

- FR-12: Bought items MUST be rendered with a CSS strikethrough (`text-decoration: line-through`) on the item label.
- FR-13: Bought items MUST be rendered at reduced opacity (0.5) to de-emphasize them.
- FR-14: Unbought items MUST NOT have strikethrough or reduced opacity applied.

### 3.5 State Persistence

- FR-15: The bought/unbought state of all items MUST be persisted to `localStorage` using a key that follows the existing `wbt_` prefix convention.
- FR-16: On page load or browser refresh, the system MUST rehydrate item states from `localStorage` so that bought/unbought status is restored to its last-saved state.
- FR-17: Persistence MUST NOT require any API call or backend change; all state is client-side only for this story.

---

## 4. Non-Functional Requirements

- NFR-01: **Performance** — The toggle interaction (tap/click to state change and DOM update) MUST complete within 100 ms on a mid-range Android or iOS device.
- NFR-02: **Accessibility** — The feature MUST comply with WCAG 2.1 Level AA. Each item's toggle control MUST carry an `aria-label` that reflects its current state, e.g., `"Mark <item name> as bought"` when unbought and `"Mark <item name> as not bought"` when bought.
- NFR-03: **Touch target size** — Every interactive element introduced by this feature MUST have a minimum touch target of 44 × 44 CSS pixels per WCAG 2.5.5.
- NFR-04: **Animation** — Item movement between sections SHOULD use a CSS transition of 200 ms ease to provide visual continuity; the transition MUST NOT block interaction or delay the state update.
- NFR-05: **Browser support** — The feature MUST function correctly in the latest two stable versions of Chrome, Firefox, Safari, and Edge.
- NFR-06: **Storage quota** — The `localStorage` write MUST be wrapped in a try/catch; if storage is unavailable or full, the toggle MUST still work in-memory for the current session and the error MUST be logged to the browser console (no user-facing crash).

---

## 5. Acceptance Criteria

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| AC-01 | Mark an item as bought | The "To Buy" section has at least one item | The user activates the toggle on that item | The item moves to the "Bought" section; its label gains strikethrough and opacity 0.5; the count badges on both sections update accordingly |
| AC-02 | Un-mark a bought item | The "Bought" section has at least one item | The user activates the toggle on that item | The item moves back to the "To Buy" section; strikethrough and reduced opacity are removed; count badges update |
| AC-03 | Insertion order preserved — unbought | The "To Buy" section has items A, B, C in that insertion order and item B is bought | The user activates the toggle on B | B moves to "Bought"; A and C remain in the "To Buy" section in order A, C |
| AC-04 | Insertion order preserved — bought | Items A, B, C were added in that order; A and C are bought | The user views the "Bought" section | A appears before C in the "Bought" section (insertion order, not time-of-toggle) |
| AC-05 | Empty "To Buy" state | All items have been marked bought | The user views the grocery screen | The "To Buy" section heading is still visible and displays the message "No items yet. Add one above." |
| AC-06 | Empty "Bought" state | No items have been marked bought | The user views the grocery screen | The "Bought" section heading is still visible and displays the message "No bought items yet." |
| AC-07 | State persists across refresh | The user has marked item X as bought | The user refreshes the browser | Item X is still shown in the "Bought" section after the page reloads |
| AC-08 | Count badge accuracy | The grocery list has 4 items: 2 unbought, 2 bought | The user views the screen | "To Buy (2)" and "Bought (2)" are displayed in the respective section headings |
| AC-09 | Keyboard accessibility — mark bought | An unbought item's toggle button has keyboard focus | The user presses Enter or Space | The item is marked bought (same outcome as AC-01) |
| AC-10 | Keyboard accessibility — unmark | A bought item's toggle button has keyboard focus | The user presses Enter or Space | The item is moved back to "To Buy" (same outcome as AC-02) |
| AC-11 | aria-label reflects state | An unbought item "Milk" is rendered | A screen reader user inspects the toggle control | The control announces "Mark Milk as bought" |
| AC-12 | aria-label updates after toggle | Item "Milk" is toggled to bought | A screen reader user inspects the same toggle control | The control now announces "Mark Milk as not bought" |
| AC-13 | localStorage unavailable | The browser has `localStorage` disabled or full | The user toggles any item | The toggle updates the in-memory state correctly; no crash or visible error is shown to the user; a console error is logged |

---

## 6. Business Rules

- BR-01: An item exists in exactly one state at any moment — either "unbought" or "bought". There is no intermediate or pending state.
- BR-02: Bought state is toggled, not set-only; a bought item can be returned to the "To Buy" list an unlimited number of times.
- BR-03: The ordering key for items within a section is the original insertion timestamp (or insertion index), NOT the time at which the item was last toggled.
- BR-04: Item text content is not modified when an item is marked bought; only its visual presentation and section placement change.
- BR-05: The `localStorage` key for bought states MUST follow the existing `wbt_` prefix convention used elsewhere in the client (e.g., `wbt_grocery_bought`).

---

## 7. Out of Scope

- Bulk "clear all bought items" action.
- Undo toast or time-limited undo (reverting via re-toggle is sufficient).
- Backend/API persistence of bought state.
- Multi-tab or multi-device synchronization of bought state.
- Reordering items via drag-and-drop within a section.
- Deleting items from the list (separate story).
- Push or in-app notifications related to grocery completion.
- Any changes to the server, database schema, or authentication flow.

---

## 8. Dependencies and Assumptions

**Dependencies:**
- The grocery list feature (item add/display) MUST already be functional before this story is implemented.
- The existing `localStorage` helpers in `client/src/` (following the `wbt_` convention) are available and can be reused or extended.
- React Router 6 route `/grocery` is the target page for all changes.

**Assumptions:**
- A single user session per browser tab is assumed; no multi-tab sync is required.
- The grocery item data structure already includes a stable identifier (id or index) that can serve as the persistence key. If no stable id exists, one will need to be introduced as a prerequisite sub-task.
- The existing test setup (vitest) is sufficient; no additional test tooling needs to be installed.
- Strikethrough + opacity-0.5 is an acceptable visual language for "done" within the existing design system. No designer sign-off is required for this treatment.

---

## 9. Open Questions

None — all questions resolved prior to document finalization.
