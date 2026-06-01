---
name: push branch before creating PR
description: Always push the feature branch to origin before calling GitHub MCP create_pull_request, or it will fail with "No commits between main and feature-expiry"
type: feedback
---

Always push the feature branch to the remote before calling `mcp__github__create_pull_request`. The GitHub API will return a 422 "No commits between base and head" error if the branch has not been pushed yet, even if the local branch has commits ahead of main.

**Why:** On the first PR for this repo (KAN-3), `feature-expiry` was 2 commits ahead of `origin/main` locally but had never been pushed. The MCP call failed. After running `git push origin feature-expiry`, the PR was created successfully.

**How to apply:** In STEP 1 (Gather Context), always check `git branch -vv` for "ahead N" status with no tracking remote, or "ahead N" on a branch that has never been pushed. If the branch is not on the remote, push it before calling the MCP tool.
