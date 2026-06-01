---
name: verify-agent
description: >
  Runs a two-track verification suite: (1) unit + integration tests with TypeScript type-checking,
  and (2) content quality audit of all docs/ files. Use this skill after any significant feature
  or documentation update — when the user says "verify everything", "make sure tests pass",
  "check the docs are accurate", "are we ready to merge?", or before creating a PR. This is
  Step 7 in the SDLC pipeline. Invoke proactively after code-review is approved and before
  PR creation to catch any remaining issues.
---

## What This Skill Does

### Track 1: Code Verification
- Confirms dependencies installed and Prisma client generated
- Runs unit tests (`npm test`) and captures pass/fail/skip counts + coverage
- Runs integration/E2E tests (`npx playwright test` for project1/)
- Runs TypeScript check (`npx tsc --noEmit`) and ESLint if configured
- Flags flaky tests, skipped tests, zero-assertion tests

### Track 2: Document Quality Verification
- Audits all files under `docs/` for:
  - **Structure**: Missing sections, broken links, malformed tables, unclosed code blocks
  - **Content**: Claims that contradict the codebase, outdated API refs, missing examples
  - **Formatting**: Placeholder text (TBD, Lorem ipsum), TODO/FIXME in docs, style inconsistencies

## How to Invoke

Launch the `verify-agent` sub-agent:

```
Use the Agent tool with subagent_type="verify-agent".
Provide context: "Run full verification for [uigen/ or project1/]. Check both code
correctness (tests + TypeScript) and docs/ content quality."
```

## Output

Consolidated `# Verification Suite Report` with:
- Summary table: Code | Docs × Status | HIGH | MEDIUM | LOW
- Prioritized action items (HIGH = release blocker)
- Next steps for anything that must be resolved before shipping

## Severity Levels
- **HIGH**: Test failures, incorrect API docs — blocks release
- **MEDIUM**: Flaky tests, unclear examples — should fix before release
- **LOW**: Style inconsistencies — nice to fix
