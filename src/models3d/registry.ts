import { FieldAnomalyScene } from './field-anomaly';
import { StellarBodyScene } from './stellar-body';
import type { Model3DDef, Viewport3DBinding } from './types';

export type { Model3DDef, ModelColors, ModelSceneProps, Viewport3DBinding, ViewportRepresentation, ViewportUnit } from './types';

const REGISTRY: Record<string, Model3DDef> = {
  'field-anomaly': {
    id: 'field-anomaly',
    label: 'Field anomaly',
    series: ['flux', 'gradient', 'phase'],
    defaultRepresentation: 'wireframe',
    Scene: FieldAnomalyScene,
    a11ySummary: (binding) => {
      const units = binding.units.map((unit) => `${unit.label} in ${unit.unit}`).join(', ');
      return `Field anomaly schematic showing ${units}.`;
    },
  },
  'stellar-body': {
    id: 'stellar-body',
    label: 'Stellar body',
    series: ['luminosity', 'temperature', 'mass'],
    defaultRepresentation: 'wireframe',
    Scene: StellarBodyScene,
    a11ySummary: (binding) => {
      const units = binding.units.map((unit) => `${unit.label} in ${unit.unit}`).join(', ');
      return `Stellar body schematic showing ${units}.`;
    },
  },
};

export function getModel(modelId: string): Model3DDef | undefined {
  return REGISTRY[modelId];
}

export function isRegisteredModel(modelId: string): boolean {
  return modelId in REGISTRY;
}

export function listModelIds(): string[] {
  return Object.keys(REGISTRY);
}

export function fieldAnomalyDemoBinding(): Viewport3DBinding {
  return {
    modelId: 'field-anomaly',
    units: [
      { id: 'flux', label: 'Flux density', unit: 'percent' },
      { id: 'gradient', label: 'Field gradient', unit: 'T/m' },
      { id: 'phase', label: 'Phase offset', unit: 'deg' },
    ],
    representation: 'hybrid',
    encodings: { color: 'flux', height: 'gradient', opacity: 'phase' },
    series: ['flux', 'gradient', 'phase'],
  };
}

export function validateViewportBinding(binding: unknown): string | null {
  if (!binding || typeof binding !== 'object') {
    return 'viewport3d requires a binding object';
  }

  const record = binding as Record<string, unknown>;
  const modelId = record.modelId;
  if (typeof modelId !== 'string' || modelId.length === 0) {
    return 'viewport3d requires a registered modelId';
  }

  const model = getModel(modelId);
  if (!model) {
    return `Unknown viewport modelId: ${modelId}`;
  }

  const units = record.units;
  if (!Array.isArray(units) || units.length === 0) {
    return 'viewport3d requires non-empty units';
  }

  for (const unit of units) {
    if (
      !unit ||
      typeof unit !== 'object' ||
      typeof (unit as Viewport3DBinding['units'][number]).id !== 'string' ||
      !model.series.includes((unit as Viewport3DBinding['units'][number]).id)
    ) {
      return 'viewport3d unit id must match a model series';
    }
  }

  const series = record.series;
  if (!Array.isArray(series) || series.length === 0) {
    return 'viewport3d requires non-empty series';
  }

  for (const seriesId of series) {
    if (typeof seriesId !== 'string' || !model.series.includes(seriesId)) {
      return `viewport3d series id ${String(seriesId)} is not registered on model`;
    }
  }

  const encodings = record.encodings;
  if (encodings !== undefined) {
    if (typeof encodings !== 'object' || encodings === null || Array.isArray(encodings)) {
      return 'viewport3d encodings must be an object';
    }
    for (const [key, seriesId] of Object.entries(encodings as Record<string, unknown>)) {
      if (typeof seriesId !== 'string' || !series.includes(seriesId)) {
        return `Encoding ${key} must reference a declared series id`;
      }
    }
  }

  const representation = record.representation;
  if (
    representation !== undefined &&
    representation !== 'wireframe' &&
    representation !== 'shaded' &&
    representation !== 'hybrid'
  ) {
    return 'viewport3d representation must be wireframe, shaded, or hybrid';
  }

  return null;
}
