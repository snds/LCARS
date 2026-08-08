export type Density = 'sparse' | 'standard' | 'dense';
export const LEGAL_PRIMITIVES = [
  'elbow',
  'bar',
  'pill',
  'rect',
  'sweep',
  'viewportCircle',
] as const;
export type LegalPrimitive = (typeof LEGAL_PRIMITIVES)[number];

export const GUTTER_PX: Record<Density, number> = {
  sparse: 16,
  standard: 12,
  dense: 8,
};

export function densityCaps(density: Density) {
  const maxModules = density === 'sparse' ? 8 : density === 'standard' ? 14 : 22;
  return { maxModules, minTouchPx: 44 };
}

export function assertLegalPrimitive(kind: string): void {
  if (!(LEGAL_PRIMITIVES as readonly string[]).includes(kind)) {
    throw new Error(`illegal primitive: ${kind}`);
  }
}
