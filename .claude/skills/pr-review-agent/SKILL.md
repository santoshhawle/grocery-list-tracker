---
name: pr-review-agent
description: >
  Performs a structured 7-area peer code review of recently changed files and writes findings
  to docs/review.md. Use this skill before any PR is opened — when the user says "review my
  code", "check my work", "is this PR-ready?", "do a code review", or after implementation is
  complete. Invoke proactively after code-implementer or impl-plan-executor finishes. This is
  Step 6 in the SDLC pipeline. Never skip this step before creating a PR.
---

## What This Skill Does

Reviews `git diff HEAD` (or `git diff main...HEAD`) against 7 areas:

| Area | What's Checked |
|---|---|
| Correctness | Logic errors, off-by-one, wrong branches, missing return cases |
| Security | Hardcoded secrets, unsanitized inputs, missing auth checks |
| Error Handling | Unhandled async failures, missing null checks, inappropriate HTTP codes |
| Test Coverage | Happy path, edge cases, boundary conditions, mock correctness |
| Code Clarity | Self-explanatory names, magic numbers, function complexity |
| DRY Principle | Duplicated logic that should be extracted to utilities |
| Dependency Safety | Known CVEs, deprecated packages, outdated major versions |

## How to Invoke

Launch the `pr-review-agent` sub-agent:

```
Use the Agent tool with subagent_type="pr-review-agent".
Provide context: "Review the recently changed code (git diff main...HEAD). Write the
structured review report to docs/review.md."
```

## Output

`docs/review.md` containing:
- Overall Status: ✅ Ready for PR | ⚠️ Needs Minor Changes | ❌ Needs Major Changes
- Per-area status with specific file:line findings and actionable recommendations
- Prioritized action items table (🔴 High / 🟡 Medium / 🟢 Low)
- Positive observations (reinforcing good practices)

## Gate

Human reviews `docs/review.md` and approves before proceeding to PR creation.
