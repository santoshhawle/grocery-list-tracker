---
name: code-implementer
description: >
  Writes production-quality code for a feature, bug fix, or technical task based on
  docs/requirements.md and docs/impl-plan.md. Use this skill whenever requirements are captured
  and it's time to write actual code — after planning is approved, when a ticket is ready to
  implement, when a bug is diagnosed and needs a fix, or when the user says "implement it",
  "write the code", "build this", or "fix it". Invoke proactively whenever requirements +
  architecture are in place and no code has been written yet.
---

## What This Skill Does

Implements code changes by:
1. Reading `docs/requirements.md` and `docs/impl-plan.md` (if present)
2. Exploring the codebase to understand existing patterns
3. Making targeted file changes in dependency order
4. Running tests (`npm test`) and TypeScript type-check (`npx tsc --noEmit`)
5. Reporting results with a structured summary

## How to Invoke

Launch the `code-implementer` sub-agent:

```
Use the Agent tool with subagent_type="code-implementer".
Provide context: "Implement [feature/fix description]. Requirements are in docs/requirements.md.
[Reference impl-plan.md if it exists]. Target project: [uigen/ or project1/]."
```

## Rules the Agent Follows

- Implements exactly what is specified — no gold-plating or scope creep
- Follows project TypeScript conventions (no `any`, no dead code, no comments unless WHY is non-obvious)
- Never leaves tests failing
- Stops and reports blockers rather than silently working around them

## Output

- Modified/created source files
- Test run results (pass/fail counts)
- TypeScript error count
- Structured `## Implementation Summary` report

## Prerequisites

`docs/requirements.md` must exist. Optionally `docs/impl-plan.md` for structured task ordering.
