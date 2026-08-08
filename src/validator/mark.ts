import type { SceneIR } from '@/ir/types';

const VALIDATED = Symbol.for('lcars.sceneIR.validated');

type ValidatedSceneIR = SceneIR & { [VALIDATED]?: true };

export function markValidatedSceneIR(ir: SceneIR): SceneIR {
  Object.defineProperty(ir, VALIDATED, { value: true, enumerable: false });
  return ir;
}

export function assertValidatedSceneIR(ir: SceneIR): void {
  if (!(ir as ValidatedSceneIR)[VALIDATED]) {
    throw new Error('SurfaceHost requires SceneIR validated via validateSceneIR');
  }
}

export function isValidatedSceneIR(ir: SceneIR): boolean {
  return (ir as ValidatedSceneIR)[VALIDATED] === true;
}
