import type { Role } from './roles';

const hierarchy: Role[] = ['support', 'analyst', 'dev', 'admin', 'owner'];

export function canAccess(required: Role | Role[], actual: Role): boolean {
  const list = Array.isArray(required) ? required : [required];
  const actualIndex = hierarchy.indexOf(actual);
  return list.some((role) => actualIndex >= hierarchy.indexOf(role));
}
