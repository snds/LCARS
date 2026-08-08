import { compileRecipe } from '@/recipes';
import { classifyIntent } from './intent';
import { fillSlots } from './fill-slots';
import { selectRecipe } from './recipe-select';
import type { PlanInput, Planner } from './types';

export class MockPlanner implements Planner {
  async plan(input: PlanInput) {
    const intent = classifyIntent(input.intent.text);
    const recipeId = selectRecipe(input.profile.role, intent, input.intent.text);
    const fill = await fillSlots(recipeId, input);
    return compileRecipe(recipeId, fill, input.profile, intent);
  }
}
