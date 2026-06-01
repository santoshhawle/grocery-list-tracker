---
name: pr-lifecycle-creator
description: >
  Creates a complete, professional Pull Request via the GitHub MCP tool — including all 5
  required description sections, a changelog entry, and a dynamic reviewer checklist. Use this
  skill when a feature branch is ready to merge, tests are passing, and the user says "create
  the PR", "open a PR", "submit the pull request", "close out the SDLC cycle", or "the feature
  is done". This is the final step of the agentic SDLC pipeline. Never create a PR without
  collecting test evidence first.
---

## What This Skill Does

Produces and submits a PR with:
1. **Summary** — what was built, why, and the approach
2. **Changes Made** — every changed file with reasons, grouped by concern
3. **Test Evidence** — actual test run output or CI link
4. **Known Limitations** — out-of-scope items, TODOs, follow-up tickets
5. **Reviewer Checklist** — core items + dynamic items tailored to the actual diff (DB migrations, API changes, env vars, etc.)

Also prepends a changelog entry to `CHANGELOG.md` following its existing format.

## How to Invoke

Launch the `pr-lifecycle-creator` sub-agent:

```
Use the Agent tool with subagent_type="pr-lifecycle-creator".
Provide context: "Create a PR for branch [branch-name] targeting [base-branch] in repo
[owner/repo]. Feature: [brief description]. Test evidence: [paste output or say 'retrieve from CI']."
```

## Prerequisites

- Feature branch must be pushed to remote
- Test evidence must be available (CI output, terminal run)
- GitHub MCP must be configured

## Output

- PR URL
- Reminder to update `#TBD` placeholder in changelog with actual PR number
- Draft PR if test evidence is incomplete
