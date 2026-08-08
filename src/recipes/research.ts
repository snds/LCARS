import type { ModuleInstance, SceneIR } from '@/ir/types';
import type { ClassifiedIntent, CombadgeProfile, SlotFill } from '@/planner/types';
import {
  accentTokens,
  dataTokens,
  maybeDialogueModule,
  resolveDensity,
  shellModules,
  STANDARD_REGIONS,
} from './shared';

export function compile(
  fill: SlotFill,
  profile: CombadgeProfile,
  intent: ClassifiedIntent,
): SceneIR {
  const density = resolveDensity(profile);
  const frame = accentTokens(profile.preferences.accentFamily);
  const data = dataTokens(profile.preferences.accentFamily);
  const claims = fill.claims ?? [];
  const evidence = fill.evidence ?? [];
  const comparisons = fill.comparisons ?? [];

  const claimBlocks = claims.slice(0, 2).map((claim, index) => ({
    id: `claim-data-${index}`,
    type: 'dataBlock' as const,
    regionId: 'main',
    props: {
      title: claim.title,
      value: `${Math.round(claim.confidence * 100)}% confidence`,
    },
    tokens: data,
  }));

  const evidencePanels = evidence.slice(0, 1).map((item, index) => ({
    id: `evidence-${index}`,
    type: 'evidencePanel' as const,
    regionId: 'main',
    props: { title: item.source, summary: item.excerpt },
    tokens: data,
  }));

  const compareBlocks = comparisons.slice(0, 1).map((item, index) => ({
    id: `compare-data-${index}`,
    type: 'dataBlock' as const,
    regionId: 'main',
    props: { title: item.label, value: item.value },
    tokens: data,
  }));

  const claimChildren = [...claimBlocks, ...evidencePanels].map((module) => module.id);

  const mainModules: ModuleInstance[] = [
    {
      id: 'claims',
      type: 'claimList' as const,
      regionId: 'main',
      props: { title: 'Claims' },
      tokens: frame,
      children: claimChildren,
    },
    ...claimBlocks,
    ...evidencePanels,
  ];

  if (compareBlocks.length > 0) {
    mainModules.push({
      id: 'compare',
      type: 'comparePanel' as const,
      regionId: 'main',
      props: { title: 'Theory comparison' },
      tokens: frame,
      children: compareBlocks.map((module) => module.id),
    });
    mainModules.push(...compareBlocks);
  }

  const dialogue = maybeDialogueModule(intent, density, frame);

  if (fill.summary && !dialogue) {
    mainModules.push({
      id: 'summary',
      type: 'prose' as const,
      regionId: 'main',
      props: { text: fill.summary },
      tokens: frame,
    });
  }

  if (dialogue) {
    mainModules.push(dialogue);
  }

  const actionModules = (fill.actions ?? []).slice(0, 2).map((action, index) => ({
    id: `action-${index}`,
    type: 'actionPill' as const,
    regionId: 'leftRail',
    props: { label: action.label, action: action.id, touchPx: 44 },
    tokens: { fill: 'action.amber' as const, ink: 'ink.onFill' as const },
  }));

  const dialogueTurns = dialogue
    ? [
        { role: 'user' as const, text: intent.raw },
        { role: 'system' as const, text: fill.summary ?? 'Analysis in progress.' },
      ]
    : undefined;

  return {
    version: 1,
    surfaceId: 'research.baseline',
    role: profile.role,
    density,
    intent: {
      class: intent.class,
      raw: intent.raw,
      analysisNeedsDialogue: intent.analysisNeedsDialogue,
    },
    regions: STANDARD_REGIONS,
    modules: [...shellModules(profile), ...actionModules, ...mainModules],
    focus: { aperture: true },
    a11y: { title: 'Research workspace', liveMessage: fill.summary },
    surfaceState: 'result',
    ...(dialogueTurns ? { dialogue: { turns: dialogueTurns } } : {}),
  };
}
