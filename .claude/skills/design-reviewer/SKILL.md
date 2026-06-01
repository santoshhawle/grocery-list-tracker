---
name: design-reviewer
description: >
  Reviews docs/architecture.md with senior principal-architect rigor and writes findings to
  docs/design-review.md. Use this skill proactively whenever an architecture document has been
  created or updated — before any code is written. Trigger when the user finishes a design, says
  "can we start coding?", shares a new architecture.md, or makes architectural decisions that
  need validation. Never let implementation begin without running this review first. Also use
  when the user says "review the design", "check the architecture", or "is this architecture good?".
---

## What This Skill Does

Evaluates `docs/architecture.md` across 8 dimensions:
1. Functional completeness
2. Non-functional requirements (scalability, performance, availability)
3. Security (auth model, data protection, attack surface)
4. Data architecture (modeling, migrations, backups)
5. Integration & APIs (contracts, async patterns, failure modes)
6. Operational concerns (observability, deployment, config)
7. Complexity & maintainability
8. Decision rationale (trade-offs documented)

## How to Invoke

Launch the `design-reviewer` sub-agent:

```
Use the Agent tool with subagent_type="design-reviewer".
Provide context: "Review docs/architecture.md and write findings to docs/design-review.md.
Fix any issues found directly in architecture.md."
```

## Output

`docs/design-review.md` containing:
- Status: APPROVED | APPROVED WITH CONDITIONS | REQUIRES REVISION
- Strengths, Critical Issues (blockers), Significant Concerns, Minor Suggestions
- Open Questions for stakeholders
- Agreed Design Decisions

`docs/architecture.md` updated with corrections and `<!-- Updated by design-reviewer -->` markers.

## Gate

Human must review `docs/design-review.md` and approve before proceeding to implementation planning.
