import type { ReactNode } from 'react';
import type { ModuleInstance, SceneIR } from '@/ir/types';

export type ModuleHandlers = {
  onIntent?: (text: string) => void;
  onAction?: (moduleId: string, action?: string) => void;
  onModeChange?: (mode: string) => void;
};

export type ModuleRendererProps = {
  instance: ModuleInstance;
  ir: SceneIR;
  handlers: ModuleHandlers;
  renderChild: (childId: string) => ReactNode;
};
