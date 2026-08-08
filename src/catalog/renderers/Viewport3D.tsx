import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import { Color } from 'three';
import { TOKENS, type TokenId } from '@/constitution';
import { getModel, type Viewport3DBinding } from '@/models3d/registry';
import { moduleStyles, type Viewport3DProps } from './shared';
import type { ModuleRendererProps } from './types';

function tokenToColor(tokenId: string): Color {
  const def = TOKENS[tokenId as TokenId];
  return new Color(def?.hex ?? '#FFCC66');
}

function isViewportBinding(binding: unknown): binding is Viewport3DBinding {
  return Boolean(binding && typeof binding === 'object' && 'modelId' in binding);
}

export function Viewport3D({ instance }: ModuleRendererProps) {
  const props = instance.props as Viewport3DProps;
  const binding = isViewportBinding(instance.binding) ? instance.binding : undefined;
  const model = binding ? getModel(binding.modelId) : undefined;
  const representation = binding?.representation ?? model?.defaultRepresentation ?? 'wireframe';
  const scrubbing = binding?.scrubbing ?? false;

  const colors = useMemo(
    () => ({
      primary: tokenToColor(instance.tokens.fill),
      secondary: tokenToColor(instance.tokens.ink),
      accent: tokenToColor(instance.tokens.accent ?? instance.tokens.fill),
    }),
    [instance.tokens.accent, instance.tokens.fill, instance.tokens.ink],
  );

  const summaryId = `${instance.id}-summary`;
  const a11ySummary =
    model && binding ? model.a11ySummary(binding) : 'Three-dimensional schematic viewport.';

  const Scene = model?.Scene;

  return (
    <section
      className="lcars-module lcars-viewport3d"
      aria-label={props.label ?? '3D viewport'}
      aria-describedby={summaryId}
      style={moduleStyles(instance.tokens)}
    >
      <p id={summaryId} className="lcars-sr-only">
        {a11ySummary}
      </p>
      {Scene ? (
        <Canvas
          className="lcars-viewport3d__canvas"
          frameloop={scrubbing ? 'always' : 'demand'}
          camera={{ position: [0, 0, 2.4], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene representation={representation} colors={colors} />
          </Suspense>
        </Canvas>
      ) : (
        <p className="lcars-viewport3d__fallback">Model unavailable</p>
      )}
    </section>
  );
}
