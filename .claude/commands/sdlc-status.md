Show the current SDLC pipeline status by inspecting docs/ and git state.

Instructions:
1. Check which pipeline artifact files exist under docs/:
   - docs/requirements.md       → Step 1 complete
   - docs/architecture.md       → Step 2 complete
   - docs/design-review.md      → Step 3 complete
   - docs/impl-plan.md          → Step 4 complete
   - docs/review.md or docs/code-review.md → Step 6 complete
   - docs/verification-report.md → Step 7 complete
2. Check git log for recent commits to detect if Step 5 (code) is done.
3. Check for any open GitHub PRs to detect if Step 8 is done.
4. Output the pipeline status table in this format:

```
## SDLC Pipeline Status
Date: <today>

| Step | Name                  | Status      | Artifact |
|------|-----------------------|-------------|----------|
| 1    | Capture Requirements  | ✅/⏳/❌   | docs/requirements.md |
| 2    | Design Architecture   | ✅/⏳/❌   | docs/architecture.md |
| 3    | Review Design         | ✅/⏳/❌   | docs/design-review.md |
| 4    | Plan Implementation   | ✅/⏳/❌   | docs/impl-plan.md |
| 5    | Implement Code        | ✅/⏳/❌   | git commits |
| 6    | Review Code           | ✅/⏳/❌   | docs/review.md |
| 7    | Verify                | ✅/⏳/❌   | docs/verification-report.md |
| 8    | Create Pull Request   | ✅/⏳/❌   | GitHub PR |

Next step: <N — Step Name>
```

Do not launch any agents — this is a read-only status check.
