import type { RoleId } from '@/ir/types';
import type { ClassifiedIntent, RecipeId } from './types';

const ENGINEERING_PATTERN =
  /\b(telemetry|diagnostic|diagnostics|eps|grid|schematic|engineering|warp|reactor|power)\b/i;
const MEDICAL_PATTERN = /\b(patient|clinical|medical|diagnosis|vitals|chart)\b/i;
const SECURITY_PATTERN = /\b(security|alert|threat|intrusion|breach|incident)\b/i;
const EXECUTIVE_PATTERN = /\b(executive|summary|decision|briefing|overview|status report)\b/i;
const RESEARCH_PATTERN = /\b(research|theory|theories|subspace|compare|summarize|evidence|citation)\b/i;

function roleDefault(role: RoleId): RecipeId {
  switch (role) {
    case 'engineer':
      return 'engineering.diagnostics';
    case 'physician':
      return 'medical.review';
    case 'security':
    case 'operations':
      return 'ops.security';
    case 'executive':
      return 'command.executive';
    case 'physicist':
    default:
      return 'research.baseline';
  }
}

export function selectRecipe(
  role: RoleId,
  intent: ClassifiedIntent,
  text: string,
): RecipeId {
  const lower = text.toLowerCase();

  if (ENGINEERING_PATTERN.test(lower)) {
    return 'engineering.diagnostics';
  }
  if (MEDICAL_PATTERN.test(lower)) {
    return 'medical.review';
  }
  if (SECURITY_PATTERN.test(lower)) {
    return 'ops.security';
  }
  if (EXECUTIVE_PATTERN.test(lower)) {
    return 'command.executive';
  }
  if (RESEARCH_PATTERN.test(lower) || intent.class === 'infoseek') {
    if (role === 'physicist' || role === 'physician') {
      return role === 'physician' ? 'medical.review' : 'research.baseline';
    }
  }

  return roleDefault(role);
}
