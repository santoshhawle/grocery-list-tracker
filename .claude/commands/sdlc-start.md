Launch the SDLC pipeline orchestrator for ticket $ARGUMENTS.

Use the `sdlc-pipeline` agent to start the full 8-step agentic SDLC pipeline for the Jira story or feature described in "$ARGUMENTS".

The story ID is derived from "$ARGUMENTS" (e.g., "KAN-7"). All pipeline artifacts are stored under `docs/<story-id>/` (e.g., `docs/KAN-7/`).

The agent should:
1. Capture the story ID from "$ARGUMENTS".
2. Assess the current pipeline state by checking which `docs/<story-id>/` artifacts already exist.
3. Report the current status using the pipeline status table format.
4. Begin at the first incomplete step — starting with Step 1 (jira-requirements-analyst) if no docs exist.
5. Pause at each human approval gate before advancing.

If no ticket ID is provided, ask the user for one before proceeding.
