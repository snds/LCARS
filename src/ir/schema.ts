import { z } from 'zod';

export const RoleIdSchema = z.enum([
  'engineer',
  'physician',
  'physicist',
  'operations',
  'security',
  'executive',
]);

export const IntentClassSchema = z.enum([
  'command',
  'infoseek',
  'analysis',
  'navigate',
  'refine',
]);

export const DensitySchema = z.enum(['sparse', 'standard', 'dense']);

export const ModuleInstanceSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  regionId: z.string().min(1),
  props: z.record(z.unknown()).default({}),
  tokens: z
    .object({
      fill: z.string(),
      ink: z.string(),
      accent: z.string().optional(),
    })
    .passthrough(),
  children: z.array(z.string()).optional(),
  binding: z.record(z.unknown()).optional(),
});

export const SceneIRSchema = z.object({
  version: z.literal(1),
  surfaceId: z.string().min(1),
  role: RoleIdSchema,
  density: DensitySchema,
  intent: z.object({
    class: IntentClassSchema,
    raw: z.string(),
    analysisNeedsDialogue: z.boolean().default(false),
    domain: z.string().optional(),
  }),
  regions: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['rail', 'header', 'main', 'mode', 'status']),
    }),
  ),
  modules: z.array(ModuleInstanceSchema),
  focus: z.object({ moduleId: z.string().optional(), aperture: z.boolean().optional() }),
  a11y: z.object({
    title: z.string(),
    liveMessage: z.string().optional(),
  }),
  dialogue: z
    .object({
      turns: z.array(z.object({ role: z.enum(['user', 'system']), text: z.string() })),
    })
    .optional(),
  surfaceState: z
    .enum([
      'idle',
      'listening',
      'working',
      'result',
      'empty',
      'error',
      'degraded',
      'refinePending',
    ])
    .default('idle'),
});

export const ScenePatchSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('setFilter'), moduleId: z.string(), filter: z.unknown() }),
  z.object({ op: z.literal('setDensity'), density: DensitySchema }),
  z.object({
    op: z.literal('replaceModule'),
    moduleId: z.string(),
    module: ModuleInstanceSchema,
  }),
  z.object({ op: z.literal('openDrillIn'), moduleId: z.string(), target: z.string() }),
  z.object({
    op: z.literal('setViewportParam'),
    moduleId: z.string(),
    key: z.string(),
    value: z.unknown(),
  }),
]);
