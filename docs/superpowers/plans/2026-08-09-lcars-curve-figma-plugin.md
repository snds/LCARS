# LCARS Curve Figma Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a standalone Figma plugin that authors orthogonal LCARS strokes with per-segment constant width, per-corner editable radius/turn, `pluginData` persistence, and manual Apply/Reapply (with a SyncController seam for future live sync).

**Architecture:** Pure `curve-geom` package owns the `LcarsCurve` model, centerline compiler, width-stop derivation, clamp rules, path parse/snap, and fingerprints. The Figma sandbox applies compiled output to a non-branching `VectorNode` via `vectorPaths` + `variableWidthStrokeProperties`. The UI drives Create / Bind / Edit; `SyncController` is `manual` in v1.

**Tech Stack:** TypeScript, Vite + `@figma/plugin-typings`, Vitest (geom only), Figma Plugin API (`variableWidthStrokeProperties` CUSTOM profile).

**Spec:** `docs/superpowers/specs/2026-08-09-lcars-curve-figma-plugin-design.md` (in `lcars-generative-interface`; copy or link from the new repo README).

## Global Constraints

- Output is a **stroked** non-branching vector path (never filled bake-out in v1).
- Segments are **H/V only**; diagonals snap within tolerance or reject.
- Width profile stops are **derived**; never source of truth.
- Figma `variableWidthPoints[].width` is a **fraction of `strokeWeight`** — set `strokeWeight = max(segment.widths)` and normalize each absolute width as `w / strokeWeight`.
- Caps are Figma-owned; Create sets `strokeCap = 'BUTT'`; Bind leaves existing cap.
- `pluginData` key: `lcars-curve`.
- No live document listeners in v1; SyncController mode is `manual`.
- Geom unit tests must pass without Figma running.
- New standalone repo at `/Users/snds/Projects/lcars-curve-figma` (sibling of this app). Do not merge into `lcars-generative-interface` in v1.

---

## File structure (new repo)

```
/Users/snds/Projects/lcars-curve-figma/
  package.json                 # workspaces: packages/*, src build
  tsconfig.base.json
  vitest.config.ts
  manifest.json                # Figma plugin manifest
  README.md
  packages/curve-geom/
    package.json
    src/
      types.ts                 # LcarsCurve + compile result types
      compile.ts               # centerline + width stops + clamp
      fingerprint.ts           # stable hash of apply payload
      parse.ts                 # SVG/path points → LcarsCurve (snap/reject)
      index.ts
    tests/
      compile.test.ts
      fingerprint.test.ts
      parse.test.ts
  src/
    sandbox/
      main.ts                  # Figma main thread entry
      apply.ts                 # write path + profile + pluginData
      pluginData.ts            # get/set/clear LcarsCurve
      messages.ts              # UI ↔ sandbox message types
    sync/
      types.ts                 # SyncController interface
      manual.ts                # manual implementation
    ui/
      index.html
      main.ts                  # panel bootstrap
      App.ts                   # Create / Bind / Edit panel logic
      styles.css
  vite.config.ts               # dual build: ui + sandbox
```

---

### Task 1: Scaffold standalone repo and `curve-geom` types

**Files:**
- Create: `/Users/snds/Projects/lcars-curve-figma/package.json`
- Create: `/Users/snds/Projects/lcars-curve-figma/tsconfig.base.json`
- Create: `/Users/snds/Projects/lcars-curve-figma/vitest.config.ts`
- Create: `/Users/snds/Projects/lcars-curve-figma/packages/curve-geom/package.json`
- Create: `/Users/snds/Projects/lcars-curve-figma/packages/curve-geom/src/types.ts`
- Create: `/Users/snds/Projects/lcars-curve-figma/packages/curve-geom/src/index.ts`
- Create: `/Users/snds/Projects/lcars-curve-figma/README.md`
- Create: `/Users/snds/Projects/lcars-curve-figma/.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: `Axis`, `Sign`, `LcarsCurve`, `CompiledCurve`, `WidthStop`, `PLUGIN_DATA_KEY`

- [ ] **Step 1: Create the repo directory and init git**

```bash
mkdir -p /Users/snds/Projects/lcars-curve-figma
cd /Users/snds/Projects/lcars-curve-figma
git init
```

- [ ] **Step 2: Write root package.json and configs**

`package.json`:

```json
{
  "name": "lcars-curve-figma",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "workspaces": ["packages/*"],
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "build": "vite build",
    "dev": "vite build --watch"
  },
  "devDependencies": {
    "@figma/plugin-typings": "^1.109.0",
    "typescript": "~5.9.3",
    "vite": "^6.4.1",
    "vite-plugin-singlefile": "^2.1.0",
    "vitest": "^4.1.8"
  }
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/tests/**/*.test.ts'],
  },
});
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["@figma/plugin-typings"]
  }
}
```

`.gitignore`:

```
node_modules
dist
.DS_Store
*.local
```

- [ ] **Step 3: Write `packages/curve-geom` types**

`packages/curve-geom/package.json`:

```json
{
  "name": "@lcars/curve-geom",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" }
}
```

`packages/curve-geom/src/types.ts`:

```ts
export type Axis = 'H' | 'V';
export type Sign = 1 | -1;

