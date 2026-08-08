import type { z } from 'zod';
import type {
  DensitySchema,
  IntentClassSchema,
  ModuleInstanceSchema,
  RoleIdSchema,
  SceneIRSchema,
  ScenePatchSchema,
} from './schema';

export type SceneIR = z.infer<typeof SceneIRSchema>;
export type ScenePatch = z.infer<typeof ScenePatchSchema>;
export type RoleId = z.infer<typeof RoleIdSchema>;
export type IntentClass = z.infer<typeof IntentClassSchema>;
export type Density = z.infer<typeof DensitySchema>;
export type ModuleInstance = z.infer<typeof ModuleInstanceSchema>;
