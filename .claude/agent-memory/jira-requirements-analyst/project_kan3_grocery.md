---
name: KAN-3 Grocery Bought Toggle — requirements context
description: Key decisions and patterns surfaced during KAN-3 requirements elicitation for the grocery bought-toggle feature
type: project
---

Requirements for KAN-3 (Mark Grocery Items as Bought) were captured on 2026-06-01 and committed to docs/requirements.md on branch feature-expiry (commit b6a64e3).

Key decisions made during elicitation:
- Ordering rule: within each section (To Buy / Bought), items keep original **insertion order**, not time-of-toggle order.
- State persistence: client-side `localStorage` only, following existing `wbt_` prefix convention. No backend changes.
- Toggle is bidirectional: bought items can be re-activated by tapping again (no separate undo).
- Visual treatment: strikethrough + opacity 0.5 for bought items. No color change (accessibility concern noted).
- Both section headers always visible; each has a live count badge.
- Empty states: "No items yet. Add one above." (To Buy) and "No bought items yet." (Bought).
- Accessibility: WCAG 2.1 AA; aria-labels reflect current state; 44x44 touch targets.
- Animation: 200ms CSS transition on section move, non-blocking.
- Bulk clear and multi-tab sync are explicitly out of scope.

**Why:** User deferred all design/technical decisions to best-practice defaults — the above choices represent the agreed defaults.

**How to apply:** If follow-on stories extend the grocery feature, treat these decisions as settled baseline. Any change to ordering or persistence strategy should be flagged as a scope change.
