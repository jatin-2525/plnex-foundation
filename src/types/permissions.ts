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

export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'manager':
      return '/dashboard';
    case 'engineer':
      return '/engineer';
    case 'admin':
      return '/admin';
    default:
      return '/login';
  }
}

export function getResourceName(pathname: string): string {
  if (pathname === '/dashboard') return 'Manager Dashboard';
  if (pathname === '/engineer') return 'Engineer Dashboard';
  if (pathname === '/activities') return 'My Activities';
  if (pathname.startsWith('/admin')) return 'Admin Dashboard & Governance';
  if (pathname === '/what-if') return 'What-if Simulator';
  if (pathname === '/review') return 'Review Queue';
  if (pathname === '/health') return 'Schedule Health & Data Quality';
  if (pathname === '/reports') return 'Reports & Project Memory';
  if (pathname === '/schedule') return 'Master Schedule';
  if (pathname === '/schedule-twin') return 'Schedule Twin';
  if (pathname.startsWith('/projects')) return 'Projects Portfolio';
  if (pathname === '/progress') return 'Progress & Variance';
  if (pathname === '/risks') return 'Risks & Dependencies';
  if (pathname === '/variance') return 'Delay & Impact';
  if (pathname.startsWith('/field')) return 'Field Operations & DPR';
  if (pathname === '/evidence') return 'Evidence & Audit';
  if (pathname === '/execution') return 'Execution Intelligence';
  if (pathname === '/sync') return 'Offline / Sync Center';
  return pathname;
}

export function canAccessRoute(role: UserRole, rawPathname: string): boolean {
  const pathname = (rawPathname && rawPathname.length > 1 && rawPathname.endsWith('/'))
    ? rawPathname.slice(0, -1)
    : (rawPathname || '/');

  // Public routes
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/access-denied'
  ) {
    return true;
  }

  // Admin has access to all routes
  if (role === 'admin') {
    return true;
  }

  // Manager permissions
  if (role === 'manager') {
    // Explicitly denied routes for Manager
    if (
      pathname === '/engineer' ||
      pathname.startsWith('/admin')
    ) {
      return false;
    }
    // Allowed routes for Manager
    if (
      pathname === '/dashboard' ||
      pathname === '/activities' ||
      pathname.startsWith('/field') ||
      pathname.startsWith('/projects') ||
      pathname === '/schedule' ||
      pathname === '/schedule-twin' ||
      pathname === '/execution' ||
      pathname === '/review' ||
      pathname === '/progress' ||
      pathname === '/risks' ||
      pathname === '/what-if' ||
      pathname === '/variance' ||
      pathname === '/evidence' ||
      pathname === '/health' ||
      pathname === '/reports' ||
      pathname === '/sync'
    ) {
      return true;
    }
    return false;
  }

  // Site Engineer permissions
  if (role === 'engineer') {
    // Explicitly denied routes for Engineer
    if (pathname.startsWith('/admin')) {
      return false;
    }
    // Allowed routes for Engineer
    if (
      pathname === '/engineer' ||
      pathname === '/dashboard' ||
      pathname === '/activities' ||
      pathname.startsWith('/field') ||
      pathname.startsWith('/projects') ||
      pathname === '/schedule' ||
      pathname === '/schedule-twin' ||
      pathname === '/execution' ||
      pathname === '/review' ||
      pathname === '/progress' ||
      pathname === '/risks' ||
      pathname === '/what-if' ||
      pathname === '/variance' ||
      pathname === '/evidence' ||
      pathname === '/health' ||
      pathname === '/reports' ||
      pathname === '/sync'
    ) {
      return true;
    }
    return false;
  }

  return false;
}
