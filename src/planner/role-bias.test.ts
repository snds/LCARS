import { describe, expect, it } from 'vitest';
import { RoleIdSchema } from '@/ir/schema';
import { MOCK_PROFILES } from '@/runtime/combadge';
import { validateSceneIR } from '@/validator';
import { MockPlanner } from './mock-planner';

describe('role-bias matrix', () => {
  const planner = new MockPlanner();
  const query = 'summarize subspace theories';

  it('physicist and engineer both legal but role-biased', async () => {
    const p = await planner.plan({
      profile: MOCK_PROFILES.physicist,
      intent: { source: 'typed', text: query },
      session: { surfaceId: null },
    });
    const e = await planner.plan({
      profile: MOCK_PROFILES.engineer,
      intent: { source: 'typed', text: query },
      session: { surfaceId: null },
    });
    expect(validateSceneIR(p, { catalog: 'default' }).ok).toBe(true);
    expect(validateSceneIR(e, { catalog: 'default' }).ok).toBe(true);
    expect(p.role).toBe('physicist');
    expect(e.role).toBe('engineer');
    expect(p.density).not.toBe(e.density);
  });

  it('each recipe compiles valid IR for its default role', async () => {
    for (const role of RoleIdSchema.options) {
      const ir = await planner.plan({
        profile: MOCK_PROFILES[role],
        intent: { source: 'typed', text: 'status' },
        session: { surfaceId: null },
      });
      const v = validateSceneIR(ir, { catalog: 'default' });
      expect(v.ok, `${role} ${ir.surfaceId} failed validation`).toBe(true);
    }
  });
});
