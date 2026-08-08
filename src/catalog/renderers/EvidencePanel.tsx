import { moduleStyles, type EvidencePanelProps } from './shared';
import type { ModuleRendererProps } from './types';

export function EvidencePanel({ instance }: ModuleRendererProps) {
  const props = instance.props as EvidencePanelProps;

  return (
    <section
      className="lcars-module lcars-evidence-panel"
      aria-label={props.title ?? instance.id}
      style={moduleStyles(instance.tokens)}
    >
      {props.title ? <h2>{props.title}</h2> : null}
      {props.summary ? <p>{props.summary}</p> : null}
    </section>
  );
}
