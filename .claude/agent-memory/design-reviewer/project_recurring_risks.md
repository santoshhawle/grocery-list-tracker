---
name: Recurring Architecture Risks — Capstone Project
description: Recurring risk patterns observed in architecture reviews for this project
type: project
---

These risks have appeared in at least one design review. Flag them on every future review.

**1. Type location ambiguity**
Architecture documents in this project have a habit of writing "defined in X (or promoted to Y)". This is deferred ambiguity, not a decision. Always resolve to a single answer before approving. For this project, shared domain types go in `client/src/types.ts`.

**2. localStorage orphan accumulation**
Any feature that stores item ids in a separate localStorage key (pattern: `Set<string>` of ids referencing items in another key) must also handle cleanup in the delete handler. This was missed in KAN-3's `handleDelete` design.

**3. useEffect dependency on object/Set reference — spurious mount write**
`useEffect([someSet])` will fire on initial mount because the Set reference is new. The architecture must specify a mounted guard (`useRef`) to prevent a redundant localStorage write on every page load.

**4. Existing layout vs. described layout mismatch**
Always read the actual source file before approving an architecture that describes new components. KAN-3 described a card layout over an existing table layout without calling out the refactor cost.

**5. Service return type inconsistency**
`notificationStorage` returns `WriteResult { success: boolean }` from writes. New storage services should match this pattern. Architecture documents sometimes default to `void` for new services without noticing the inconsistency.

**Why:** All five were found in KAN-3 review. They are patterns, not one-offs.
**How to apply:** Use as a quick-scan checklist when reading any new architecture.md.
