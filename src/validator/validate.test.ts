import { describe, expect, it } from 'vitest';
import { DEFAULT_CATALOG } from '@/catalog/modules';
import { contrastPair, TOKENS } from '@/constitution';
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

  it('reports scene-wide validation passes in constitution order', () => {
    const catalog = {
      ...DEFAULT_CATALOG,
      statusRail: {
        ...DEFAULT_CATALOG.statusRail,
        primitive: 'not-a-legal-primitive' as never,
        densityMax: 'sparse' as const,
        allowedRoles: ['engineer'],
        requiredClearance: ['restricted'],
      },
    };
    const bad = {
      ...base,
      density: 'dense' as const,
      focus: { moduleId: 'missing' },
      modules: [
        {
          ...base.modules[0],
          type: 'unknownModule',
          tokens: { fill: 'unknown.token', ink: 'ink.onFill' },
        },
        {
          ...base.modules[1],
          regionId: 'main',
          children: ['aperture'],
          props: { ...base.modules[1].props, touchPx: 0 },
          tokens: { fill: 'data.mauve', ink: 'frame.mauve' },
        },
        {
          id: 'viewport',
          type: 'viewport3d',
          regionId: 'main',
          props: {},
          tokens: { fill: 'frame.amber', ink: 'ink.onFill' },
        },
      ],
    };

    const result = validateSceneIR(bad, { catalog });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'module-type',
      'parent-child',
      'geometry',
      'token',
      'contrast',
      'touch',
      'focus',
      'density',
      'region',
      'role',
      'clearance',
      'viewport3d',
    ]);
  });

  it('repairs contrast using semantic ink and fill token roles', () => {
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
    if (result.ok || !result.repaired) return;
    const repaired = result.repaired.modules.find((module) => module.id === 'status');
    expect(repaired).toBeDefined();
    if (!repaired) return;
    expect(TOKENS[repaired.tokens.fill as keyof typeof TOKENS].role).not.toBe('ink');
    expect(TOKENS[repaired.tokens.ink as keyof typeof TOKENS].role).toBe('ink');
    expect(
      contrastPair(
        repaired.tokens.ink as keyof typeof TOKENS,
        repaired.tokens.fill as keyof typeof TOKENS,
        'bodyLabel',
      ).ok,
    ).toBe(true);
  });
});
