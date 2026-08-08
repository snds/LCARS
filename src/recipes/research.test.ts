import { describe, expect, it } from 'vitest';
import { MOCK_PROFILES } from '@/runtime/combadge';
import { MockPlanner } from '@/planner/mock-planner';
import { validateSceneIR } from '@/validator';

describe('research.baseline hero workflow', () => {
  const planner = new MockPlanner();

  it('analysis intent includes dialogue module', async () => {
    const ir = await planner.plan({
      profile: MOCK_PROFILES.physicist,
      intent: { source: 'typed', text: 'why do these theories diverge' },
      session: { surfaceId: 'research.baseline' },
    });
    expect(ir.intent.analysisNeedsDialogue).toBe(true);
    expect(ir.modules.some((m) => m.type === 'dialogue')).toBe(true);
    expect(validateSceneIR(ir, { catalog: 'default' }).ok).toBe(true);
  });

  it('infoseek intent has no dialogue module', async () => {
    const ir = await planner.plan({
      profile: MOCK_PROFILES.physicist,
      intent: { source: 'typed', text: 'list subspace theories' },
      session: { surfaceId: null },
    });
    expect(ir.modules.some((m) => m.type === 'dialogue')).toBe(false);
  });
});
