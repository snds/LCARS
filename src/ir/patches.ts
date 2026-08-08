import type { SceneIR, ScenePatch } from './types';

export function applyPatch(ir: SceneIR, patch: ScenePatch): SceneIR {
  switch (patch.op) {
    case 'setDensity':
      return { ...ir, density: patch.density };
    case 'replaceModule':
      return {
        ...ir,
        modules: ir.modules.map((m) => (m.id === patch.moduleId ? patch.module : m)),
      };
    case 'setFilter':
      return {
        ...ir,
        modules: ir.modules.map((m) =>
          m.id === patch.moduleId
            ? { ...m, props: { ...m.props, filter: patch.filter } }
            : m,
        ),
      };
    case 'openDrillIn':
      return {
        ...ir,
        modules: ir.modules.map((m) =>
          m.id === patch.moduleId
            ? { ...m, props: { ...m.props, drillIn: patch.target } }
            : m,
        ),
      };
    case 'setViewportParam':
      return {
        ...ir,
        modules: ir.modules.map((m) =>
          m.id === patch.moduleId
            ? {
                ...m,
                binding: { ...(m.binding ?? {}), [patch.key]: patch.value },
              }
            : m,
        ),
      };
    default: {
      const _exhaustive: never = patch;
      return _exhaustive;
    }
  }
}