export interface LcarsCurve {
  version: 1;
  start: { x: number; y: number };
  initialAxis: Axis;
  initialSign: Sign;
  segments: Array<{ length: number; width: number }>;
  corners: Array<{ radius: number; turn: Sign }>;
  appliedFingerprint?: string;
}

/** Absolute width at normalized path position [0,1]. */
export interface WidthStop {
  position: number;
  widthPx: number;
}

export interface CompiledCurve {
  /** SVG path `d` for a single open subpath (M/L/A or cubic approx). */
  pathData: string;
  /** Absolute widths; apply layer normalizes to Figma fractions. */
  stops: WidthStop[];
  /** Max absolute width — use as Figma strokeWeight. */
  strokeWeight: number;
  /** Radii after feasibility clamp (same length as model.corners). */
  clampedCorners: Array<{ radius: number; turn: Sign; clamped: boolean }>;
  totalLength: number;
}

export const PLUGIN_DATA_KEY = 'lcars-curve';

export const DEFAULT_STROKE_WIDTH = 24;
export const DEFAULT_CORNER_RADIUS = 40;
export const SNAP_TOLERANCE_PX = 0.5;
```

`packages/curve-geom/src/index.ts`:

```ts
export * from './types.js';
```

`README.md`: short description + link to the design spec path in the generative-interface repo + “Import plugin from manifest.json in Figma → Plugins → Development”.

- [ ] **Step 4: Install deps**

```bash
cd /Users/snds/Projects/lcars-curve-figma && npm install
```

Expected: lockfile created, no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold lcars-curve-figma repo and curve-geom types"
```

---

### Task 2: Compile centerline (straights + 90° arcs) with radius clamp

**Files:**
- Create: `packages/curve-geom/src/compile.ts`
- Create: `packages/curve-geom/tests/compile.test.ts`
- Modify: `packages/curve-geom/src/index.ts`

**Interfaces:**
- Consumes: `LcarsCurve` from `types.ts`
- Produces: `compileLcarsCurve(model: LcarsCurve): CompiledCurve`, `clampCornerRadii(model: LcarsCurve): …`

- [ ] **Step 1: Write failing tests for a single elbow**

