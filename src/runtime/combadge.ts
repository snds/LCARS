import type { RoleId } from '@/ir/types';
import type { CombadgeProfile } from '@/planner/types';

export const MOCK_PROFILES: Record<RoleId, CombadgeProfile> = {
  engineer: {
    role: 'engineer',
    preferences: {
      density: 'dense',
      accentFamily: 'bluegrey',
      reduceMotion: false,
      verbosity: 'normal',
    },
    clearance: ['engineering'],
    recentWorkflow: 'engineering.diagnostics',
  },
  physician: {
    role: 'physician',
    preferences: {
      density: 'standard',
      accentFamily: 'salmon',
      reduceMotion: false,
      verbosity: 'normal',
    },
    clearance: ['medical'],
    recentWorkflow: 'medical.review',
  },
  physicist: {
    role: 'physicist',
    preferences: {
      density: 'standard',
      accentFamily: 'amber',
      reduceMotion: false,
      verbosity: 'verbose',
    },
    clearance: ['research'],
    recentWorkflow: 'research.baseline',
  },
  operations: {
    role: 'operations',
    preferences: {
      density: 'standard',
      accentFamily: 'mauve',
      reduceMotion: false,
      verbosity: 'quiet',
    },
    clearance: ['operations'],
    recentWorkflow: 'ops.security',
  },
  security: {
    role: 'security',
    preferences: {
      density: 'dense',
      accentFamily: 'bluegrey',
      reduceMotion: false,
      verbosity: 'normal',
    },
    clearance: ['security', 'operations'],
    recentWorkflow: 'ops.security',
  },
  executive: {
    role: 'executive',
    preferences: {
      density: 'sparse',
      accentFamily: 'amber',
      reduceMotion: true,
      verbosity: 'quiet',
    },
    clearance: ['command'],
    recentWorkflow: 'command.executive',
  },
};
