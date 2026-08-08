# LCARS Generative Interface

Vite/React application for the LCARS generative console: voice/typed intent and combadge role become a validated Scene IR and deterministic Okudagram surface.

**Source:** https://github.com/snds/LCARS

## Design authority

Implementation follows the workspace specification:

**`07-projects/20-lcars-generative-interface/SPEC.md`**

(path relative to Sean's workspace checkout at `~/Projects/Workspace`)

The workspace vault holds design authority, session state, and plans. Application source lives in this repo only.

## Quickstart demo

```bash
npm install
npm run dev
```

Open the local URL (default http://localhost:5173), then:

1. Pick a **Combadge role** (physicist, engineer, physician, operations, security, executive) from the chrome bar.
2. Type an intent in the query aperture and submit (Enter):
   - `summarize subspace theories` — research modules, role-biased layout (no chat log)
   - `why do these diverge` — dialogue module appears when analysis needs it
   - `show eps grid schematic` — engineering recipe with viewport3d + readout siblings
3. Switch roles and repeat the same query to compare density and module bias.
4. Use **VOICE** for browser speech input (degrades gracefully when unsupported).
5. Toggle OS **reduce motion** to confirm instant recompose without pulse animation.

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