```ts
// packages/curve-geom/tests/compile.test.ts
import { describe, expect, it } from 'vitest';
import { compileLcarsCurve } from '../src/compile.js';
import type { LcarsCurve } from '../src/types.js';

const elbow: LcarsCurve = {
  version: 1,
  start: { x: 0, y: 0 },
  initialAxis: 'H',
  initialSign: 1,
  segments: [
    { length: 100, width: 40 },
    { length: 80, width: 20 },
  ],
  corners: [{ radius: 30, turn: 1 }],
};

describe('compileLcarsCurve', () => {
  it('emits path starting at start and ending after H then V', () => {
    const c = compileLcarsCurve(elbow);
    expect(c.pathData.startsWith('M 0 0')).toBe(true);
    expect(c.strokeWeight).toBe(40);
    expect(c.clampedCorners[0]?.clamped).toBe(false);
    expect(c.clampedCorners[0]?.radius).toBe(30);
    // After H(100-30) + quarter arc R30 + V(80-30): end ≈ (100, 80)
    expect(c.pathData).toMatch(/100/);
    expect(c.pathData).toMatch(/80/);
  });

  it('clamps radius that exceeds adjacent straight budgets', () => {
    const tooBig: LcarsCurve = {
      ...elbow,
      corners: [{ radius: 90, turn: 1 }],
    };
    const c = compileLcarsCurve(tooBig);
    // each segment can spare at most length (full length reserved for arc tangents)
    expect(c.clampedCorners[0]?.clamped).toBe(true);
    expect(c.clampedCorners[0]?.radius).toBeLessThanOrEqual(80);
    expect(c.clampedCorners[0]?.radius).toBeLessThanOrEqual(100);
  });

  it('keeps width constant on straights and transitions only on corner', () => {
    const c = compileLcarsCurve(elbow);
    // first stop and stop at corner entry = 40; corner exit and end = 20
    const widths = c.stops.map((s) => s.widthPx);
    expect(widths[0]).toBe(40);
    expect(widths[widths.length - 1]).toBe(20);
    // positions strictly increasing in [0,1]
    for (let i = 1; i < c.stops.length; i++) {
      expect(c.stops[i]!.position).toBeGreaterThan(c.stops[i - 1]!.position);
    }
    expect(c.stops[0]!.position).toBe(0);
    expect(c.stops[c.stops.length - 1]!.position).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/snds/Projects/lcars-curve-figma && npm test -- packages/curve-geom/tests/compile.test.ts
```

Expected: FAIL (module not found / `compileLcarsCurve` undefined).

- [ ] **Step 3: Implement compile + clamp**

Implement `packages/curve-geom/src/compile.ts` with this behavior:

1. Validate `corners.length === segments.length - 1` and all lengths/widths/radii `> 0` (throw `Error` with clear message otherwise).
2. For each corner `i`, max radius = `min(segments[i].length, segments[i+1].length)` (tangent budget: each side consumes `radius` of straight length). Clamp and mark `clamped`.
3. Walk pose `(x,y,axis,sign)`:
   - Straight contribution for segment `i` = `length - rIn - rOut` where `rIn` is previous corner radius (0 for first) and `rOut` is next corner radius (0 for last).
   - Emit `L` for each positive straight.
   - At corner: emit SVG arc `A r r 0 0 sweep x y` where `sweep = turn === 1 ? 1 : 0` for CCW/CW in SVG (Y-down: verify in tests; if Figma Y-down flips visual turn, invert sweep mapping and lock with a golden path string in the test).
   - Update axis: `H↔V`; update sign from turn (CCW from +H → −V in Y-down screen space — encode explicitly in a small `nextPose(axis, sign, turn)` helper and unit-test that helper if needed).
4. Accumulate path length (straight lengths + `π/2 * r` per corner) for stop positions.
5. Build stops:
   - position 0 → width₀
   - at corner entry (after straight₀) → width₀
   - at corner exit → width₁
   - … repeat …
   - position 1 → width_last
6. `strokeWeight = max(widths)`.

Export from `index.ts`.

Reference implementation for `nextPose` (Y-down, turn +1 = left relative to travel):

```ts
export function nextPose(
  axis: Axis,
  sign: Sign,
  turn: Sign,
): { axis: Axis; sign: Sign } {
  // Encode heading as unit vector, rotate 90° by turn, decode.
  const hx = axis === 'H' ? sign : 0;
  const hy = axis === 'V' ? sign : 0;
  // left (+1): (x,y) → (−y, x); right (−1): (x,y) → (y, −x) in Y-down screen space
  const nx = turn === 1 ? -hy : hy;
  const ny = turn === 1 ? hx : -hx;
  if (nx !== 0) return { axis: 'H', sign: nx < 0 ? -1 : 1 };
  return { axis: 'V', sign: ny < 0 ? -1 : 1 };
}
```

