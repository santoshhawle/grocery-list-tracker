---
name: impl-plan-executor
description: >
  Executes every step in an approved docs/impl-plan.md with strict scope discipline — nothing
  more, nothing less. Use this skill when the user has reviewed and explicitly approved the
  implementation plan and says "go ahead", "implement it", "execute the plan", "plan approved",
  or "proceed". This is distinct from code-implementer (which writes code from requirements);
  this skill faithfully carries out a pre-approved structured plan step by step. Always confirm
  the plan was actually approved before invoking.
---

## What This Skill Does

Reads `docs/impl-plan.md` and executes every specified change:
- File creations, modifications, deletions, and moves
- Commands to run (npm installs, migrations, builds, tests)
- In strict dependency order as defined by the plan

## How to Invoke

Launch the `impl-plan-executor` sub-agent:

```
Use the Agent tool with subagent_type="impl-plan-executor".
Provide context: "The user has approved docs/impl-plan.md. Execute all steps in order.
Stop and report if any step fails."
```

## Execution Rules

- Implements **only** what the plan specifies — no improvisation
- Makes one logical change at a time, verifying each before moving on
- Stops immediately on errors and reports exact error + codebase state
- Never silently works around failures

## Output

Structured final report:
- ✅ Steps completed successfully
- ⚠️ Steps with warnings
- ❌ Failed steps with full error details
- Follow-up actions needed (e.g., restart dev server, run migrations)

## Prerequisites

`docs/impl-plan.md` must exist AND be explicitly approved by the user.
