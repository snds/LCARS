export const RECOMPOSE_MS = { min: 150, max: 250 } as const;

export function recomposeDuration(reducedMotion: boolean): number {
  return reducedMotion ? 0 : 200;
}
