import type { SceneIR } from '@/ir/types';
import type { ClassifiedIntent, CombadgeProfile, RecipeId, SlotFill } from '@/planner/types';
import * as engineering from './engineering';
import * as executive from './executive';
import * as medical from './medical';
import * as opsSecurity from './ops-security';
import * as research from './research';

export function compileRecipe(
  recipeId: RecipeId,
  fill: SlotFill,
  profile: CombadgeProfile,
  intent: ClassifiedIntent,
): SceneIR {
  switch (recipeId) {
    case 'research.baseline':
      return research.compile(fill, profile, intent);
    case 'engineering.diagnostics':
      return engineering.compile(fill, profile, intent);
    case 'medical.review':
      return medical.compile(fill, profile, intent);
    case 'ops.security':
      return opsSecurity.compile(fill, profile, intent);
    case 'command.executive':
      return executive.compile(fill, profile, intent);
    default: {
      const _exhaustive: never = recipeId;
      return _exhaustive;
    }
  }
}

export type { RecipeId, SlotFill } from '@/planner/types';
