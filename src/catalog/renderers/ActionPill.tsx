import { moduleStyles, type ActionPillProps } from './shared';
import type { ModuleRendererProps } from './types';

export function ActionPill({ instance, handlers }: ModuleRendererProps) {
  const props = instance.props as ActionPillProps;
  const label = props.label ?? 'Action';

  return (
    <button
      type="button"
      className="lcars-module lcars-action-pill"
      style={moduleStyles(instance.tokens)}
      onClick={() => handlers.onAction?.(instance.id, props.action)}
    >
      {label}
    </button>
  );
}
