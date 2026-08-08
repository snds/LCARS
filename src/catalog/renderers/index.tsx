import type { ReactNode } from 'react';
import type { ModuleInstance, SceneIR } from '@/ir/types';
import { ActionPill } from './ActionPill';
import { ClaimList } from './ClaimList';
import { ComparePanel } from './ComparePanel';
import { DataBlock } from './DataBlock';
import { Dialogue } from './Dialogue';
import { Elbow } from './Elbow';
import { EvidencePanel } from './EvidencePanel';
import { ModeSelect } from './ModeSelect';
import { Prose } from './Prose';
import { QueryAperture } from './QueryAperture';
import { StatusRail } from './StatusRail';
import type { ModuleHandlers } from './types';
import { Viewport3D } from './Viewport3D';

const RENDERERS = {
  statusRail: StatusRail,
  queryAperture: QueryAperture,
  elbow: Elbow,
  actionPill: ActionPill,
  dataBlock: DataBlock,
  claimList: ClaimList,
  evidencePanel: EvidencePanel,
  comparePanel: ComparePanel,
  prose: Prose,
  dialogue: Dialogue,
  modeSelect: ModeSelect,
  viewport3d: Viewport3D,
} as const;

type RendererType = keyof typeof RENDERERS;

export function renderModule(
  instance: ModuleInstance,
  ir: SceneIR,
  handlers: ModuleHandlers,
): ReactNode {
  const renderChild = (childId: string): ReactNode => {
    const child = ir.modules.find((module) => module.id === childId);
    return child ? renderModule(child, ir, handlers) : null;
  };

  const Component = RENDERERS[instance.type as RendererType];
  if (!Component) {
    return null;
  }

  return (
    <Component
      instance={instance}
      ir={ir}
      handlers={handlers}
      renderChild={renderChild}
    />
  );
}

export { RENDERERS };
export type { ModuleHandlers, ModuleRendererProps } from './types';
