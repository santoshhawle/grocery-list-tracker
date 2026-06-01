---
name: system-architect
description: >
  Reads docs/requirements.md and produces a comprehensive docs/architecture.md with component
  design, technology stack, data flows, and architectural decision records. Use this skill
  whenever requirements are captured and the system design hasn't been done yet — when the user
  says "design the architecture", "what tech stack should we use?", "create an architecture doc",
  or after jira-requirements-analyst completes. Invoke proactively after requirements are approved
  and before any design review or implementation planning begins. This is Step 2 in the SDLC pipeline.
---

## What This Skill Does

Produces `docs/architecture.md` by:
1. Reading `docs/requirements.md` in full
2. Analyzing functional requirements, NFRs, constraints, and integration points
3. Choosing and justifying an architectural pattern (monolith, microservices, event-driven, etc.)
4. Designing all key components with responsibilities, interfaces, and technology choices
5. Defining the technology stack per layer with rationale
6. Documenting primary data flows (happy paths and error flows)
7. Writing Architecture Decision Records (ADRs) for key choices

## How to Invoke

Launch the `system-architect` sub-agent:

```
Use the Agent tool with subagent_type="system-architect".
Provide context: "Read docs/requirements.md and produce docs/architecture.md.
Include component diagram, tech stack table, data flows, and ADRs."
```

## Output

`docs/architecture.md` structured with:
- Overview, Architecture Pattern, Key Components table + detailed descriptions
- Component diagram (ASCII or Mermaid)
- Technology Stack table (each layer with rationale)
- Data Flow sequences
- Non-functional considerations (scalability, security, availability, observability)
- ADRs with status, context, decision, and consequences
- Assumptions & Open Questions

## Gate

Run `design-reviewer` after this to validate the architecture before planning implementation.
