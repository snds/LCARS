import { describe, expect, it } from 'vitest';
import { validateSceneIR } from '@/validator';
import { MockPlanner } from './mock-planner';

describe('MockPlanner', () => {
  it('physicist research intent yields valid research surface', async () => {
    const planner = new MockPlanner();
    const ir = await planner.plan({
      profile: {
        role: 'physicist',
        preferences: {
          density: 'standard',
          accentFamily: 'mauve',
          reduceMotion: false,
          verbosity: 'normal',
        },
        clearance: ['research'],
        recentWorkflow: 'research.baseline',
      },
      intent: { source: 'typed', text: 'summarize subspace theories' },
      session: { surfaceId: null },
    });
    const v = validateSceneIR(ir, { catalog: 'default' });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.ir.surfaceId).toBe('research.baseline');
      expect(v.ir.modules.some((m) => m.type === 'claimList')).toBe(true);
    }
  });

  it('engineer bias prefers engineering recipe on diagnostics language', async () => {
    const planner = new MockPlanner();
    const ir = await planner.plan({
      profile: {
        role: 'engineer',
        preferences: {
          density: 'dense',
          accentFamily: 'amber',
          reduceMotion: false,
          verbosity: 'normal',
        },
        clearance: ['engineering'],
        recentWorkflow: null,
      },
      intent: { source: 'typed', text: 'show EPS grid telemetry' },
      session: { surfaceId: null },
    });
    expect(ir.surfaceId).toBe('engineering.diagnostics');
  });
});
