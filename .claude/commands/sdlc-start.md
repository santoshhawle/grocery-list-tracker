Start the full SDLC pipeline for a Jira story or feature.

Usage: /sdlc-start <ticket-id-or-feature-name>

Arguments: $ARGUMENTS

Instructions:
1. Launch the `sdlc-pipeline` agent with the following context:
   - Story/ticket: $ARGUMENTS
   - Mode: full pipeline from Step 1
   - Check docs/ to detect any existing pipeline artifacts before starting
2. The agent will assess current pipeline state and begin at the correct step.
3. Pause at every human approval gate — do not auto-advance past gates.

If no argument is provided, ask the user for the Jira ticket ID or feature name before starting.
