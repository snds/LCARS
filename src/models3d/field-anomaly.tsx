import { useMemo } from 'react';
import { MeshBasicMaterial, MeshStandardMaterial } from 'three';
import type { ModelSceneProps } from './types';

export function FieldAnomalyScene({ representation, colors }: ModelSceneProps) {
  const wireMaterial = useMemo(
    () => new MeshBasicMaterial({ color: colors.primary, wireframe: true }),
    [colors.primary],
  );
  const shadedMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: colors.accent,
        emissive: colors.secondary,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: representation === 'hybrid' ? 0.4 : 1,
      }),
    [colors.accent, colors.secondary, representation],
  );

  const showWireframe = representation === 'wireframe' || representation === 'hybrid';
  const showShaded = representation === 'shaded' || representation === 'hybrid';

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[3, 3, 3]} intensity={0.9} color={colors.accent} />
      {showWireframe ? (
        <mesh rotation={[0.45, 0.65, 0]}>
          <torusKnotGeometry args={[0.55, 0.16, 64, 12]} />
          <primitive attach="material" object={wireMaterial} />
        </mesh>
      ) : null}
      {showShaded ? (
        <mesh rotation={[0.45, 0.65, 0]} scale={representation === 'hybrid' ? 0.92 : 1}>
          <icosahedronGeometry args={[0.72, 2]} />
          <primitive attach="material" object={shadedMaterial} />
        </mesh>
      ) : null}
    </>
  );
}
