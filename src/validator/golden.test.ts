import { describe, expect, it } from 'vitest';
import researchAnalysis from '@/test/fixtures/golden/research-analysis.json';
import researchIdle from '@/test/fixtures/golden/research-idle.json';
import researchResult from '@/test/fixtures/golden/research-result.json';
import { validateSceneIR } from '@/validator';

describe('golden IR fixtures', () => {
  it('golden research-result still validates', () => {
    expect(validateSceneIR(researchResult, { catalog: 'default' }).ok).toBe(true);
  });

  it('golden research-analysis still validates', () => {
    expect(validateSceneIR(researchAnalysis, { catalog: 'default' }).ok).toBe(true);
  });

  it('golden research-idle still validates', () => {
    expect(validateSceneIR(researchIdle, { catalog: 'default' }).ok).toBe(true);
  });
});
