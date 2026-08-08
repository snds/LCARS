import { describe, expect, it } from 'vitest';
import { SceneIRSchema } from '@/ir/schema';
import { validateSceneIR } from '@/validator';
import { fieldAnomalyDemoBinding, getModel, listModelIds, validateViewportBinding } from './registry';

const base = SceneIRSchema.parse({
  version: 1,
  surfaceId: 'engineering.diagnostics',
  role: 'engineer',
  density: 'standard',
  intent: { class: 'analysis', raw: 'eps grid telemetry', analysisNeedsDialogue: false },
  regions: [
    { id: 'main', kind: 'main' },
    { id: 'footer', kind: 'status' },
  ],
  modules: [
    {
      id: 'status',
      type: 'statusRail',
      regionId: 'footer',
      props: { state: 'result', label: 'RESULT' },
      tokens: { fill: 'frame.amber', ink: 'ink.onFill' },
    },
  ],
  focus: { moduleId: 'viewport' },
  a11y: { title: 'Engineering diagnostics' },
  surfaceState: 'result',
});

function withViewportBinding(binding: Record<string, unknown>) {
  return {
    ...base,
    modules: [
      ...base.modules,
      {
        id: 'viewport',
        type: 'viewport3d',
        regionId: 'main',
        props: { label: 'EPS GRID' },
        tokens: { fill: 'frame.amber', ink: 'ink.onFill', accent: 'data.amber' },
        binding,
      },
    ],
  };
}

describe('models3d registry', () => {
  it('registers field-anomaly and stellar-body', () => {
    expect(listModelIds()).toEqual(['field-anomaly', 'stellar-body']);
    expect(getModel('field-anomaly')?.series).toContain('flux');
    expect(getModel('stellar-body')?.series).toContain('luminosity');
  });

  it('rejects viewport3d without units', () => {
    const ir = withViewportBinding({ modelId: 'field-anomaly', units: [], series: ['flux'] });
    expect(validateSceneIR(ir, { catalog: 'default' }).ok).toBe(false);
    expect(validateViewportBinding({ modelId: 'field-anomaly', units: [], series: ['flux'] })).toMatch(
      /units/i,
    );
  });

  it('accepts registered field-anomaly hybrid binding', () => {
    const ir = withViewportBinding(fieldAnomalyDemoBinding());
    expect(validateSceneIR(ir, { catalog: 'default' }).ok).toBe(true);
    expect(validateViewportBinding(fieldAnomalyDemoBinding())).toBeNull();
  });

  it('rejects encoding to series mismatch', () => {
    const binding = {
      ...fieldAnomalyDemoBinding(),
      encodings: { color: 'flux', height: 'missing-series' },
    };
    expect(validateViewportBinding(binding)).toMatch(/series id/i);
    const ir = withViewportBinding(binding);
    expect(validateSceneIR(ir, { catalog: 'default' }).ok).toBe(false);
  });
});
