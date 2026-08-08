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
  const data = accentTokens(profile.preferences.accentFamily);

  const telemetryModules = (fill.telemetry ?? []).slice(0, 6).map((item, index) => ({
    id: `telemetry-${index}`,
    type: 'dataBlock' as const,
    regionId: 'main',
    props: { title: item.label, value: item.value },
    tokens: data,
  }));

  const actionModules = (fill.actions ?? []).slice(0, 2).map((action, index) => ({
    id: `action-${index}`,
    type: 'actionPill' as const,
    regionId: 'leftRail',
    props: { label: action.label, action: action.id, touchPx: 44 },
    tokens: { fill: 'action.amber' as const, ink: 'ink.onFill' as const },
  }));

  const mainModules: ModuleInstance[] = [
    {
      id: 'viewport',
      type: 'viewport3d' as const,
      regionId: 'main',
      props: { label: 'EPS GRID' },
      tokens: frame,
      binding: { modelId: 'field-anomaly', units: 'percent' },
    },
    ...telemetryModules,
  ];

  if (fill.summary) {
    mainModules.push({
      id: 'summary',
      type: 'prose' as const,
      regionId: 'main',
      props: { text: fill.summary },
      tokens: data,
    });
  }

  return {
    version: 1,
    surfaceId: 'engineering.diagnostics',
    role: profile.role,
    density,
    intent: {
      class: intent.class,
      raw: intent.raw,
      analysisNeedsDialogue: intent.analysisNeedsDialogue,
    },
    regions: STANDARD_REGIONS,
    modules: [...shellModules(profile), ...actionModules, ...mainModules],
    focus: { moduleId: 'viewport' },
    a11y: { title: 'Engineering diagnostics', liveMessage: fill.summary },
    surfaceState: 'result',
  };
}
