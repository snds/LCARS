import type { SceneIR } from '@/ir/types';

export function researchIdleIR(): SceneIR {
  return {
    version: 1,
    surfaceId: 'research.baseline',
    role: 'physicist',
    density: 'standard',
    intent: { class: 'infoseek', raw: 'x', analysisNeedsDialogue: false },
    regions: [
      { id: 'header', kind: 'header' },
      { id: 'leftRail', kind: 'rail' },
      { id: 'main', kind: 'main' },
      { id: 'mode', kind: 'mode' },
      { id: 'footer', kind: 'status' },
    ],
    modules: [
      {
        id: 'aperture',
        type: 'queryAperture',
        regionId: 'footer',
        props: {},
        tokens: { fill: 'frame.amber', ink: 'ink.onFill' },
      },
      {
        id: 'status',
        type: 'statusRail',
        regionId: 'footer',
        props: { state: 'idle', label: 'READY' },
        tokens: { fill: 'frame.amber', ink: 'ink.onFill' },
      },
    ],
    focus: { aperture: true },
    a11y: { title: 'Research' },
    surfaceState: 'idle',
  };
}
