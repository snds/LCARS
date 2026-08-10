# LCARS Curve Figma Plugin — Design

**Date:** 2026-08-09  
**Status:** Approved for planning  
**Approach:** Profile-stop driver (manual sync), with seam for future live sync

## Problem

LCARS elbows are typically an orthogonal polyline: horizontal and vertical runs joined by fully round 90° corners. Arms often need **different constant thicknesses**, with an independently tunable corner radius (large sweep without thickening the bar).

Figma’s native variable-width stroke profiles thickness along **path length**. That allows mid-run drift on a straight arm and does not give axis-locked “this entire horizontal run is W₁, this entire vertical run is W₂” control.

## Goals

- Author stroked LCARS curves with **per-segment width** and **per-corner editable radius**.
- Keep a **single stroked vector path** (not a filled bake) so native Figma stroke caps/paint remain usable.
- Persist plugin truth by **node id** (`pluginData`) so native edits can be corrected via **Reapply**.
- Support **Create from form** and **Bind existing path**.
- Enforce **H/V-only** geometry (snap or reject diagonals).
- Structure code so **live sync** can land later without rewriting the apply path.

## Non-goals (v1)

- Live `documentchange` auto-reapply
- Diagonal or freeform curves
- Filled-path export / bake-out
- Owning stroke caps, fills, or color tokens (Figma owns caps; Create defaults to butt)
- Community publish, or a monorepo merge with `lcars-generative-interface`
- Shared npm package extraction (geom stays copyable / extractable; not published in v1)

## Architecture

Standalone Figma plugin repository with four layers:

| Layer | Responsibility |
|---|---|
| **Logical model** (`LcarsCurve`) | Segments, widths, corner radii, start pose. Source of truth in `pluginData`. |
| **Geometry compiler** | Pure TS: model → centerline path + variable-width stop list. No Figma API. |
| **Apply / Rehydrate** | Write path + profile to the vector node; load model into UI; detect drift. |
| **SyncController** | v1: `manual` only. Same `onNodeMayHaveDrifted(nodeId)` entry used later by `live`. |

```
[Plugin UI]
    │  edit model
    ▼
[LcarsCurve in pluginData]
    │  compile
    ▼
[curve-geom] ──► centerline + width stops
    │  apply
    ▼
[Figma VectorNode stroke]
    │  selection / future live
    ▼
[SyncController] ──► Reapply if drifted
```

Caps: Figma-native. Create sets `strokeCap = BUTT`. Bind leaves the existing cap.

## Data model

Stored under a single `pluginData` key (e.g. `lcars-curve`):

```ts
type Axis = 'H' | 'V';
type Sign = 1 | -1;

interface LcarsCurve {
  version: 1;
  start: { x: number; y: number };
  initialAxis: Axis;
  initialSign: Sign;
  segments: Array<{
    length: number; // > 0
    width: number;  // constant thickness for this run
  }>;
  corners: Array<{
    radius: number; // editable; length === segments.length - 1
    turn: 1 | -1;   // +1 = left / CCW relative to travel; -1 = right / CW
  }>;
  /** Hash of last-applied centerline + stops; used for drift detection */
  appliedFingerprint?: string;
}
```

### Invariants

- Segments alternate axis from `initialAxis` (H→V→H…).
- `corners.length === segments.length - 1` (zero corners if a single segment).
- Each corner’s `turn` selects the 90° direction so S-curves and U-bends are both representable.
- Segment `length` is always positive; direction of travel comes from `initialSign` plus accumulated corner turns.
- Diagonals are illegal; Bind snaps within tolerance or rejects.
- Width profile stops are **derived** on Apply, never stored as source of truth.
- Caps are omitted from the model (Figma `strokeCap`).

### Feasibility

If a corner radius exceeds what adjacent segment lengths allow, Apply **clamps** to the maximum feasible radius and shows a panel warning.

## Geometry compiler

### Centerline

1. Begin at `start`, facing `initialAxis` × `initialSign`.
2. For each segment, emit a straight run of `length` along the current axis/sign.
3. At each corner, emit a circular arc of the stored `radius` turning 90° per `turn` (+1 CCW / -1 CW), then update travel axis and sign for the next segment.
4. Prefer true arc segments in the vector network when available; otherwise approximate with a high-fidelity cubic subdivision.

### Width profile

- Each straight run: **constant** width for its entire path-length span.
- Each corner arc: width **interpolates only across the arc** from previous segment width → next segment width.
- No mid-run width change on straights.
- Stop list fully regenerated on every Apply.

## UI and flows

### Create (no managed selection)

- Form: start (default viewport center), initial direction, segment list (add/remove), width per segment, radius + turn per corner.
- **Create** → new vector path, butt cap, `pluginData` written, Apply once.

### Bind (unmanaged vector path selected)

- Parse path → orthogonalize (snap) or error on true diagonals.
- Infer segment lengths and corner turns; seed widths from current stroke (or default); seed corner radii from existing arcs or default.
- **Bind** → attach `pluginData`, Apply immediately so profile matches model.

### Edit (managed curve selected)

- Load model from `pluginData`.
- Edit → **Apply** recompiles path + stops + fingerprint.
- If live node ≠ fingerprint → show **Reapply**.
- **Unbind** removes `pluginData` only; path left as-is.

### SyncController (seam for Approach 3)

```ts
interface SyncController {
  mode: 'manual' | 'live';
  onSelectionChanged(nodes: readonly SceneNode[]): void;
  onNodeMayHaveDrifted(nodeId: string): void;
}
```

v1 implements `manual`: selection updates the panel and may surface Reapply; no document listeners. Future `live` calls the same Apply path from `onNodeMayHaveDrifted`.

## Repo layout (standalone)

```
lcars-curve-figma/           # new repo (name TBD)
  manifest.json
  src/
    ui/                      # plugin panel
    sandbox/                 # Figma main thread
    sync/                    # SyncController + manual impl
  packages/curve-geom/       # pure model + compiler + parse/snap
    src/
    tests/
```

v1 tests cover `curve-geom` only (compile, clamp, H/V parse/snap, fingerprint inputs). No required Figma runtime for CI.

## Success criteria

1. Multi-bend orthogonal elbow can hold different flat widths per arm with independent corner radii.
2. After native stroke/path fiddling, **Reapply** restores plugin-derived path + profile from `pluginData`.
3. Create and Bind both produce managed nodes.
4. Geom unit tests pass without Figma.

## Future work

- `SyncController` `live` mode (document change → auto Reapply).
- Extract `curve-geom` for reuse in `lcars-generative-interface` elbow renderers.
- Optional “Reset model from node” (inverse of Reapply).
- Pill end helpers as presets that set Figma caps (still not owned in the logical model).

## Decisions log

| Decision | Choice |
|---|---|
| Output | Stroked path + `pluginData` by node id |
| Thickness model | Per-segment widths + editable per-corner radius + per-corner turn |
| Authoring | Create from form **and** Bind existing path |
| Orthogonality | H/V only; snap or reject diagonals |
| Caps | Figma-owned; Create defaults to butt |
| Repo | Standalone plugin; shared geom package later |
| Sync | Manual Apply/Reapply; interface ready for live |
| Apply mechanism | Rebuild centerline + Figma variable-width stops at boundaries |