Prefer SVG `A` in `pathData`. If a test environment struggles with arc parsing later, keep `A` for Figma apply and only use cubics if Figma rejects them (document in apply task).

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/snds/Projects/lcars-curve-figma && npm test -- packages/curve-geom/tests/compile.test.ts
```

Expected: PASS. If sweep direction is wrong, fix `nextPose` / SVG sweep and add an assertion on the exact `pathData` string for the fixture elbow.

- [ ] **Step 5: Commit**

```bash
git add packages/curve-geom
git commit -m "feat(curve-geom): compile orthogonal centerline and width stops"
```

---

### Task 3: Fingerprint applied payload

**Files:**
- Create: `packages/curve-geom/src/fingerprint.ts`
- Create: `packages/curve-geom/tests/fingerprint.test.ts`
- Modify: `packages/curve-geom/src/index.ts`

**Interfaces:**
- Consumes: `CompiledCurve`
- Produces: `fingerprintCompiled(compiled: CompiledCurve): string`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from 'vitest';
import { compileLcarsCurve } from '../src/compile.js';
import { fingerprintCompiled } from '../src/fingerprint.js';
import type { LcarsCurve } from '../src/types.js';

const model: LcarsCurve = {
  version: 1,
  start: { x: 0, y: 0 },
  initialAxis: 'H',
  initialSign: 1,
  segments: [
    { length: 100, width: 40 },
    { length: 80, width: 20 },
  ],
  corners: [{ radius: 30, turn: 1 }],
};

describe('fingerprintCompiled', () => {
  it('is stable for the same compile output', () => {
    const a = fingerprintCompiled(compileLcarsCurve(model));
    const b = fingerprintCompiled(compileLcarsCurve(model));
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(8);
  });

  it('changes when width changes', () => {
    const a = fingerprintCompiled(compileLcarsCurve(model));
    const b = fingerprintCompiled(
      compileLcarsCurve({
        ...model,
        segments: [
          { length: 100, width: 40 },
          { length: 80, width: 10 },
        ],
      }),
    );
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- packages/curve-geom/tests/fingerprint.test.ts
```

- [ ] **Step 3: Implement**

```ts
// packages/curve-geom/src/fingerprint.ts
import type { CompiledCurve } from './types.js';

/** FNV-1a 32-bit hex over canonical JSON of path + stops + strokeWeight. */
export function fingerprintCompiled(compiled: CompiledCurve): string {
  const payload = JSON.stringify({
    pathData: compiled.pathData,
    strokeWeight: compiled.strokeWeight,
    stops: compiled.stops.map((s) => [
      round(s.position, 6),
      round(s.widthPx, 4),
    ]),
  });
  let h = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function round(n: number, places: number): number {
  const m = 10 ** places;
  return Math.round(n * m) / m;
}
```

Export from `index.ts`.

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- packages/curve-geom/tests/fingerprint.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add packages/curve-geom
git commit -m "feat(curve-geom): fingerprint compiled path and stops"
```

---

### Task 4: Parse / snap vector path points into `LcarsCurve`

**Files:**
- Create: `packages/curve-geom/src/parse.ts`
- Create: `packages/curve-geom/tests/parse.test.ts`
- Modify: `packages/curve-geom/src/index.ts`

**Interfaces:**
- Consumes: `LcarsCurve`, `SNAP_TOLERANCE_PX`, `DEFAULT_*`
- Produces:
  - `parseOrthogonalPolyline(points: Array<{x:number;y:number}>, opts?: ParseOptions): LcarsCurve`
  - `ParseOptions = { defaultWidth?: number; defaultRadius?: number; snapTolerance?: number }`
  - Throws `Error('diagonal')` when a run cannot snap to H or V

**Note:** Bind in the sandbox will flatten Figma `vectorNetwork` / path vertices into an open polyline of points (corner = vertex). Arc radii may be lost on flatten; seed `DEFAULT_CORNER_RADIUS` and `turn` inferred from the 90° direction between consecutive runs.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { parseOrthogonalPolyline } from '../src/parse.js';

describe('parseOrthogonalPolyline', () => {
  it('parses an L polyline into two segments and one corner', () => {
    const model = parseOrthogonalPolyline(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 80 },
      ],
      { defaultWidth: 24, defaultRadius: 20 },
    );
    expect(model.initialAxis).toBe('H');
    expect(model.initialSign).toBe(1);
    expect(model.segments).toEqual([
      { length: 100, width: 24 },
      { length: 80, width: 24 },
    ]);
    expect(model.corners).toHaveLength(1);
    expect(model.corners[0]?.turn).toBe(1); // down after +H = left in Y-down
    expect(model.corners[0]?.radius).toBe(20);
  });

  it('snaps near-orthogonal points within tolerance', () => {
    const model = parseOrthogonalPolyline([
      { x: 0, y: 0 },
      { x: 100, y: 0.2 }, // within 0.5
      { x: 100.1, y: 50 },
    ]);
    expect(model.segments[0]?.length).toBeGreaterThan(99);
    expect(model.initialAxis).toBe('H');
  });

  it('rejects true diagonals', () => {
    expect(() =>
      parseOrthogonalPolyline([
        { x: 0, y: 0 },
        { x: 50, y: 50 },
      ]),
    ).toThrow(/diagonal/i);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- packages/curve-geom/tests/parse.test.ts
```

