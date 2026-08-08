import type { ModuleCatalog } from './types';

export const modules: ModuleCatalog = {
  statusRail: { type: 'statusRail', primitive: 'bar', allowedRegions: ['status'] },
  queryAperture: { type: 'queryAperture', primitive: 'pill', allowedRegions: ['status'] },
  elbow: { type: 'elbow', primitive: 'elbow', allowedRegions: ['rail', 'header', 'main', 'mode', 'status'] },
  actionPill: { type: 'actionPill', primitive: 'pill', allowedRegions: ['rail', 'header', 'main', 'mode', 'status'] },
  dataBlock: { type: 'dataBlock', primitive: 'rect', allowedRegions: ['main'] },
  claimList: { type: 'claimList', primitive: 'composite', allowedRegions: ['main'], allowedChildren: ['dataBlock', 'evidencePanel'] },
  evidencePanel: { type: 'evidencePanel', primitive: 'rect', allowedRegions: ['main'] },
  comparePanel: { type: 'comparePanel', primitive: 'composite', allowedRegions: ['main'], allowedChildren: ['dataBlock', 'claimList'] },
  prose: { type: 'prose', primitive: 'rect', allowedRegions: ['main'] },
  dialogue: { type: 'dialogue', primitive: 'composite', allowedRegions: ['main'], densityMax: 'standard' },
  modeSelect: { type: 'modeSelect', primitive: 'pill', allowedRegions: ['mode'] },
  viewport3d: { type: 'viewport3d', primitive: 'viewportCircle', allowedRegions: ['main'] },
};

export const DEFAULT_CATALOG = modules;
