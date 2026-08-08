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

  const telemetryLimit = density === 'sparse' ? 1 : 2;
  const actionLimit = density === 'sparse' ? 1 : 2;

  const telemetryModules = (fill.telemetry ?? []).slice(0, telemetryLimit).map((item, index) => ({
    id: `metric-${index}`,
    type: 'dataBlock' as const,
    regionId: 'main',
    props: { title: item.label, value: item.value },
    tokens: frame,
  }));

  const actionModules = (fill.actions ?? []).slice(0, actionLimit).map((action, index) => ({
    id: `action-${index}`,
    type: 'actionPill' as const,
    regionId: 'leftRail',
    props: { label: action.label, action: action.id, touchPx: 44 },
    tokens: { fill: 'action.amber' as const, ink: 'ink.onFill' as const },
  }));

  const mainModules: ModuleInstance[] = [...telemetryModules];

  if (fill.summary) {
    mainModules.push({
      id: 'summary',
      type: 'prose' as const,
      regionId: 'main',
      props: { text: fill.summary },
      tokens: frame,
    });
  }

  return {
    version: 1,
    surfaceId: 'command.executive',
    role: profile.role,
    density,
    intent: {
      class: intent.class,
      raw: intent.raw,
      analysisNeedsDialogue: intent.analysisNeedsDialogue,
    },
    regions: STANDARD_REGIONS,
    modules: [...shellModules(profile), ...actionModules, ...mainModules],
    focus: { moduleId: actionModules[0]?.id ?? 'summary' },
    a11y: { title: 'Executive summary', liveMessage: fill.summary },
    surfaceState: 'result',
  };
}
