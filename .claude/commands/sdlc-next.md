Advance the SDLC pipeline to the next pending step.

Use the `sdlc-pipeline` agent to:
1. Infer the active story ID from the current git branch name (e.g., `feature/KAN-7-foo` → `KAN-7`) or ask the user if it cannot be determined.
2. Assess the current pipeline state by checking `docs/<story-id>/` artifacts and git history.
3. Identify the next incomplete step.
4. Announce the step and the agent that will handle it.
5. Invoke that specialist agent with the story ID explicitly in context.
6. Pause at a human approval gate if this step requires one.

If the pipeline is already at a gate waiting for approval, remind the user to use `/sdlc-approve` to proceed.

If all 8 steps are complete, report that the pipeline is finished and the PR is ready for review.
