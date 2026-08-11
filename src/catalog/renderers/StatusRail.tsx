import { usePrefersReducedMotion } from '@/app/usePrefersReducedMotion';
import { moduleStyles, type StatusRailProps } from './shared';
import type { ModuleRendererProps } from './types';

export function StatusRail({ instance }: ModuleRendererProps) {
  const props = instance.props as StatusRailProps;
  const reducedMotion = usePrefersReducedMotion();
  const isWorking = props.state === 'working' && !reducedMotion;
  const label = props.label ?? props.state ?? '';

  return (
    <div
      className={`lcars-module lcars-status-rail${isWorking ? ' lcars-status-rail--working' : ''}`}
      role="status"
      aria-live="polite"
      style={moduleStyles(instance.tokens)}
    >
      {label}
    </div>
  );
}
