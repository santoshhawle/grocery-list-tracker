---
name: Client Technology Stack
description: Confirmed technology stack for the Remote Wellbeing Tracker client (React SPA)
type: project
---

Client stack confirmed from package.json and source inspection (2026-06-01):

- React 18 + TypeScript
- Vite 5 (dev server + build)
- Tailwind CSS 3 (utility-first styling)
- React Router 6 (SPA routing; active route for grocery: /grocery)
- Lucide React (icon set)
- Recharts (charts, used in wellbeing features)
- Vitest 4 + @testing-library/react + jsdom (test stack)
- localStorage (client-side persistence; wbt_* key prefix convention)

No global state manager (Redux, Zustand, etc.) — local useState + Context only.

**How to apply:** Recommend only these technologies for client features. Do not suggest adding new dependencies unless a requirement cannot be met without them.
