---
name: KAN-3 Implementation Plan — Key Decisions
description: Planning decisions, dependency order, and resolved open questions from the KAN-3 (Mark Grocery Item as Bought) impl-plan session.
type: project
---

The impl-plan for KAN-3 was produced on 2026-06-01 and written to docs/impl-plan.md. 12 tasks across 4 priority tiers.

**Why:** Pure client-side feature. Three critical issues from design-review required elevation to named prerequisite tasks.

**Key ordering constraint:** TASK-001 (type migration) must complete before any component or service task because GroceryItem is referenced across 3+ files.

**Resolved open questions encoded in tasks:**
- OQ-03: Component file location → `client/src/pages/grocery/` sub-folder (decided in TASK-005).
- OQ-05: Global empty state removed in TASK-007; two sections always render.
- MS-05: Suppress expiry row background when `bought === true` (decided in TASK-005).

**Dependency order critical path:**
TASK-001 → TASK-004 → TASK-005 → TASK-006 → TASK-007 → TASK-008 → TASK-011

**Parallel opportunity:** TASK-002/003/009 (storage track) can run alongside TASK-001/004 (layout track).

**How to apply:** When resuming this ticket or reviewing PR, use the task IDs in impl-plan.md to verify scope. Any change to GrocerySection props or handleDelete must trace back to design decisions D-02 and D-03 respectively.
