import type { PlanInput, RecipeId, SlotFill } from './types';
import { fetchResearchStub } from '@/tools/research-stub';

export async function fillSlots(recipeId: RecipeId, input: PlanInput): Promise<SlotFill> {
  return fetchResearchStub(recipeId, input.intent.text, input.profile);
}
