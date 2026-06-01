---
name: Capstone Project Recurring Issues
description: Recurring test failures, code patterns, and quality patterns observed across verification runs
type: project
---

## Pre-existing Orphaned Tests (High Priority Technical Debt)

Three test files fail in every `npm test` run in `client/` because their source files do not exist:
- `CheckInPage.test.tsx` needs `src/pages/CheckInPage.tsx`
- `SettingsPage.test.tsx` needs `src/pages/SettingsPage.tsx`  
- `ExportControls.test.tsx` needs `src/components/ExportControls.tsx`

These were committed in the initial commit (1d3d2fd) as forward-authored tests. They cause `Test Files 3 failed` in every run and 3 TypeScript errors in every `tsc --noEmit` run. This is not a KAN-3 issue.

## Known Code Quality Issues in GroceryListPage.tsx

- `localStorage.setItem(STORAGE_KEY, ...)` on line 28 has NO try/catch — violates NFR-06 (confirmed by review.md). Medium severity.
- `STORAGE_KEY = 'grocery-list'` does not follow the `wbt_` prefix convention (BR-05). Low severity, out of scope for KAN-3.
- `loadBoughtIds` catch block in groceryStorage.ts silently discards errors without `console.error` — violates NFR-06 spirit. Low severity.

## Docs Conventions

All docs/ files use: H1 title, H2 section headings, no H3 skipping, tables with header rows. review.md is the most polished document. design-review.md uses nested annotation comments (`<!-- Updated by design-reviewer -->`).

## Vite Plugin Deprecation Warning

`vite:react-babel` plugin emits `esbuild` deprecation warning on every test run. Not a security issue; causes noise in CI logs. Low priority.
