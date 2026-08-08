# LCARS Generative Interface

Vite/React application for the LCARS generative console: voice/typed intent and combadge role become a validated Scene IR and deterministic Okudagram surface.

## Design authority

Implementation follows the workspace specification:

**`07-projects/20-lcars-generative-interface/SPEC.md`**

(path relative to Sean's workspace checkout at `~/Projects/Workspace`)

The workspace vault holds design authority, session state, and plans. Application source lives in this repo only.

## Commands

```bash
npm install
npm run dev      # local dev server
npm test         # Vitest (single run)
npm run test:watch
npm run build    # tsc + Vite production build
npm run preview  # preview production build
```

## Requirements

- Node ≥ 20
- npm

## Plan

Implementation plan (mirrored from workspace):

`docs/superpowers/plans/2026-08-07-lcars-generative-interface-v1.md`
