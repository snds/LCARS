import { describe, expect, it } from 'vitest';
import { TOKENS, tokensToCssVars } from './tokens';

describe('TOKENS', () => {
  it('exposes required semantic families', () => {
    const ids = Object.keys(TOKENS);
    for (const prefix of ['frame.', 'action.', 'data.', 'alert.', 'neutral.']) {
      expect(ids.some((id) => id.startsWith(prefix))).toBe(true);
    }
    expect(TOKENS['ink.onFill']).toBeDefined();
    expect(TOKENS['ink.onBlack']).toBeDefined();
  });

  it('emits CSS variables without raw hex in selectors', () => {
    const css = tokensToCssVars(TOKENS);
    expect(css).toContain('--lcars-action-amber:');
    expect(css.startsWith(':root')).toBe(true);
  });
});
