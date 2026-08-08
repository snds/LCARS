import type { Density, LegalPrimitive } from '@/constitution';
import type { RoleId } from '@/ir/types';

export type ModuleDef = {
  type: string;
  primitive: LegalPrimitive | 'composite';
  allowedRegions: Array<'rail' | 'header' | 'main' | 'mode' | 'status'>;
  allowedRoles?: RoleId[];
  allowedChildren?: string[];
  densityMax?: Density;
  requiredClearance?: string[];
};

export type ModuleCatalog = Record<string, ModuleDef>;
