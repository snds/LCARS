import { describe, it, expect } from 'vitest';
import { SceneIRSchema } from './schema';
import { applyPatch } from './patches';

const minimal = {
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
  ],
  focus: { moduleId: 'm1' },
  a11y: { title: 'Research workspace' },
};

describe('SceneIRSchema', () => {
  it('accepts minimal legal shape', () => {
    expect(SceneIRSchema.parse(minimal).surfaceId).toBe('research.baseline');
  });

  it('rejects missing version', () => {
    expect(() => SceneIRSchema.parse({ ...minimal, version: 2 })).toThrow();
  });
});

describe('applyPatch', () => {
  it('setDensity updates density', () => {
    const ir = SceneIRSchema.parse(minimal);
    const next = applyPatch(ir, { op: 'setDensity', density: 'dense' });
    expect(next.density).toBe('dense');
  });
});
