import { resolveDensity, shellModules, STANDARD_REGIONS } from '@/recipes/shared';
import { applyPatch } from '@/ir/patches';
import type { RoleId, SceneIR, ScenePatch } from '@/ir/types';
import type { CombadgeProfile, Planner, SessionState } from '@/planner/types';
import type { Issue, ValidationResult } from '@/validator';
import { markValidatedSceneIR } from '@/validator/mark';
import { validateSceneIR } from '@/validator';
import { stripComputerPrefix } from './aperture';
import { MOCK_PROFILES } from './combadge';
import { createSession, withSurfaceId } from './session';

export type RuntimeState = {
  ir: SceneIR;
  profile: CombadgeProfile;
  session: SessionState;
  voiceDegraded: boolean;
};

export type RuntimeDeps = {
  planner: Planner;
  initialRole?: RoleId;
};

type Listener = () => void;

function idleShell(profile: CombadgeProfile): SceneIR {
  return {
    version: 1,
    surfaceId: profile.recentWorkflow ?? 'research.baseline',
    role: profile.role,
    density: resolveDensity(profile),
    intent: { class: 'infoseek', raw: '', analysisNeedsDialogue: false },
    regions: STANDARD_REGIONS,
    modules: shellModules(profile).map((module) =>
      module.type === 'statusRail'
        ? { ...module, props: { ...module.props, state: 'idle', label: 'READY' } }
        : module,
    ),
    focus: { aperture: true },
    a11y: { title: `${profile.role} workspace` },
    surfaceState: 'idle',
  };
}

function workingShell(current: SceneIR): SceneIR {
  return {
    ...current,
    surfaceState: 'working',
    modules: current.modules.map((module) =>
      module.type === 'statusRail'
        ? { ...module, props: { ...module.props, state: 'working', label: 'WORKING' } }
        : module,
    ),
    a11y: { ...current.a11y, liveMessage: 'Working' },
  };
}

function errorShell(current: SceneIR, issues: Issue[]): SceneIR {
  const message = issues.map((issue) => issue.message).join('; ') || 'Validation failed';
  return {
    ...current,
    surfaceState: 'error',
    modules: current.modules.map((module) =>
      module.type === 'statusRail'
        ? { ...module, props: { ...module.props, state: 'error', label: 'ERROR' } }
        : module,
    ),
    a11y: { ...current.a11y, liveMessage: message },
  };
}

function degradedShell(current: SceneIR): SceneIR {
  return {
    ...current,
    surfaceState: 'degraded',
    focus: { ...current.focus, aperture: true, moduleId: 'aperture' },
    a11y: { ...current.a11y, liveMessage: 'Voice unavailable. Use typed command aperture.' },
  };
}

function withRepair(result: ValidationResult, clearance: string[]): ValidationResult {
  if (result.ok === true) {
    return result;
  }
  if (result.repaired) {
    return validateSceneIR(result.repaired, { catalog: 'default', clearance });
  }
  return result;
}

function validateForMount(ir: SceneIR, clearance: string[]): SceneIR | null {
  const result = withRepair(validateSceneIR(ir, { catalog: 'default', clearance }), clearance);
  if (result.ok === false) {
    return null;
  }
  return markValidatedSceneIR(result.ir);
}

export function createRuntime(deps: RuntimeDeps) {
  const listeners = new Set<Listener>();
  let profile = MOCK_PROFILES[deps.initialRole ?? 'physicist'];
  let session = createSession(profile.recentWorkflow);
  let voiceDegraded = false;

  let ir = validateForMount(idleShell(profile), profile.clearance);
  if (!ir) {
    throw new Error('Initial idle shell failed validation');
  }

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setIR = (next: SceneIR) => {
    const validated = validateForMount(next, profile.clearance);
    if (validated) {
      ir = validated;
      notify();
    }
  };

  const getState = (): RuntimeState => ({ ir, profile, session, voiceDegraded });

  return {
    getState,
    getIR: () => ir,
    getProfile: () => profile,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setRole(role: RoleId) {
      profile = MOCK_PROFILES[role];
      session = withSurfaceId(session, profile.recentWorkflow);
      voiceDegraded = false;
      const next = validateForMount(idleShell(profile), profile.clearance);
      if (next) {
        ir = next;
        notify();
      }
    },
    applyUserPatch(patch: ScenePatch) {
      setIR(applyPatch(ir, patch));
    },
    markVoiceDegraded() {
      voiceDegraded = true;
      setIR(degradedShell(ir));
    },
    async submitIntent(text: string, source: 'typed' | 'voice') {
      const normalized = stripComputerPrefix(text);
      if (!normalized) {
        return;
      }

      setIR(workingShell(ir));

      const planned = await deps.planner.plan({
        profile,
        intent: { text: normalized, source },
        session,
      });

      const result = withRepair(
        validateSceneIR(planned, { catalog: 'default', clearance: profile.clearance }),
        profile.clearance,
      );

      if (result.ok === false) {
        const error = validateForMount(errorShell(ir, result.issues), profile.clearance);
        if (error) {
          ir = error;
          notify();
        }
        return;
      }

      session = withSurfaceId(session, result.ir.surfaceId);
      ir = markValidatedSceneIR({ ...result.ir, surfaceState: 'result' });
      notify();
    },
  };
}

export { workingShell, errorShell, idleShell };
