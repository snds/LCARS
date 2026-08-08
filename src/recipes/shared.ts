import type { TokenId } from '@/constitution';
import type { ModuleInstance } from '@/ir/types';
import type { AccentFamily, CombadgeProfile } from '@/planner/types';
import type { ClassifiedIntent } from '@/planner/types';

export const STANDARD_REGIONS = [
  { id: 'header', kind: 'header' as const },
  { id: 'leftRail', kind: 'rail' as const },
  { id: 'main', kind: 'main' as const },
  { id: 'mode', kind: 'mode' as const },
  { id: 'footer', kind: 'status' as const },
];

export function accentTokens(accentFamily: AccentFamily): { fill: TokenId; ink: TokenId } {
  switch (accentFamily) {
    case 'bluegrey':
      return { fill: 'data.bluegrey', ink: 'ink.onBlack' };
    case 'mauve':
    case 'amber':
    case 'salmon':
    default:
      return { fill: 'frame.amber', ink: 'ink.onFill' };
  }
}

export function dataTokens(accentFamily: AccentFamily): { fill: TokenId; ink: TokenId } {
  return accentTokens(accentFamily);
}

export function resolveDensity(profile: CombadgeProfile): CombadgeProfile['preferences']['density'] {
  if (profile.preferences.density) {
    return profile.preferences.density;
  }
  switch (profile.role) {
    case 'physician':
      return 'standard';
    case 'engineer':
      return 'dense';
    case 'executive':
      return 'sparse';
    default:
      return 'standard';
  }
}

export function shellModules(profile: CombadgeProfile): ModuleInstance[] {
  const tokens = accentTokens(profile.preferences.accentFamily);
  const actionTokens = { fill: 'action.amber' as TokenId, ink: 'ink.onFill' as TokenId };

  return [
    {
      id: 'header-elbow',
      type: 'elbow',
      regionId: 'header',
      props: { orientation: 'horizontal' },
      tokens,
    },
    {
      id: 'rail-primary',
      type: 'actionPill',
      regionId: 'leftRail',
      props: { label: 'HOME', action: 'home', touchPx: 44 },
      tokens: actionTokens,
    },
    {
      id: 'mode-select',
      type: 'modeSelect',
      regionId: 'mode',
      props: { options: ['OVERVIEW', 'DETAIL'], value: 'OVERVIEW' },
      tokens,
    },
    {
      id: 'aperture',
      type: 'queryAperture',
      regionId: 'footer',
      props: {},
      tokens,
    },
    {
      id: 'status',
      type: 'statusRail',
      regionId: 'footer',
      props: { state: 'result', label: 'RESULT' },
      tokens,
    },
  ];
}

export function maybeDialogueModule(
  intent: ClassifiedIntent,
  density: CombadgeProfile['preferences']['density'],
  tokens: { fill: TokenId; ink: TokenId },
): ModuleInstance | null {
  if (!intent.analysisNeedsDialogue || density === 'dense') {
    return null;
  }

  return {
    id: 'dialogue',
    type: 'dialogue',
    regionId: 'main',
    props: {},
    tokens,
  };
}
