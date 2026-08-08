import type { ReactNode } from 'react';
import { TOKENS, tokensToCssVars } from '@/constitution';
import { renderModule, type ModuleHandlers } from '@/catalog/renderers';
import '@/catalog/renderers/renderers.css';
import type { ModuleInstance, SceneIR } from '@/ir/types';
import { assertValidatedSceneIR } from '@/validator';

const LANDMARK_BY_KIND = {
  header: 'banner',
  rail: 'navigation',
  main: 'main',
  mode: 'complementary',
  status: 'contentinfo',
} as const;

type RegionKind = keyof typeof LANDMARK_BY_KIND;

function topLevelModules(modules: ModuleInstance[]): ModuleInstance[] {
  const childIds = new Set(modules.flatMap((module) => module.children ?? []));
  return modules.filter((module) => !childIds.has(module.id));
}

function modulesForRegion(modules: ModuleInstance[], regionId: string): ModuleInstance[] {
  return topLevelModules(modules).filter((module) => module.regionId === regionId);
}

function renderRegion(
  region: SceneIR['regions'][number],
  ir: SceneIR,
  handlers: ModuleHandlers,
): ReactNode {
  const modules = modulesForRegion(ir.modules, region.id);
  const landmark = LANDMARK_BY_KIND[region.kind as RegionKind];
  const children = modules.map((module) => (
    <div key={module.id}>{renderModule(module, ir, handlers)}</div>
  ));

  const commonProps = {
    className: 'lcars-region',
    'data-region-id': region.id,
    children,
  };

  switch (landmark) {
    case 'banner':
      return <header {...commonProps} />;
    case 'navigation':
      return <nav {...commonProps} aria-label={ir.a11y.title} />;
    case 'main':
      return <main {...commonProps} aria-label={ir.a11y.title} />;
    case 'complementary':
      return <aside {...commonProps} aria-label="Mode" />;
    case 'contentinfo':
      return <footer {...commonProps} />;
    default:
      return <div {...commonProps} />;
  }
}

export type SurfaceHostProps = {
  ir: SceneIR;
  handlers?: ModuleHandlers;
};

export function SurfaceHost({ ir, handlers = {} }: SurfaceHostProps) {
  assertValidatedSceneIR(ir);

  return (
    <>
      <style>{tokensToCssVars(TOKENS)}</style>
      <div className="lcars-surface" data-surface-id={ir.surfaceId} data-state={ir.surfaceState}>
        {ir.regions.map((region) => (
          <div key={region.id}>{renderRegion(region, ir, handlers)}</div>
        ))}
      </div>
    </>
  );
}
