import { moduleStyles, type ElbowProps } from './shared';
import type { ModuleRendererProps } from './types';

export function Elbow({ instance }: ModuleRendererProps) {
  const props = instance.props as ElbowProps;

  return (
    <div
      className="lcars-module lcars-elbow"
      role="presentation"
      aria-hidden="true"
      data-orientation={props.orientation ?? 'horizontal'}
      style={moduleStyles(instance.tokens)}
    />
  );
}
