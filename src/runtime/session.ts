import type { SessionState } from '@/planner/types';

export function createSession(surfaceId: string | null = null): SessionState {
  return { surfaceId };
}

export function withSurfaceId(session: SessionState, surfaceId: string | null): SessionState {
  return { ...session, surfaceId };
}
