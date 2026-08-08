import type { ComponentType } from 'react';
import type { Color } from 'three';

export type ViewportRepresentation = 'wireframe' | 'shaded' | 'hybrid';

export type ViewportUnit = {
  id: string;
  label: string;
  unit: string;
};

export type Viewport3DBinding = {
  modelId: string;
  units: ViewportUnit[];
  representation?: ViewportRepresentation;
  encodings?: Record<string, string>;
  series?: string[];
  scrubbing?: boolean;
};

export type ModelColors = {
  primary: Color;
  secondary: Color;
  accent: Color;
};

export type ModelSceneProps = {
  representation: ViewportRepresentation;
  colors: ModelColors;
};

export type Model3DDef = {
  id: string;
  label: string;
  series: string[];
  defaultRepresentation: ViewportRepresentation;
  Scene: ComponentType<ModelSceneProps>;
  a11ySummary: (binding: Viewport3DBinding) => string;
};
