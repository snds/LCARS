import { moduleStyles, type DataBlockProps } from './shared';
import type { ModuleRendererProps } from './types';

export function DataBlock({ instance }: ModuleRendererProps) {
  const props = instance.props as DataBlockProps;

  return (
    <section
      className="lcars-module lcars-data-block"
      aria-label={props.title ?? instance.id}
      style={moduleStyles(instance.tokens)}
    >
      {props.title ? <h2>{props.title}</h2> : null}
      {props.value ? <p>{props.value}</p> : null}
    </section>
  );
}
