---
name: KAN-3 Test Suite State
description: Test results, known failures, and orphaned test status for the capstone project client/ suite
type: project
---

Three test files in `client/` fail with "Cannot find module" — these are orphaned tests committed in the initial commit (1d3d2fd) but their source files were never created. These failures are pre-existing and are NOT regressions from KAN-3:

- `client/src/pages/__tests__/CheckInPage.test.tsx` — imports `../CheckInPage` which does not exist
- `client/src/pages/__tests__/SettingsPage.test.tsx` — imports `../SettingsPage` which does not exist
- `client/src/components/__tests__/ExportControls.test.tsx` — imports `../ExportControls` which does not exist

**Why:** These three test files were committed as part of the first commit (1d3d2fd) as forward-authored tests for planned features that were never implemented.

**How to apply:** When running `npm test` in client/, always expect these 3 file-level failures; they do not indicate a KAN-3 regression. The 101 passing tests are the meaningful signal.

As of 2026-06-01, KAN-3 feature test counts:
- groceryStorage.test.ts: 11 tests (all pass)
- GroceryItemRow.test.tsx: 14 tests (all pass)
- GroceryListPage.test.tsx: 16 tests (all pass)
- Total passing across full suite: 101 tests

TypeScript: 3 errors, all from the orphaned test files (same root cause as above). All production source files compile clean.
