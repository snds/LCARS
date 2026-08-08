import { contrastPair, TOKENS, type SemanticRole, type TokenId } from '@/constitution';
import type { SceneIR } from '@/ir/types';
import type { Issue } from './validate';

const TOKEN_IDS = Object.keys(TOKENS) as TokenId[];
const FILL_ROLES = new Set<SemanticRole>(['frame', 'action', 'data', 'alert', 'neutral']);
const INK_TOKENS = TOKEN_IDS.filter((token) => TOKENS[token].role === 'ink');
const FILL_TOKENS = TOKEN_IDS.filter((token) => FILL_ROLES.has(TOKENS[token].role));

function nearestLegalTokens(fill: string, ink: string): { fill: TokenId; ink: TokenId } {
  const preferredFill = FILL_TOKENS.includes(fill as TokenId) ? (fill as TokenId) : undefined;
  const preferredInk = INK_TOKENS.includes(ink as TokenId) ? (ink as TokenId) : undefined;
  const fillCandidates = preferredFill ? [preferredFill, ...FILL_TOKENS.filter((token) => token !== preferredFill)] : FILL_TOKENS;
  const inkCandidates = preferredInk ? [preferredInk, ...INK_TOKENS.filter((token) => token !== preferredInk)] : INK_TOKENS;

  // V1 heuristic: retain valid semantic choices where possible, then use the first
  // fill/ink pair that clears body-label APCA and WCAG AA. It is not chromatic nearest.
  for (const fillCandidate of fillCandidates) {
    for (const inkCandidate of inkCandidates) {
      if (contrastPair(inkCandidate, fillCandidate, 'bodyLabel').ok) {
        return { fill: fillCandidate, ink: inkCandidate };
      }
    }
  }

  return { fill: 'neutral.black', ink: 'ink.onBlack' };
}

export function repairSceneIR(ir: SceneIR, issues: Issue[]): SceneIR | null {
  const schemaIssue = issues.some((issue) => issue.code === 'schema');
  if (schemaIssue) return null;

  const removable = new Set(
    issues
      .filter((issue) => ['module-type', 'parent-child', 'geometry', 'region'].includes(issue.code))
      .flatMap((issue) => (issue.moduleId ? [issue.moduleId] : [])),
  );
  const unrepaired = issues.some(
    (issue) =>
      !['module-type', 'parent-child', 'geometry', 'region', 'token', 'contrast', 'focus'].includes(
        issue.code,
      ),
  );
  if (unrepaired) return null;

  const repairedModules = ir.modules
    .filter((module) => !removable.has(module.id))
    .map((module) => {
      const hasTokenIssue = issues.some(
        (issue) => issue.moduleId === module.id && ['token', 'contrast'].includes(issue.code),
      );
      if (!hasTokenIssue) return module;
      const tokens = nearestLegalTokens(module.tokens.fill, module.tokens.ink);
      return { ...module, tokens: { ...module.tokens, ...tokens } };
    })
    .map((module) => ({
      ...module,
      children: module.children?.filter((childId) => !removable.has(childId)),
    }));

  const focusModuleExists = repairedModules.some((module) => module.id === ir.focus.moduleId);
  return {
    ...ir,
    modules: repairedModules,
    focus: focusModuleExists ? ir.focus : { ...ir.focus, moduleId: undefined },
  };
}
