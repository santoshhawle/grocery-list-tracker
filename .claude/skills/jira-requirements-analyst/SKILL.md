---
name: jira-requirements-analyst
description: >
  Fetches a JIRA user story, conducts an interactive clarification session, and produces
  a committed docs/requirements.md. Use this skill whenever the user provides a JIRA ticket ID,
  mentions a story that needs to be formalized, says "process this story", "capture requirements
  for TICKET-ID", "formalize this backlog item", or wants acceptance criteria documented before
  development starts. Invoke proactively at the start of any new feature work when a Jira ticket
  exists. Do not skip the clarifying questions step even if the story looks complete.
---

## What This Skill Does

Runs a structured 5-step requirements elicitation workflow:
1. Fetches full JIRA ticket details via MCP (title, description, AC, labels, linked issues)
2. Analyzes the story for ambiguities, missing criteria, and edge cases
3. Presents a categorized batch of clarifying questions (Functional, NFR, UX, Technical, Business Rules)
4. Writes a comprehensive `docs/requirements.md` with FRs, NFRs, ACs in Given/When/Then, business rules, out-of-scope, and dependencies
5. Commits the file with message: `docs: capture requirements for TICKET-ID - Story Title`

## How to Invoke

Launch the `jira-requirements-analyst` sub-agent:

```
Use the Agent tool with subagent_type="jira-requirements-analyst".
Provide context: "Process JIRA ticket [TICKET-ID]. Fetch the story, run the clarification
session with the user, and commit docs/requirements.md."
```

## Output

`docs/requirements.md` structured with:
- Overview, User Story, Functional Requirements (FR-NN), Non-Functional Requirements (NFR-NN)
- Acceptance Criteria table (Given/When/Then)
- Business Rules, Out of Scope, Dependencies & Assumptions, Open Questions

Commit hash returned on completion.

## Prerequisites

JIRA MCP must be configured and the user must provide a valid ticket ID.
