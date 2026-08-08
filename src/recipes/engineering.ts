import type { ModuleInstance, SceneIR } from '@/ir/types';
import type { ClassifiedIntent, CombadgeProfile, SlotFill } from '@/planner/types';
import { fieldAnomalyDemoBinding } from '@/models3d/registry';
import { accentTokens, resolveDensity, shellModules, STANDARD_REGIONS } from './shared';

const VIEWPORT_INTENT =
  /\b(telemetry|diagnostic|diagnostics|schematic|eps|grid|warp|reactor|power)\b/i;

function wantsViewport(intent: ClassifiedIntent): boolean {
  return VIEWPORT_INTENT.test(intent.raw);
}

export function compile(
  fill: SlotFill,
  profile: CombadgeProfile,
  intent: ClassifiedIntent,
): SceneIR {
  const density = resolveDensity(profile);
  const frame = accentTokens(profile.preferences.accentFamily);
  const data = accentTokens(profile.preferences.accentFamily);
  const includeViewport = wantsViewport(intent);
  const viewportBinding = fieldAnomalyDemoBinding();
  const seriesIds = viewportBinding.series ?? [];

  const telemetryModules = (fill.telemetry ?? []).slice(0, 6).map((item, index) => ({
    id: `telemetry-${index}`,
    type: 'dataBlock' as const,
    regionId: 'main',
    props: { title: item.label, value: item.value },
    tokens: data,
    ...(includeViewport && seriesIds.length > 0
      ? { binding: { series: seriesIds[index % seriesIds.length] } }
      : {}),
  }));

  const actionModules = (fill.actions ?? []).slice(0, 2).map((action, index) => ({
    id: `action-${index}`,
    type: 'actionPill' as const,
    regionId: 'leftRail',
    props: { label: action.label, action: action.id, touchPx: 44 },
    tokens: { fill: 'action.amber' as const, ink: 'ink.onFill' as const },
  }));

  const mainModules: ModuleInstance[] = [];

  if (includeViewport) {
    mainModules.push({
      id: 'viewport',
      type: 'viewport3d' as const,
      regionId: 'main',
      props: { label: 'EPS GRID' },
      tokens: { ...frame, accent: 'data.amber' },
      binding: viewportBinding,
    });
  }

  mainModules.push(...telemetryModules);

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
    focus: { moduleId: includeViewport ? 'viewport' : 'aperture' },
    a11y: { title: 'Engineering diagnostics', liveMessage: fill.summary },
    surfaceState: 'result',
  };
}