- [ ] **Step 3: Implement `parse.ts`**

Algorithm:

1. Require `points.length >= 2`.
2. For each consecutive pair, classify as H if `|dy| <= tol` and `|dx| > tol`; V if `|dx| <= tol` and `|dy| > tol`; else throw diagonal.
3. Merge consecutive runs on the same axis/sign into one segment length.
4. `initialAxis` / `initialSign` from first run.
5. For each corner between runs, `turn` from cross product of incoming and outgoing unit directions (sign of `ix*oy - iy*ox` in Y-down; map to `Sign` consistently with `nextPose`).
6. Seed all widths with `defaultWidth ?? DEFAULT_STROKE_WIDTH`; radii with `defaultRadius ?? DEFAULT_CORNER_RADIUS`.
7. Return `LcarsCurve` without `appliedFingerprint`.

- [ ] **Step 4: Run — expect PASS**

```bash
npm test -- packages/curve-geom/tests/parse.test.ts
```

Also run full suite:

```bash
npm test
```

Expected: all geom tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/curve-geom
git commit -m "feat(curve-geom): parse and snap orthogonal polylines"
```

---

### Task 5: SyncController seam (manual)

**Files:**
- Create: `src/sync/types.ts`
- Create: `src/sync/manual.ts`
- Create: `packages/curve-geom/tests/sync-manual.test.ts` (logic-only drift helper) **or** keep sync untested until sandbox — prefer a tiny pure helper:

Actually keep SyncController in plugin `src/sync` and test a pure drift predicate in curve-geom:

- Create: `packages/curve-geom/src/drift.ts`
- Create: `packages/curve-geom/tests/drift.test.ts`

**Interfaces:**
- Consumes: `fingerprintCompiled`, `LcarsCurve`
- Produces:
  - `needsReapply(model: LcarsCurve, liveFingerprint: string | null): boolean`
  - `SyncController` interface + `createManualSyncController(...)`

- [ ] **Step 1: Write failing drift test**

```ts
import { describe, expect, it } from 'vitest';
import { needsReapply } from '../src/drift.js';

describe('needsReapply', () => {
  it('is false when fingerprints match', () => {
    expect(needsReapply({ appliedFingerprint: 'abc' } as any, 'abc')).toBe(false);
  });
  it('is true when missing or mismatched', () => {
    expect(needsReapply({} as any, 'abc')).toBe(true);
    expect(needsReapply({ appliedFingerprint: 'abc' } as any, 'zzz')).toBe(true);
    expect(needsReapply({ appliedFingerprint: 'abc' } as any, null)).toBe(true);
  });
});
```

- [ ] **Step 2: Run — FAIL; implement; PASS; commit geom drift helper**

```ts
export function needsReapply(
  model: { appliedFingerprint?: string },
  liveFingerprint: string | null,
): boolean {
  if (!liveFingerprint) return true;
  return model.appliedFingerprint !== liveFingerprint;
}
```

```bash
git add packages/curve-geom
git commit -m "feat(curve-geom): drift predicate for reapply UI"
```

- [ ] **Step 3: Add SyncController types + manual impl (no Figma calls yet)**

`src/sync/types.ts`:

```ts
export type SyncMode = 'manual' | 'live';

export interface SyncController {
  readonly mode: SyncMode;
  onSelectionChanged(nodeIds: readonly string[]): void;
  onNodeMayHaveDrifted(nodeId: string): void;
}

