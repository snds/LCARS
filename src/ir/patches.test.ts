import { describe, it, expect } from 'vitest';
import { SceneIRSchema } from './schema';
import { applyPatch } from './patches';

const base = SceneIRSchema.parse({
  version: 1,
  surfaceId: 'research.baseline',
  role: 'physicist',
  density: 'standard',
  intent: {
    class: 'infoseek',
    raw: 'compare warp theories',
    analysisNeedsDialogue: false,
  },
  regions: [
    { id: 'leftRail', kind: 'rail' },
    { id: 'main', kind: 'main' },
    { id: 'footer', kind: 'status' },
  ],
  modules: [
    {
      id: 'm1',
      type: 'statusRail',
      regionId: 'footer',
      props: { state: 'idle', label: 'READY' },
      tokens: { fill: 'frame.mauve', ink: 'ink.onFill' },
    },
    {
      id: 'm2',
      type: 'dataTable',
      regionId: 'main',
      props: { rows: [] },
      tokens: { fill: 'data.mauve', ink: 'ink.onFill' },
    },
  ],
  focus: { moduleId: 'm1' },
  a11y: { title: 'Research workspace' },
});

describe('applyPatch ops', () => {
  it('setFilter merges filter into module props', () => {
    const next = applyPatch(base, {
      op: 'setFilter',
      moduleId: 'm2',
      filter: { status: 'active' },
    });
    const m2 = next.modules.find((m) => m.id === 'm2');
    expect(m2?.props.filter).toEqual({ status: 'active' });
    expect(m2?.props.rows).toEqual([]);
  });

  it('replaceModule swaps the matching module', () => {
    const replacement = {
      id: 'm1',
      type: 'statusRail',
      regionId: 'footer',
      props: { state: 'working', label: 'BUSY' },
      tokens: { fill: 'frame.amber', ink: 'ink.onFill' },
    };
    const next = applyPatch(base, {
      op: 'replaceModule',
      moduleId: 'm1',
      module: replacement,
    });
    expect(next.modules.find((m) => m.id === 'm1')).toEqual(replacement);
  });

  it('openDrillIn sets drillIn on module props', () => {
    const next = applyPatch(base, {
      op: 'openDrillIn',
      moduleId: 'm2',
      target: 'claim-42',
    });
    expect(next.modules.find((m) => m.id === 'm2')?.props.drillIn).toBe('claim-42');
  });

  it('setViewportParam merges into module binding', () => {
    const next = applyPatch(base, {
      op: 'setViewportParam',
      moduleId: 'm2',
      key: 'zoom',
      value: 1.5,
    });
    expect(next.modules.find((m) => m.id === 'm2')?.binding).toEqual({ zoom: 1.5 });
  });

  it('does not mutate the input ir', () => {
    const before = structuredClone(base);
    applyPatch(base, { op: 'setDensity', density: 'sparse' });
    expect(base).toEqual(before);
  });
});
