import { describe, it, expect } from 'vitest';
import { densityCaps, assertLegalPrimitive, GUTTER_PX } from './geometry';

describe('geometry', () => {
  it('keeps touch floor at 44 even in dense', () => {
    expect(densityCaps('dense').minTouchPx).toBe(44);
  });

  it('rejects illegal primitive', () => {
    expect(() => assertLegalPrimitive('card')).toThrow(/illegal primitive/i);
  });

  it('uses uniform gutters per density', () => {
    expect(GUTTER_PX.standard).toBe(12);
  });
});