export type SyncHandlers = {
  loadSelection: (nodeIds: readonly string[]) => void;
  reapply: (nodeId: string) => void;
};
```

`src/sync/manual.ts`:

```ts
import type { SyncController, SyncHandlers } from './types.js';

export function createManualSyncController(handlers: SyncHandlers): SyncController {
  return {
    mode: 'manual',
    onSelectionChanged(nodeIds) {
      handlers.loadSelection(nodeIds);
    },
    onNodeMayHaveDrifted(nodeId) {
      // v1: do not auto-reapply; UI surfaces Reapply via loadSelection drift flag.
      // Future live mode will call handlers.reapply(nodeId) here.
      void nodeId;
      void handlers;
    },
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/sync
git commit -m "feat(sync): add SyncController seam with manual implementation"
```

---

### Task 6: Sandbox pluginData + Apply to Figma vector node

**Files:**
- Create: `src/sandbox/pluginData.ts`
- Create: `src/sandbox/apply.ts`
- Create: `src/sandbox/messages.ts`
- Create: `src/sandbox/main.ts`
- Create: `manifest.json`
- Create: `vite.config.ts`
- Create: `src/ui/index.html` (minimal stub enough to load plugin)
- Create: `src/ui/main.ts` (stub postMessage)
- Create: `tsconfig.json`

**Interfaces:**
- Consumes: `compileLcarsCurve`, `fingerprintCompiled`, `PLUGIN_DATA_KEY`, `LcarsCurve`, `CompiledCurve`
- Produces:
  - `readCurve(node): LcarsCurve | null`
  - `writeCurve(node, model): void`
  - `clearCurve(node): void`
  - `applyCurveToNode(node: VectorNode, model: LcarsCurve): { model: LcarsCurve; warnings: string[] }`
  - `liveFingerprintFromNode(node: VectorNode): string | null` (re-fingerprint from current path + variableWidthStrokeProperties)

- [ ] **Step 1: Write message types**

```ts
// src/sandbox/messages.ts
import type { LcarsCurve } from '@lcars/curve-geom';

export type UiToSandbox =
  | { type: 'create'; model: LcarsCurve }
  | { type: 'bind' }
  | { type: 'apply'; model: LcarsCurve }
  | { type: 'reapply' }
  | { type: 'unbind' }
  | { type: 'request-selection' };

export type SandboxToUi =
  | {
      type: 'selection';
      mode: 'empty' | 'bindable' | 'managed';
      model: LcarsCurve | null;
      drifted: boolean;
      warnings: string[];
      error?: string;
    }
  | { type: 'applied'; model: LcarsCurve; warnings: string[] }
  | { type: 'error'; message: string };
```

- [ ] **Step 2: Implement pluginData helpers**

```ts
// src/sandbox/pluginData.ts
import { PLUGIN_DATA_KEY, type LcarsCurve } from '@lcars/curve-geom';

export function readCurve(node: BaseNode): LcarsCurve | null {
  if (!('getPluginData' in node)) return null;
  const raw = node.getPluginData(PLUGIN_DATA_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LcarsCurve;
  } catch {
    return null;
  }
}

export function writeCurve(node: BaseNode, model: LcarsCurve): void {
  node.setPluginData(PLUGIN_DATA_KEY, JSON.stringify(model));
}

export function clearCurve(node: BaseNode): void {
  node.setPluginData(PLUGIN_DATA_KEY, '');
}
```

- [ ] **Step 3: Implement apply**

```ts
// src/sandbox/apply.ts
import {
  compileLcarsCurve,
  fingerprintCompiled,
  type LcarsCurve,
  type WidthStop,
} from '@lcars/curve-geom';
import { writeCurve } from './pluginData.js';

export function applyCurveToNode(
  node: VectorNode,
  model: LcarsCurve,
): { model: LcarsCurve; warnings: string[] } {
  const compiled = compileLcarsCurve(model);
  const warnings = compiled.clampedCorners
    .filter((c) => c.clamped)
    .map((c, i) => `Corner ${i + 1} radius clamped to ${c.radius}`);

  const nextCorners = compiled.clampedCorners.map(({ radius, turn }) => ({
    radius,
    turn,
  }));
  const nextModel: LcarsCurve = {
    ...model,
    corners: nextCorners,
    appliedFingerprint: fingerprintCompiled(compiled),
  };

  node.vectorPaths = [
    {
      windingRule: 'NONE',
      data: compiled.pathData,
    },
  ];
  node.fills = [];
  if (node.strokes.length === 0) {
    node.strokes = [{ type: 'SOLID', color: { r: 0.96, g: 0.64, b: 0.42 } }];
  }
  node.strokeWeight = compiled.strokeWeight;
  node.variableWidthStrokeProperties = {
    widthProfile: 'CUSTOM',
    variableWidthPoints: toFigmaPoints(compiled.stops, compiled.strokeWeight),
  };

  writeCurve(node, nextModel);
  return { model: nextModel, warnings };
}

function toFigmaPoints(stops: WidthStop[], strokeWeight: number) {
  return stops.map((s) => ({
    position: s.position,
    width: strokeWeight === 0 ? 0 : s.widthPx / strokeWeight,
  }));
}
```

Also implement `liveFingerprintFromNode`: read `vectorPaths[0].data`, read CUSTOM points, convert fractions × `strokeWeight` back to `widthPx`, run `fingerprintCompiled` on a synthetic `CompiledCurve` (pathData + stops + strokeWeight). If profile is not CUSTOM, return `null` (treat as drifted).

- [ ] **Step 4: Wire `main.ts` selection + handlers**

- `figma.on('selectionchange')` → resolve selection → post `selection` message (`empty` / `bindable` VECTOR without pluginData / `managed` with pluginData).
- For managed: `drifted = needsReapply(model, liveFingerprintFromNode(node))`.
- Handle `create`: `figma.createVector()`, set `strokeCap = 'BUTT'`, `applyCurveToNode`, select node.
- Handle `bind`: require single VectorNode; extract polyline points from `vectorNetwork.vertices` in index order along the single open path (if branching → error); `parseOrthogonalPolyline`; seed width from `strokeWeight`; `applyCurveToNode` (preserve `strokeCap`).
- Handle `apply` / `reapply` / `unbind`.

Extract polyline helper carefully: if network is branching, post error “variable width requires a non-branching path”.

- [ ] **Step 5: Add manifest + Vite dual build**

`manifest.json`:

```json
{
  "name": "LCARS Curve",
  "id": "lcars-curve-dev",
  "api": "1.0.0",
  "main": "dist/sandbox.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "documentAccess": "dynamic-page",
  "networkAccess": { "allowedDomains": ["none"] }
}
```

Configure Vite to build sandbox IIFE to `dist/sandbox.js` and UI singlefile to `dist/ui.html` (use `vite-plugin-singlefile` for UI). Ensure `@lcars/curve-geom` resolves via workspace.

Stub UI that only shows “LCARS Curve scaffold” and posts `request-selection` on load — enough to import the plugin.

- [ ] **Step 6: Build**

```bash
cd /Users/snds/Projects/lcars-curve-figma && npm run build
```

Expected: `dist/sandbox.js` and `dist/ui.html` exist.

- [ ] **Step 7: Manual smoke in Figma (checklist, not automated)**

1. Plugins → Development → Import plugin from manifest → select this `manifest.json`.
2. Run plugin; panel opens without console errors.
3. (Full Create UI lands in Task 7; for now create via temporary sandbox menu command or console if needed.) If create isn’t UI-wired yet, add a temporary `figma.command` or default create of a hardcoded elbow in `main.ts` behind `figma.on('run')` once for smoke, then remove when Task 7 lands — **prefer wiring Create button in Task 7 immediately after**.

- [ ] **Step 8: Commit**

```bash
git add manifest.json vite.config.ts tsconfig.json src/sandbox src/ui
git commit -m "feat(plugin): apply LcarsCurve to vector stroke via width profile"
```

---

### Task 7: Plugin UI — Create, Bind, Edit, Reapply, Unbind

**Files:**
- Modify: `src/ui/index.html`
- Modify: `src/ui/main.ts`
- Create: `src/ui/App.ts`
- Create: `src/ui/styles.css`
- Modify: `src/sandbox/main.ts` if message gaps appear

**Interfaces:**
- Consumes: `UiToSandbox` / `SandboxToUi`, `LcarsCurve`
- Produces: working panel modes matching the spec flows

- [ ] **Step 1: Build panel structure**

Modes from last `selection` message:

**empty → Create form**
- Start X/Y (defaults 0,0; optional “use viewport center” button posting a sandbox request that fills coords from `figma.viewport.center`)
- Initial axis select (H/V) + sign (+/−)
- Segment list: length, width; Add / Remove (min 1 segment)
- Corner list auto-sized to `segments.length - 1`: radius + turn (+1/−1)
- Button: **Create**

**bindable → Bind panel**
- Short explanation + **Bind** button
- Show parse errors from sandbox if any

**managed → Edit panel**
- Same fields as Create, hydrated from `model`
- **Apply**, **Reapply** (enabled when `drifted`), **Unbind**
- Show `warnings` list (clamped radii)

- [ ] **Step 2: Implement `App.ts` state**

Keep model in UI state; on input change update local model; on Create/Apply send full `LcarsCurve` (without relying on fingerprint from UI — sandbox stamps fingerprint).

Default new model:

```ts
const defaultModel = (): LcarsCurve => ({
  version: 1,
  start: { x: 0, y: 0 },
  initialAxis: 'H',
  initialSign: 1,
  segments: [
    { length: 120, width: 40 },
    { length: 80, width: 24 },
  ],
  corners: [{ radius: 40, turn: 1 }],
});
```

When segment count changes, resize `corners` (add with `DEFAULT_CORNER_RADIUS` / turn `1`; remove extras).

- [ ] **Step 3: Styles**

Compact dark panel, monospace numbers, LCARS-ish orange accent — keep CSS small; no framework.

- [ ] **Step 4: Build + manual acceptance**

```bash
npm run build
```

In Figma Development plugin:

1. Create elbow with Wh≠Wv and R independent → visual constant arms, transition in corner.
2. Add third segment (S or U via turn) → still orthogonal.
3. Edit native width profile → panel shows drifted → Reapply restores.
4. Bind a simple L vector → managed node.
5. Unbind → pluginData cleared; path remains.
6. Diagonal path Bind → error message, no crash.

- [ ] **Step 5: Commit**

```bash
git add src/ui src/sandbox
git commit -m "feat(ui): create, bind, edit, reapply, and unbind flows"
```

---

### Task 8: README polish + geom CI script sanity

**Files:**
- Modify: `README.md`
- Modify: `package.json` if needed

- [ ] **Step 1: Document**

README sections:

1. What it does (axis-locked LCARS strokes)
2. Install (import manifest)
3. Usage (Create / Bind / Edit / Reapply)
4. Dev (`npm i`, `npm test`, `npm run build`, `npm run dev`)
5. Architecture pointer to `packages/curve-geom` and SyncController seam
6. Link to design spec in generative-interface repo

- [ ] **Step 2: Final test + build**

```bash
cd /Users/snds/Projects/lcars-curve-figma && npm test && npm run build
```

Expected: all tests PASS; dist artifacts present.

- [ ] **Step 3: Commit**

```bash
git add README.md package.json
git commit -m "docs: README for LCARS Curve Figma plugin"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|---|---|
| Stroked path + pluginData by node id | 6 |
| Per-segment width + corner radius + turn | 1–2, 7 |
| Create + Bind | 6–7 |
| H/V only snap/reject | 4, 7 |
| Caps Figma-owned; Create butt | 6 |
| Manual SyncController + live seam | 5 |
| Width stops only on straights/corners | 2 |
| Clamp oversized radius + warn | 2, 6–7 |
| Reapply on drift | 3, 5–7 |
| Standalone repo; geom extractable | 1 |
| Geom tests without Figma | 2–5 |
| No live listeners v1 | 5 |

## Self-review notes

- Figma widths are **fractions of strokeWeight** — handled in `toFigmaPoints` (Task 6); absolute px remain geom source.
- Branching vector networks rejected at Bind/Apply (API constraint).
- Turn/Y-down mapping called out as lock-with-fixture in Task 2 to avoid silent mirrored elbows.
