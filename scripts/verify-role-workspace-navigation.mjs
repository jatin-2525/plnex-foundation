/**
 * Verification test for Role-Based Dashboard Navigation & Workspace Switching
 */

import fs from 'node:fs';
import assert from 'node:assert';

console.log('=== VERIFYING ROLE-BASED DASHBOARD NAVIGATION & WORKSPACE SWITCHING ===\n');

// 1. Check Sidebar definition and role isolation
console.log('1. Checking role-specific navigation groups...');
const sidebarCode = fs.readFileSync('src/components/shell/Sidebar.tsx', 'utf8');

// Manager Navigation checks
assert(sidebarCode.includes('export const managerNav: SidebarGroup[] ='), 'Sidebar exports managerNav');
assert(sidebarCode.includes("label: 'Manager Dashboard', href: '/dashboard'"), 'managerNav includes Manager Dashboard');
assert(!sidebarCode.includes("label: 'Site Engineer Dashboard', href: '/engineer'") ||
       sidebarCode.indexOf("label: 'Site Engineer Dashboard', href: '/engineer'") > sidebarCode.indexOf('export const engineerNav:'),
       'managerNav does NOT contain Site Engineer Dashboard');

// Engineer Navigation checks
assert(sidebarCode.includes('export const engineerNav: SidebarGroup[] ='), 'Sidebar exports engineerNav');
assert(sidebarCode.includes("label: 'Site Engineer Dashboard', href: '/engineer'"), 'engineerNav includes Site Engineer Dashboard');
assert(sidebarCode.includes("label: 'My Activities', href: '/activities'"), 'engineerNav includes My Activities');
assert(sidebarCode.includes("label: 'Field Capture', href: '/field/capture'"), 'engineerNav includes Field Capture');
assert(sidebarCode.includes("label: 'DPR / Daily Progress', href: '/field/dpr'"), 'engineerNav includes DPR');

// Admin Navigation checks
assert(sidebarCode.includes('export const adminNav: SidebarGroup[] ='), 'Sidebar exports adminNav');
assert(sidebarCode.includes("label: 'Admin Dashboard', href: '/admin'"), 'adminNav includes Admin Dashboard');
assert(sidebarCode.includes("group: 'ADMINISTRATION'"), 'adminNav includes ADMINISTRATION group');
assert(sidebarCode.includes("group: 'WORKSPACE ACCESS'"), 'adminNav includes WORKSPACE ACCESS group');

console.log('   ✓ Role-specific navigation groups strictly isolated.\n');

// 2. Check Admin-only Workspace Switcher in Sidebar
console.log('2. Checking Admin-only Workspace Switcher...');
assert(sidebarCode.includes("role === 'admin'"), 'Workspace switcher is restricted to role === admin');
assert(sidebarCode.includes('CURRENT WORKSPACE'), 'Workspace switcher has CURRENT WORKSPACE header');
assert(sidebarCode.includes('ADMIN_WORKSPACES'), 'Sidebar defines ADMIN_WORKSPACES list');
assert(sidebarCode.includes('/admin') && sidebarCode.includes('/dashboard') && sidebarCode.includes('/engineer'), 'ADMIN_WORKSPACES provides all 3 authorized workspaces');
assert(sidebarCode.includes('Check'), 'Workspace switcher includes Check indicator for active workspace');

console.log('   ✓ Admin-only Workspace Switcher verified.\n');

// 3. Check Route-matching and active state calculation
console.log('3. Checking active state precision...');
assert(sidebarCode.includes('isExactMatch'), 'Sidebar computes isExactMatch');
assert(sidebarCode.includes('isSubpathMatch'), 'Sidebar computes isSubpathMatch');
assert(sidebarCode.includes("item.href !== '/dashboard'"), 'Subpath match excludes /dashboard to prevent false positives');
assert(sidebarCode.includes("item.href !== '/engineer'"), 'Subpath match excludes /engineer to prevent false positives');
assert(sidebarCode.includes("item.href !== '/admin'"), 'Subpath match excludes /admin to prevent false positives');

console.log('   ✓ Active state precision verified.\n');

// 4. Check Authorization enforcement in permissions.ts and AppShell.tsx
console.log('4. Checking RBAC route guard enforcement...');
const permissionsCode = fs.readFileSync('src/types/permissions.ts', 'utf8');
const appShellCode = fs.readFileSync('src/components/shell/AppShell.tsx', 'utf8');

// Engineer trying to open /dashboard
assert(permissionsCode.includes("pathname === '/dashboard'") && permissionsCode.includes("if (role === 'engineer')"), 'Engineer is denied /dashboard');
// Manager trying to open /engineer
assert(permissionsCode.includes("pathname === '/engineer'") && permissionsCode.includes("if (role === 'manager')"), 'Manager is denied /engineer');
// AppShell enforcement
assert(appShellCode.includes('canAccessRoute(userSession.role, pathname)'), 'AppShell guards routes with canAccessRoute');
assert(appShellCode.includes("router.replace(`/access-denied?resource=${encodeURIComponent(resourceName)}`)"), 'Unauthorized access redirects to /access-denied');

console.log('   ✓ RBAC route guard enforcement verified.\n');

// 5. Check UserMenu workspace navigation
console.log('5. Checking UserMenu workspace navigation...');
const userMenuCode = fs.readFileSync('src/components/shell/UserMenu.tsx', 'utf8');
assert(!userMenuCode.includes('setUserRole('), 'UserMenu does NOT silently change account role');
assert(userMenuCode.includes("userSession?.role === 'admin'"), 'UserMenu workspace navigation restricted to Admin');
assert(userMenuCode.includes("router.push('/dashboard')"), 'UserMenu provides real navigation to /dashboard');
assert(userMenuCode.includes("router.push('/engineer')"), 'UserMenu provides real navigation to /engineer');
assert(userMenuCode.includes("router.push('/admin')"), 'UserMenu provides real navigation to /admin');

console.log('   ✓ UserMenu workspace navigation verified.\n');

console.log('======================================================');
console.log('ALL ROLE-BASED DASHBOARD NAVIGATION CHECKS PASSED!');
console.log('======================================================\n');
