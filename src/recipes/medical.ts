import type { ModuleInstance, SceneIR } from '@/ir/types';
import type { ClassifiedIntent, CombadgeProfile, SlotFill } from '@/planner/types';
import {
  accentTokens,
  dataTokens,
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

  const mainModules: ModuleInstance[] = [
    {
      id: 'claims',
      type: 'claimList' as const,
      regionId: 'main',
      props: { title: 'Clinical findings' },
      tokens: frame,
      children: [...claimBlocks, ...evidencePanels].map((module) => module.id),
    },
    ...claimBlocks,
    ...evidencePanels,
  ];

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
    surfaceId: 'medical.review',
    role: profile.role,
    density,
    intent: {
      class: intent.class,
      raw: intent.raw,
      analysisNeedsDialogue: intent.analysisNeedsDialogue,
    },
    regions: STANDARD_REGIONS,
    modules: [...shellModules(profile), ...mainModules],
    focus: { moduleId: 'claims' },
    a11y: { title: 'Medical review', liveMessage: fill.summary },
    surfaceState: 'result',
  };
}
