import { useMemo } from 'react';
import { MeshBasicMaterial, MeshStandardMaterial } from 'three';
import type { ModelSceneProps } from './types';

export function StellarBodyScene({ representation, colors }: ModelSceneProps) {
  const wireMaterial = useMemo(
    () => new MeshBasicMaterial({ color: colors.primary, wireframe: true }),
    [colors.primary],
  );
  const shadedMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: colors.accent,
        emissive: colors.accent,
        emissiveIntensity: 0.5,
        roughness: 0.6,
      }),
    [colors.accent],
  );

  const showWireframe = representation === 'wireframe' || representation === 'hybrid';
  const showShaded = representation === 'shaded' || representation === 'hybrid';

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[2, 2, 4]} intensity={1.1} color={colors.accent} />
      {showWireframe ? (
        <mesh>
          <sphereGeometry args={[0.75, 24, 24]} />
          <primitive attach="material" object={wireMaterial} />
        </mesh>
      ) : null}
      {showShaded ? (
        <mesh scale={representation === 'hybrid' ? 0.88 : 1}>
          <sphereGeometry args={[0.75, 32, 32]} />
          <primitive attach="material" object={shadedMaterial} />
        </mesh>
      ) : null}
    </>
  );
}
