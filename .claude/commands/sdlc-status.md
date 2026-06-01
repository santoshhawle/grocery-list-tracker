Show the current SDLC pipeline status for ticket $ARGUMENTS without launching any agents.

The story ID is derived from "$ARGUMENTS" (e.g., "KAN-7"). All pipeline artifacts live under `docs/<story-id>/`.

If no ticket ID is provided in "$ARGUMENTS", infer the story ID from the current git branch name (e.g., branch `feature/KAN-7-foo` → story ID `KAN-7`). If it cannot be inferred, ask the user.

Check which pipeline artifacts exist under `docs/<story-id>/` and report the full pipeline status table:

- `docs/<story-id>/requirements.md` → Step 1 complete
- `docs/<story-id>/architecture.md` → Step 2 complete
- `docs/<story-id>/design-review.md` → Step 3 complete
- `docs/<story-id>/impl-plan.md` → Step 4 complete
- Code changes committed (git log) → Step 5 complete
- `docs/<story-id>/review.md` → Step 6 complete
- `docs/<story-id>/verification-report.md` → Step 7 complete
- Open PR on GitHub → Step 8 complete

Output the status using this exact format:

```
## SDLC Pipeline Status — <story-id>
Date: [today's date]

| Step | Name                  | Status      | Output |
|------|-----------------------|-------------|--------|
| 1    | Capture Requirements  | [status]    | docs/<story-id>/requirements.md |
| 2    | Design Architecture   | [status]    | docs/<story-id>/architecture.md |
| 3    | Review Design         | [status]    | docs/<story-id>/design-review.md |
| 4    | Plan Implementation   | [status]    | docs/<story-id>/impl-plan.md |
| 5    | Implement Code        | [status]    | — |
| 6    | Review Code           | [status]    | docs/<story-id>/review.md |
| 7    | Verify                | [status]    | docs/<story-id>/verification-report.md |
| 8    | Create Pull Request   | [status]    | — |

**Current Step:** [N] — [Step Name]
**Blocked By:** [gate or dependency, if any]
```

Status legend: ✅ Complete | 🔄 In Progress | ⏳ Pending | ❌ Blocked

Do NOT launch any agents. This is a read-only status check.
