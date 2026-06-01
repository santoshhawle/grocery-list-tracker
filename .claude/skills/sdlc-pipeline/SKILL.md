---
name: sdlc-pipeline
description: >
  Orchestrates the full 8-step agentic Software Development Lifecycle end-to-end: requirements →
  architecture → design review → implementation plan → code → code review → verification → PR.
  Use this skill when the user wants to run the full pipeline for a story, asks "what's the next
  step?", says "automate the SDLC", "start the pipeline for TICKET-ID", "run the full workflow",
  or is mid-pipeline and wants to continue. This is the master orchestrator — always use it
  instead of manually chaining individual skills when doing end-to-end feature delivery.
---

## What This Skill Does

Manages the 8-step pipeline with human approval gates:

```
Step 1: Capture Requirements    → jira-requirements-analyst   [GATE: approve requirements.md]
Step 2: Design Architecture     → system-architect
Step 3: Review Design           → design-reviewer             [GATE: approve design-review.md]
Step 4: Plan Implementation     → architecture-task-planner   [GATE: approve impl-plan.md]
Step 5: Implement Code          → code-implementer
Step 6: Review Code             → pr-review-agent             [GATE: approve review.md]
Step 7: Verify                  → verify-agent
Step 8: Create Pull Request     → pr-lifecycle-creator        [GATE: human merges PR]
```

Pipeline state is derived from existing `docs/` artifacts:
- `requirements.md` → Step 1 done
- `architecture.md` → Step 2 done
- `design-review.md` → Step 3 done
- `impl-plan.md` → Step 4 done
- Code commits → Step 5 done
- `review.md` → Step 6 done
- `verification-report.md` → Step 7 done

## How to Invoke

Launch the `sdlc-pipeline` sub-agent:

```
Use the Agent tool with subagent_type="sdlc-pipeline".
Provide context: "Run the SDLC pipeline for [TICKET-ID / feature description].
[Or: Pipeline is at step N, user has approved, advance to next step.]"
```

## Slash Commands

The pipeline also responds to project slash commands:
- `/sdlc-start <ticket>` — start full pipeline
- `/sdlc-status` — show current state
- `/sdlc-next` — advance to next step
- `/sdlc-approve` — approve current gate

## Behavioral Rules

- Never skip human approval gates
- Never fabricate pipeline state — derive from actual `docs/` files
- One agent per turn unless user requests parallel execution
- Escalate blockers immediately rather than letting downstream agents fail silently
