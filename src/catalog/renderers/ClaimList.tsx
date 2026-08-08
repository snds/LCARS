import { moduleStyles } from './shared';
import type { ModuleRendererProps } from './types';

export function ClaimList({ instance, renderChild }: ModuleRendererProps) {
  return (
    <section
      className="lcars-module lcars-claim-list"
      aria-label={instance.id}
      style={moduleStyles(instance.tokens)}
    >
      {(instance.children ?? []).map((childId) => (
        <div key={childId}>{renderChild(childId)}</div>
      ))}
    </section>
  );
}
