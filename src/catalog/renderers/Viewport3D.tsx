import { moduleStyles, type Viewport3DProps } from './shared';
import type { ModuleRendererProps } from './types';

export function Viewport3D({ instance }: ModuleRendererProps) {
  const props = instance.props as Viewport3DProps;

  return (
    <section
      className="lcars-module lcars-viewport3d"
      aria-label={props.label ?? '3D viewport'}
      style={moduleStyles(instance.tokens)}
    >
      pending Task 10
    </section>
  );
}
