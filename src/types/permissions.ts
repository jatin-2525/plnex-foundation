export type UserRole = 'admin' | 'manager' | 'engineer' | 'viewer';

export type Permission =
  | 'plan:read'
  | 'plan:write'
  | 'plan:import'
  | 'field:read'
  | 'field:write'
  | 'field:capture'
  | 'extract:read'
  | 'match:read'
  | 'match:override'
  | 'verify:read'
  | 'verify:approve'
  | 'verify:reject'
  | 'update:read'
  | 'update:commit'
  | 'variance:read'
  | 'variance:simulate'
  | 'impact:read'
  | 'action:read'
  | 'action:create'
  | 'evidence:read'
  | 'evidence:upload'
  | 'audit:read'
  | 'project:manage'
  | 'project:read'
  | 'settings:manage';

export const ALL_PERMISSIONS: Permission[] = [
  'plan:read',
  'plan:write',
  'plan:import',
  'field:read',
  'field:write',
  'field:capture',
  'extract:read',
  'match:read',
  'match:override',
  'verify:read',
  'verify:approve',
  'verify:reject',
  'update:read',
  'update:commit',
  'variance:read',
  'variance:simulate',
  'impact:read',
  'action:read',
  'action:create',
  'evidence:read',
  'evidence:upload',
  'audit:read',
  'project:manage',
  'project:read',
  'settings:manage',
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [...ALL_PERMISSIONS],
  manager: [
    'plan:read',
    'plan:write',
    'plan:import',
    'field:read',
    'extract:read',
    'match:read',
    'match:override',
    'verify:read',
    'verify:approve',
    'verify:reject',
    'update:read',
    'update:commit',
    'variance:read',
    'variance:simulate',
    'impact:read',
    'action:read',
    'action:create',
    'evidence:read',
    'audit:read',
    'project:manage',
    'project:read',
  ],
  engineer: [
    'plan:read',
    'field:read',
    'field:write',
    'field:capture',
    'extract:read',
    'match:read',
    'verify:read',
    'update:read',
    'variance:read',
    'evidence:read',
    'evidence:upload',
    'project:read',
  ],
  viewer: [
    'plan:read',
    'field:read',
    'extract:read',
    'match:read',
    'verify:read',
    'update:read',
    'variance:read',
    'impact:read',
    'action:read',
    'evidence:read',
    'audit:read',
    'project:read',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}
