import { contrastPair, TOKENS, type TokenId } from '@/constitution';
import type { SceneIR } from '@/ir/types';
import type { Issue } from './validate';

const TOKEN_IDS = Object.keys(TOKENS) as TokenId[];

function nearestLegalTokens(fill: string, ink: string): { fill: TokenId; ink: TokenId } {
  const legalFill = TOKEN_IDS.includes(fill as TokenId) ? (fill as TokenId) : 'neutral.black';
  const legalInk = TOKEN_IDS.includes(ink as TokenId) ? (ink as TokenId) : 'ink.onBlack';
  if (contrastPair(legalInk, legalFill, 'bodyLabel').ok) {
    return { fill: legalFill, ink: legalInk };
  }
  const candidate = TOKEN_IDS.find((token) => contrastPair(token, legalFill, 'bodyLabel').ok);
  return candidate ? { fill: legalFill, ink: candidate } : { fill: 'neutral.black', ink: 'ink.onBlack' };
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
