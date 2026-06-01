---
name: architecture-task-planner
description: >
  Breaks down an approved architecture document (docs/architecture.md) into a prioritized,
  dependency-ordered implementation plan written to docs/impl-plan.md. Use this skill whenever
  the user has a finalized architecture and wants to know what to build first, needs tasks ordered
  by dependencies, wants blockers identified, or asks "what's the implementation plan?" after
  architecture approval. Always invoke this after design review is complete and before development
  begins — don't wait for the user to ask explicitly.
---

## What This Skill Does

Reads `docs/architecture.md` and produces `docs/impl-plan.md` containing:
- Tasks decomposed to developer-day granularity (P0–P3 priority tiers)
- Full dependency graph (what blocks what, what can run in parallel)
- Explicitly flagged blocked tasks with unblocking conditions
- Suggested implementation phases with milestones

## How to Invoke

Launch the `architecture-task-planner` sub-agent:

```
Use the Agent tool with subagent_type="architecture-task-planner".
Provide context: "Read docs/architecture.md and produce docs/impl-plan.md with a
prioritized, dependency-ordered task list. Flag any blocked tasks."
```

## Prerequisites

- `docs/architecture.md` must exist and be approved (run design-reviewer first if not)
- No code should be written before this plan is produced

## Output

`docs/impl-plan.md` structured as:
- Dependency graph overview
- P0 (Foundation) → P1 (Core) → P2 (Supporting) → P3 (Polish) task tiers
- Per-task: description, depends-on, blocks, parallel-with, effort estimate, definition of done
- Blocked tasks section with unblocking conditions
- Parallel execution opportunities
- Suggested implementation phases

## When Complete

Review `docs/impl-plan.md` and approve it before invoking the `code-implementer` or
`impl-plan-executor` skill.
