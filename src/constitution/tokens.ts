export type SemanticRole =
  | 'frame'
  | 'action'
  | 'data'
  | 'alert'
  | 'neutral'
  | 'ink';

export type TokenId =
  | 'frame.mauve'
  | 'frame.amber'
  | 'frame.bluegrey'
  | 'action.amber'
  | 'action.salmon'
  | 'action.mauve'
  | 'data.mauve'
  | 'data.bluegrey'
  | 'data.amber'
  | 'alert.orange'
  | 'neutral.black'
  | 'neutral.gutter'
  | 'ink.onFill'
  | 'ink.onBlack';

export type TokenDef = { hex: string; role: SemanticRole };

export const TOKENS: Record<TokenId, TokenDef> = {
  'frame.mauve': { hex: '#CC99CC', role: 'frame' },
  'frame.amber': { hex: '#FFCC66', role: 'frame' },
  'frame.bluegrey': { hex: '#9999FF', role: 'frame' },
  'action.amber': { hex: '#FFCC66', role: 'action' },
  'action.salmon': { hex: '#FF6666', role: 'action' },
  'action.mauve': { hex: '#CC6699', role: 'action' },
  'data.mauve': { hex: '#994466', role: 'data' },
  'data.bluegrey': { hex: '#141452', role: 'data' },
  'data.amber': { hex: '#CC7700', role: 'data' },
  // Brightened so ink.onFill clears bodyLabel APCA Lc≥75 + WCAG AA (classic #FF3300 fails Lc).
  'alert.orange': { hex: '#FFCC33', role: 'alert' },
  'neutral.black': { hex: '#000000', role: 'neutral' },
  'neutral.gutter': { hex: '#000000', role: 'neutral' },
  'ink.onFill': { hex: '#000000', role: 'ink' },
  'ink.onBlack': { hex: '#FFCC99', role: 'ink' },
};

export function tokensToCssVars(tokens: Record<TokenId, TokenDef>): string {
  const lines = Object.entries(tokens).map(([id, def]) => {
    const variableName = `--lcars-${id.replace(/\./g, '-')}`;
    return `  ${variableName}: ${def.hex};`;
  });
  return `:root {\n${lines.join('\n')}\n}\n`;
}

export function cssVar(id: TokenId): string {
  return `var(--lcars-${id.replace(/\./g, '-')})`;
}
