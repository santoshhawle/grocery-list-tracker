Advance the SDLC pipeline to the next pending step.

Instructions:
1. Run the same state detection as /sdlc-status to find the current step.
2. Identify the next incomplete step.
3. Launch the `sdlc-pipeline` agent with instruction to execute only that next step.
4. The agent must pause at the approval gate for that step before returning.

Do not skip any steps. If the pipeline is already at a gate awaiting human approval, remind the user which document to review and what approval phrase to use ('approved' or provide feedback).

If the pipeline is fully complete (all 8 steps done), report completion and suggest opening the PR for review.
