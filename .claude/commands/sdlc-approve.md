Approve the current SDLC gate and advance to the next step.

Arguments (optional): $ARGUMENTS — any feedback or notes to pass forward

Instructions:
1. Detect the current pipeline state (same as /sdlc-status).
2. Identify which gate is currently pending approval.
3. Record the approval in the pipeline log: append a line to `.claude/pipeline.log`:
   `[<timestamp>] Gate approved: Step <N> — <Step Name>`
4. If $ARGUMENTS contains feedback (not just 'approved'), route it back to the agent that produced the current artifact for revision before advancing.
5. If no feedback, launch the `sdlc-pipeline` agent to execute the next step.

Valid gates (documents to approve before advancing):
- Step 1 gate → docs/requirements.md approved → proceed to Step 2
- Step 3 gate → docs/design-review.md approved → proceed to Step 4
- Step 4 gate → docs/impl-plan.md approved → proceed to Step 5
- Step 6 gate → docs/review.md approved → proceed to Step 7
