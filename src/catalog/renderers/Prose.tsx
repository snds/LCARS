import { moduleStyles, type ProseProps } from './shared';
import type { ModuleRendererProps } from './types';

export function Prose({ instance }: ModuleRendererProps) {
  const props = instance.props as ProseProps;

  return (
    <article className="lcars-module lcars-prose" style={moduleStyles(instance.tokens)}>
      {props.text ? <p>{props.text}</p> : null}
    </article>
  );
}
