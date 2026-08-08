import { moduleStyles } from './shared';
import type { ModuleRendererProps } from './types';

export function ComparePanel({ instance, renderChild }: ModuleRendererProps) {
  return (
    <section
      className="lcars-module lcars-compare-panel"
      aria-label={instance.id}
      style={moduleStyles(instance.tokens)}
    >
      {(instance.children ?? []).map((childId) => (
        <div key={childId}>{renderChild(childId)}</div>
      ))}
    </section>
  );
}
