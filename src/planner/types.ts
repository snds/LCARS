import type { IntentClass, RoleId, SceneIR } from '@/ir/types';

export type RecipeId =
  | 'research.baseline'
  | 'engineering.diagnostics'
  | 'medical.review'
  | 'ops.security'
  | 'command.executive';

export type AccentFamily = 'mauve' | 'amber' | 'bluegrey' | 'salmon';

export type CombadgeProfile = {
  role: RoleId;
  preferences: {
    density: 'sparse' | 'standard' | 'dense';
    accentFamily: AccentFamily;
    reduceMotion: boolean;
    verbosity: 'quiet' | 'normal' | 'verbose';
  };
  clearance: string[];
  recentWorkflow: RecipeId | null;
};

export type IntentEvent = {
  source: 'typed' | 'voice';
  text: string;
};

export type SessionState = {
  surfaceId: string | null;
};

export type PlanInput = {
  profile: CombadgeProfile;
  intent: IntentEvent;
  session: SessionState;
};

export type ClassifiedIntent = {
  class: IntentClass;
  raw: string;
  analysisNeedsDialogue: boolean;
};

export type Planner = {
  plan(input: PlanInput): Promise<SceneIR>;
};

export type Claim = {
  id: string;
  title: string;
  confidence: number;
};

export type Evidence = {
  id: string;
  source: string;
  excerpt: string;
};

export type Citation = {
  id: string;
  label: string;
  url?: string;
};

export type SlotFill = {
  claims?: Claim[];
  evidence?: Evidence[];
  citations?: Citation[];
  summary?: string;
  telemetry?: Array<{ label: string; value: string }>;
  alerts?: Array<{ level: string; message: string }>;
  actions?: Array<{ label: string; id: string }>;
};
