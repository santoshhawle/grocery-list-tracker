Approve the current pipeline gate and advance to the next step.

Optional feedback: $ARGUMENTS

Use the `sdlc-pipeline` agent to:
1. Infer the active story ID from the current git branch name (e.g., `feature/KAN-7-foo` → `KAN-7`) or ask the user if it cannot be determined.
2. Identify which step is currently at a human approval gate.
3. If feedback is provided in "$ARGUMENTS", route it back to the appropriate agent for revision before advancing.
4. If no feedback (or feedback is "approved" / empty), mark the gate as passed and proceed to the next step.
5. Invoke the next specialist agent with the story ID explicitly in context.

Human approval gates occur after:
- Step 1: User approves `docs/<story-id>/requirements.md`
- Step 3: User approves `docs/<story-id>/design-review.md` and architecture
- Step 4: User approves `docs/<story-id>/impl-plan.md`
- Step 6: User approves `docs/<story-id>/review.md` (code quality)
- Step 8: Human reviewer approves and merges the PR (handled outside the pipeline)

If no gate is currently active, report the current pipeline status and suggest using `/sdlc-next` to advance.
