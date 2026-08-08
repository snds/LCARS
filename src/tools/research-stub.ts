import type { RecipeId } from '@/planner/types';
import type { CombadgeProfile, SlotFill } from '@/planner/types';

export async function fetchResearchStub(
  recipeId: RecipeId,
  query: string,
  profile: CombadgeProfile,
): Promise<SlotFill> {
  const baseClaims = [
    { id: 'c1', title: 'Subspace field harmonics remain stable under warp 7', confidence: 0.91 },
    { id: 'c2', title: 'Tachyon interference patterns correlate with theory divergence', confidence: 0.78 },
  ];

  const baseEvidence = [
    {
      id: 'e1',
      source: 'Astrometrics Archive',
      excerpt: 'Comparative analysis of warp field equations across three canonical models.',
    },
    {
      id: 'e2',
      source: 'Sensor Logs 47219',
      excerpt: 'Repeated tachyon bursts observed during extended warp transit.',
    },
  ];

  const baseCitations = [
    { id: 'ref1', label: 'Cochrane Field Manual §12.4' },
    { id: 'ref2', label: 'Subspace Theory Compendium, Vol. III' },
  ];

  switch (recipeId) {
    case 'research.baseline':
      return {
        claims: baseClaims,
        evidence: baseEvidence,
        citations: baseCitations,
        summary: `Research summary for: ${query}`,
        actions: [
          { id: 'compare', label: 'COMPARE' },
          { id: 'export', label: 'EXPORT' },
        ],
      };

    case 'engineering.diagnostics':
      return {
        telemetry: [
          { label: 'EPS GRID A', value: '98.2%' },
          { label: 'EPS GRID B', value: '97.6%' },
          { label: 'WARP CORE', value: 'NOMINAL' },
          { label: 'COOLANT', value: '84°C' },
        ],
        summary: `Diagnostics for: ${query}`,
        actions: [
          { id: 'isolate', label: 'ISOLATE' },
          { id: 'reroute', label: 'REROUTE' },
        ],
      };

    case 'medical.review':
      return {
        claims: [
          { id: 'mc1', title: 'Vitals within nominal range', confidence: 0.95 },
          { id: 'mc2', title: 'Neural pathway activity elevated', confidence: 0.72 },
        ],
        evidence: [
          {
            id: 'me1',
            source: 'Medical Tricorder',
            excerpt: 'Patient scan completed with caution band on neural activity.',
          },
        ],
        summary: `Clinical review for: ${query}`,
        actions: [{ id: 'annotate', label: 'ANNOTATE' }],
      };

    case 'ops.security':
      return {
        alerts: [
          { level: 'watch', message: 'Perimeter sensors nominal' },
          { level: 'info', message: 'Last sweep completed 04:12 stardate' },
        ],
        telemetry: [
          { label: 'SHIELDS', value: 'ONLINE' },
          { label: 'INTRUSION', value: 'NONE' },
        ],
        actions: [{ id: 'sweep', label: 'SWEEP' }],
      };

    case 'command.executive':
      return {
        summary: profile.preferences.verbosity === 'quiet' ? 'Fleet status nominal.' : `Executive briefing: ${query}`,
        actions: [
          { id: 'approve', label: 'APPROVE' },
          { id: 'defer', label: 'DEFER' },
        ],
        telemetry: [
          { label: 'FLEET', value: 'READY' },
          { label: 'MISSION', value: 'ON TRACK' },
        ],
      };

    default:
      return { summary: query };
  }
}
