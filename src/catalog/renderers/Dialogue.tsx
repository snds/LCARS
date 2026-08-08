import { moduleStyles } from './shared';
import type { ModuleRendererProps } from './types';

const ROLE_LABEL: Record<'user' | 'system', string> = {
  user: 'QUERY',
  system: 'COMPUTER',
};

export function Dialogue({ instance, ir }: ModuleRendererProps) {
  const turns = ir.dialogue?.turns ?? [];

  if (turns.length === 0) {
    return null;
  }

  return (
    <section
      className="lcars-module lcars-dialogue"
      aria-label="Analysis dialogue"
      style={moduleStyles(instance.tokens)}
    >
      {turns.map((turn, index) => (
        <div key={`${turn.role}-${index}`} className="lcars-dialogue-turn" data-role={turn.role}>
          <span className="lcars-dialogue-turn__role" aria-hidden="true">
            {ROLE_LABEL[turn.role]}
          </span>
          <span className="lcars-dialogue-turn__text">{turn.text}</span>
        </div>
      ))}
    </section>
  );
}
