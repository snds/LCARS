import { describe, expect, it } from 'vitest';
import { SceneIRSchema } from '@/ir/schema';
import { validateSceneIR } from './validate';

const base = SceneIRSchema.parse({
  version: 1,
  surfaceId: 'research.baseline',
  role: 'physicist',
  density: 'standard',
  intent: { class: 'infoseek', raw: 'x', analysisNeedsDialogue: false },
  regions: [
    { id: 'main', kind: 'main' },
    { id: 'footer', kind: 'status' },
  ],
  modules: [
    {
      id: 'aperture',
      type: 'queryAperture',
      regionId: 'footer',
      props: {},
      tokens: { fill: 'frame.amber', ink: 'ink.onFill' },
    },
    {
      id: 'status',
      type: 'statusRail',
      regionId: 'footer',
      props: { state: 'idle', label: 'READY' },
      tokens: { fill: 'frame.amber', ink: 'ink.onFill' },
    },
  ],
  focus: { aperture: true },
  a11y: { title: 'Research' },
  surfaceState: 'idle',
});

describe('validateSceneIR', () => {
  it('accepts a minimal research shell', () => {
    const result = validateSceneIR(base, { catalog: 'default' });
    expect(result.ok).toBe(true);
  });

  it('rejects unknown module type', () => {
    const bad = {
      ...base,
      modules: [
        ...base.modules,
        {
          id: 'x',
          type: 'chatBubble',
          regionId: 'main',
          props: {},
          tokens: { fill: 'action.amber', ink: 'ink.onFill' },
        },
      ],
    };
    const result = validateSceneIR(bad, { catalog: 'default' });
    expect(result.ok).toBe(false);
  });

  it('rejects contrast-illegal ink/fill', () => {
    const bad = {
      ...base,
      modules: base.modules.map((module) =>
        module.id === 'status'
          ? { ...module, tokens: { fill: 'data.mauve', ink: 'frame.mauve' } }
          : module,
      ),
    };
    const result = validateSceneIR(bad, { catalog: 'default' });
    expect(result.ok).toBe(false);
  });
});
