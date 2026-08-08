import type { FormEvent } from 'react';
import { useEffect, useRef } from 'react';
import { moduleStyles } from './shared';
import type { ModuleRendererProps } from './types';

export function QueryAperture({ instance, handlers, ir }: ModuleRendererProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const focusAperture = ir.focus.aperture || ir.surfaceState === 'degraded';

  useEffect(() => {
    if (focusAperture) {
      inputRef.current?.focus();
    }
  }, [focusAperture, ir.surfaceState]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem('command');
    if (!(input instanceof HTMLInputElement)) return;
    handlers.onIntent?.(input.value);
    input.value = '';
  };

  return (
    <form
      className="lcars-module lcars-query-aperture"
      style={moduleStyles(instance.tokens)}
      onSubmit={handleSubmit}
      data-degraded={ir.surfaceState === 'degraded' ? 'true' : undefined}
    >
      <span className="lcars-query-aperture__elbow" aria-hidden="true" />
      <input
        ref={inputRef}
        name="command"
        type="text"
        aria-label="Command"
        autoComplete="off"
      />
    </form>
  );
}
