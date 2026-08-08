import { moduleStyles } from './shared';
import type { ModuleRendererProps } from './types';

export function Dialogue({ instance, ir }: ModuleRendererProps) {
  const turns = ir.dialogue?.turns ?? [];

  return (
    <section
      className="lcars-module lcars-dialogue"
      aria-label={instance.id}
      style={moduleStyles(instance.tokens)}
    >
      {turns.map((turn, index) => (
        <div key={`${turn.role}-${index}`} className="lcars-dialogue-turn" data-role={turn.role}>
          <span>{turn.text}</span>
        </div>
      ))}
    </section>
  );
}
