import { moduleStyles, type ModeSelectProps } from './shared';
import type { ModuleRendererProps } from './types';

export function ModeSelect({ instance, handlers }: ModuleRendererProps) {
  const props = instance.props as ModeSelectProps;
  const options = props.options ?? [];
  const value = props.value ?? options[0] ?? '';

  return (
    <div
      className="lcars-module lcars-mode-select"
      role="group"
      aria-label="Mode"
      style={moduleStyles(instance.tokens)}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="lcars-action-pill"
          aria-pressed={option === value}
          onClick={() => handlers.onModeChange?.(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
