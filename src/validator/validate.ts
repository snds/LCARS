import { contrastPair, densityCaps, LEGAL_PRIMITIVES, TOKENS } from '@/constitution';
import { DEFAULT_CATALOG } from '@/catalog/modules';
import type { ModuleCatalog } from '@/catalog/types';
import { SceneIRSchema } from '@/ir/schema';
import type { Density, SceneIR } from '@/ir/types';
import { validateViewportBinding } from '@/models3d/registry';
import { markValidatedSceneIR } from './mark';
import { repairSceneIR } from './repair';

export type Issue = {
  code: string;
  message: string;
  moduleId?: string;
};

export type ValidateCtx = {
  catalog: 'default' | ModuleCatalog;
  clearance?: string[];
};

export type ValidationResult =
  | { ok: true; ir: SceneIR }
  | { ok: false; issues: Issue[]; repaired?: SceneIR };

const densityRank: Record<Density, number> = { sparse: 0, standard: 1, dense: 2 };

function resolveCatalog(catalog: ValidateCtx['catalog']): ModuleCatalog {
  return catalog === 'default' ? DEFAULT_CATALOG : catalog;
}

function hasOwn(object: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function validateSceneIR(input: unknown, ctx: ValidateCtx): ValidationResult {
  const parsed = SceneIRSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, issues: [{ code: 'schema', message: parsed.error.message }] };
  }

  const ir = parsed.data;
  const catalog = resolveCatalog(ctx.catalog);
  const issues: Issue[] = [];
  const regions = new Map(ir.regions.map((region) => [region.id, region.kind]));
  const modulesById = new Map(ir.modules.map((module) => [module.id, module]));
  const definitions = new Map(ir.modules.map((module) => [module.id, catalog[module.type]]));

  // 2. Module types must be registered before any catalog-derived checks run.
  for (const module of ir.modules) {
    if (!definitions.get(module.id)) {
      issues.push({ code: 'module-type', message: `Unknown module type: ${module.type}`, moduleId: module.id });
    }
  }

  // 3. Validate parent-child relationships scene-wide.
  for (const module of ir.modules) {
    const definition = definitions.get(module.id);
    if (!definition) continue;
    for (const childId of module.children ?? []) {
      const child = modulesById.get(childId);
      if (!child || !definition.allowedChildren?.includes(child.type)) {
        issues.push({ code: 'parent-child', message: `Illegal child ${childId} for ${module.type}`, moduleId: module.id });
      }
    }
  }

  // 4. Validate each registered module's catalog geometry grammar.
  for (const module of ir.modules) {
    const definition = definitions.get(module.id);
    if (!definition) continue;
    if (definition.primitive !== 'composite' && !LEGAL_PRIMITIVES.includes(definition.primitive)) {
      issues.push({ code: 'geometry', message: `Illegal primitive: ${definition.primitive}`, moduleId: module.id });
    }
  }

  // 5. Token references must be legal before contrast is evaluated.
  const hasLegalTokens = new Map<string, boolean>();
  for (const module of ir.modules) {
    const tokenIds = [module.tokens.fill, module.tokens.ink, module.tokens.accent].filter(
      (token): token is string => token !== undefined,
    );
    const valid = tokenIds.every((token) => hasOwn(TOKENS, token));
    hasLegalTokens.set(module.id, valid);
    if (!valid) {
      issues.push({ code: 'token', message: `Unknown token on ${module.id}`, moduleId: module.id });
    }
  }

  // 6. All declared ink/fill pairs must clear APCA and WCAG AA.
  for (const module of ir.modules) {
    if (
      hasLegalTokens.get(module.id) &&
      !contrastPair(module.tokens.ink as keyof typeof TOKENS, module.tokens.fill as keyof typeof TOKENS, 'bodyLabel').ok
    ) {
      issues.push({ code: 'contrast', message: `Illegal ink/fill contrast on ${module.id}`, moduleId: module.id });
    }
  }

  // 7. Check touch minima and focus order together.
  for (const module of ir.modules) {
    const touchPx = module.props.touchPx;
    if (touchPx !== undefined && (typeof touchPx !== 'number' || touchPx < densityCaps(ir.density).minTouchPx)) {
      issues.push({ code: 'touch', message: `Touch target on ${module.id} is below minimum`, moduleId: module.id });
    }
  }
  if (ir.focus.moduleId && !modulesById.has(ir.focus.moduleId)) {
    issues.push({ code: 'focus', message: `Focus module does not exist: ${ir.focus.moduleId}` });
  }

  // 8. Enforce scene and per-module density caps.
  if (ir.modules.length > densityCaps(ir.density).maxModules) {
    issues.push({ code: 'density', message: `Module count exceeds ${ir.density} density cap` });
  }
  for (const module of ir.modules) {
    const definition = definitions.get(module.id);
    if (!definition) continue;
    if (definition.densityMax && densityRank[ir.density] > densityRank[definition.densityMax]) {
      issues.push({ code: 'density', message: `${module.type} exceeds its density cap`, moduleId: module.id });
    }
  }

  // 9. Validate region, role, and clearance eligibility.
  for (const module of ir.modules) {
    const definition = definitions.get(module.id);
    if (!definition) continue;
    const regionKind = regions.get(module.regionId);
    if (!regionKind || !definition.allowedRegions.includes(regionKind)) {
      issues.push({ code: 'region', message: `Module ${module.type} is illegal in region ${module.regionId}`, moduleId: module.id });
    }
    if (definition.allowedRoles && !definition.allowedRoles.includes(ir.role)) {
      issues.push({ code: 'role', message: `${module.type} is not allowed for ${ir.role}`, moduleId: module.id });
    }
    if (definition.requiredClearance?.some((clearance) => !ctx.clearance?.includes(clearance))) {
      issues.push({ code: 'clearance', message: `Insufficient clearance for ${module.type}`, moduleId: module.id });
    }
  }

  // 10. Verify viewport3d bindings last.
  for (const module of ir.modules) {
    if (module.type !== 'viewport3d') continue;
    const message = validateViewportBinding(module.binding);
    if (message) {
      issues.push({ code: 'viewport3d', message, moduleId: module.id });
    }
  }

  if (issues.length > 0) {
    const repaired = repairSceneIR(ir, issues);
    return { ok: false, issues, ...(repaired ? { repaired } : {}) };
  }
  return { ok: true, ir: markValidatedSceneIR(ir) };
}
