import { describe, expect, it } from 'vitest';
import { APCA_FLOORS, contrastPair } from './contrast';

describe('contrastPair', () => {
  it('ink.onFill on action.amber clears bodyLabel APCA + AA', () => {
    const r = contrastPair('ink.onFill', 'action.amber', 'bodyLabel');
    expect(r.apcaLc).toBeGreaterThanOrEqual(APCA_FLOORS.bodyLabel);
    expect(r.wcagAaPass).toBe(true);
    expect(r.ok).toBe(true);
  });

  it('rejects low-contrast illegal pair', () => {
    const r = contrastPair('data.mauve', 'frame.mauve', 'bodyLabel');
    expect(r.ok).toBe(false);
  });

  it('ink.onBlack on data.bluegrey clears bodyLabel APCA + AA', () => {
    const r = contrastPair('ink.onBlack', 'data.bluegrey', 'bodyLabel');
    expect(r.apcaLc).toBeGreaterThanOrEqual(APCA_FLOORS.bodyLabel);
    expect(r.wcagAaPass).toBe(true);
    expect(r.ok).toBe(true);
  });

  it('ink.onBlack on alert.orange clears bodyLabel APCA + AA', () => {
    const r = contrastPair('ink.onBlack', 'alert.orange', 'bodyLabel');
    expect(r.apcaLc).toBeGreaterThanOrEqual(APCA_FLOORS.bodyLabel);
    expect(r.wcagAaPass).toBe(true);
    expect(r.ok).toBe(true);
  });
});
