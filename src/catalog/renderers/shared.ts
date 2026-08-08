import type { CSSProperties } from 'react';
import { cssVar, type TokenId } from '@/constitution';
import type { ModuleInstance } from '@/ir/types';

export function moduleStyles(tokens: ModuleInstance['tokens']): CSSProperties {
  const styles: CSSProperties = {
    backgroundColor: cssVar(tokens.fill as TokenId),
    color: cssVar(tokens.ink as TokenId),
  };

  if (tokens.accent) {
    styles.borderColor = cssVar(tokens.accent as TokenId);
  }

  return styles;
}

export type StatusRailProps = {
  state?: string;
  label?: string;
};

export type ActionPillProps = {
  label?: string;
  action?: string;
};

export type DataBlockProps = {
  title?: string;
  value?: string;
};

export type EvidencePanelProps = {
  title?: string;
  summary?: string;
};

export type ProseProps = {
  text?: string;
};

export type ModeSelectProps = {
  options?: string[];
  value?: string;
};

export type ElbowProps = {
  orientation?: 'horizontal' | 'vertical';
};

export type Viewport3DProps = {
  label?: string;
};
