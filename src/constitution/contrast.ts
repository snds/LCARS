import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { TOKENS, type TokenId } from './tokens';

export type ContrastUse = 'largeDisplay' | 'bodyLabel' | 'nonText';

export const APCA_FLOORS: Record<ContrastUse, number> = {
  largeDisplay: 60,
  bodyLabel: 75,
  nonText: 45,
};

export const WCAG_FLOORS: Record<ContrastUse, number> = {
  largeDisplay: 3,
  bodyLabel: 4.5,
  nonText: 3,
};

export type ContrastReport = {
  fg: TokenId;
  bg: TokenId;
  use: ContrastUse;
  apcaLc: number;
  wcagRatio: number;
  wcagAaPass: boolean;
  ok: boolean;
};

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [red, green, blue] = [r, g, b].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function wcagRatio(fg: string, bg: string): number {
  const foreground = relativeLuminance(hexToRgb(fg));
  const background = relativeLuminance(hexToRgb(bg));
  return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
}

export function contrastPair(
  fg: TokenId,
  bg: TokenId,
  use: ContrastUse,
): ContrastReport {
  const foreground = TOKENS[fg].hex;
  const background = TOKENS[bg].hex;
  const apcaLc = Math.abs(
    Number(APCAcontrast(sRGBtoY(hexToRgb(foreground)), sRGBtoY(hexToRgb(background)))),
  );
  const ratio = wcagRatio(foreground, background);
  const wcagAaPass = ratio >= WCAG_FLOORS[use];
  const ok = apcaLc >= APCA_FLOORS[use] && wcagAaPass;

  return { fg, bg, use, apcaLc, wcagRatio: ratio, wcagAaPass, ok };
}

export function assertLegalPair(fg: TokenId, bg: TokenId, use: ContrastUse): void {
  const report = contrastPair(fg, bg, use);
  if (!report.ok) {
    throw new Error(
      `Illegal contrast ${fg} on ${bg} for ${use}: Lc=${report.apcaLc.toFixed(1)} ratio=${report.wcagRatio.toFixed(2)}`,
    );
  }
}
