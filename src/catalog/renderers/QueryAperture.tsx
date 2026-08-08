import type { FormEvent } from 'react';
import { moduleStyles } from './shared';
import type { ModuleRendererProps } from './types';

export function QueryAperture({ instance, handlers }: ModuleRendererProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem('command');
    if (!(input instanceof HTMLInputElement)) return;
    handlers.onIntent?.(input.value);
  };

  return (
    <form
      className="lcars-module lcars-query-aperture"
      style={moduleStyles(instance.tokens)}
      onSubmit={handleSubmit}
    >
      <input name="command" type="text" aria-label="Command" />
    </form>
  );
}
