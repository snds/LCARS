import type { ModuleInstance, SceneIR } from '@/ir/types';
import type { ClassifiedIntent, CombadgeProfile, SlotFill } from '@/planner/types';
import { accentTokens, resolveDensity, shellModules, STANDARD_REGIONS } from './shared';

export function compile(
  fill: SlotFill,
  profile: CombadgeProfile,
  intent: ClassifiedIntent,
): SceneIR {
  const density = resolveDensity(profile);
  const frame = accentTokens(profile.preferences.accentFamily);

  const alertModules = (fill.alerts ?? []).slice(0, 1).map((alert, index) => ({
    id: `alert-${index}`,
    type: 'dataBlock' as const,
    regionId: 'main',
    props: { title: alert.level.toUpperCase(), value: alert.message },
    tokens: { fill: 'alert.orange' as const, ink: 'ink.onFill' as const },
  }));

  const telemetryModules = (fill.telemetry ?? []).slice(0, 4).map((item, index) => ({
    id: `telemetry-${index}`,
    type: 'dataBlock' as const,
    regionId: 'main',
    props: { title: item.label, value: item.value },
    tokens: frame,
  }));

  const actionModules = (fill.actions ?? []).slice(0, 1).map((action, index) => ({
    id: `action-${index}`,
    type: 'actionPill' as const,
    regionId: 'leftRail',
    props: { label: action.label, action: action.id, touchPx: 44 },
    tokens: { fill: 'action.amber' as const, ink: 'ink.onFill' as const },
  }));

  const mainModules: ModuleInstance[] = [...alertModules, ...telemetryModules];

  return {
    version: 1,
    surfaceId: 'ops.security',
    role: profile.role,
    density,
    intent: {
      class: intent.class,
      raw: intent.raw,
      analysisNeedsDialogue: intent.analysisNeedsDialogue,
    },
    regions: STANDARD_REGIONS,
    modules: [...shellModules(profile), ...actionModules, ...mainModules],
    focus: { moduleId: alertModules[0]?.id ?? telemetryModules[0]?.id },
    a11y: { title: 'Operations security', liveMessage: fill.alerts?.[0]?.message },
    surfaceState: 'result',
  };
}
