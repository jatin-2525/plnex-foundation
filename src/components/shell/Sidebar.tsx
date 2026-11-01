'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  ListChecks,
  Cpu,
  Sliders,
  TrendingDown,
  TrendingUp,
  Activity,
  BookOpen,
  Wifi,
  Camera,
  FileText,
  ShieldCheck,
  LayoutDashboard,
  HardHat,
  Shield,
  Users,
  Building2,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileMenuOpen?: boolean;
  onCloseMobile?: () => void;
}

interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface SidebarGroup {
  group: string;
  items: SidebarNavItem[];
}

export interface AdminWorkspaceOption {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
}

export const ADMIN_WORKSPACES: AdminWorkspaceOption[] = [
  {
    key: 'admin',
    label: 'Admin Workspace',
    href: '/admin',
    icon: Shield,
    badge: 'GOV',
  },
  {
    key: 'manager',
    label: 'Manager Workspace',
    href: '/dashboard',
    icon: LayoutDashboard,
    badge: 'MGR',
  },
  {
    key: 'engineer',
    label: 'Site Engineer Workspace',
    href: '/engineer',
    icon: HardHat,
    badge: 'ENG',
  },
];

// Role-specific navigation groups strictly isolated by persona
export const managerNav: SidebarGroup[] = [
  {
    group: 'WORKSPACE',
    items: [
      { label: 'Manager Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'PROJECT',
    items: [
      { label: 'Projects', href: '/projects', icon: FolderKanban },
      { label: 'Schedule', href: '/schedule', icon: Calendar },
      { label: 'Schedule Twin', href: '/schedule-twin', icon: Layers },
    ],
  },
  {
    group: 'EXECUTION',
    items: [
      { label: 'Execution Intelligence', href: '/execution', icon: Cpu },
      { label: 'Review Queue', href: '/review', icon: ShieldCheck, badge: 3 },
      { label: 'Progress & Variance', href: '/progress', icon: TrendingUp },
    ],
  },
  {
    group: 'INTELLIGENCE',
    items: [
      { label: 'Delay & Dependency Impact', href: '/risks', icon: TrendingDown },
      { label: 'What-if', href: '/what-if', icon: Sliders },
    ],
  },
  {
    group: 'TRUST',
    items: [
      { label: 'Evidence & Audit', href: '/evidence', icon: ShieldCheck },
      { label: 'Schedule Health', href: '/health', icon: Activity },
    ],
  },
  {
    group: 'KNOWLEDGE',
    items: [
      { label: 'Reports & Memory', href: '/reports', icon: BookOpen },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { label: 'Offline / Sync', href: '/sync', icon: Wifi },
    ],
  },
];

export const engineerNav: SidebarGroup[] = [
  {
    group: 'WORKSPACE',
    items: [
      { label: 'Site Engineer Dashboard', href: '/engineer', icon: HardHat },
      { label: 'My Activities', href: '/activities', icon: ListChecks },
    ],
  },
  {
    group: 'EXECUTION',
    items: [
      { label: 'Field Capture', href: '/field/capture', icon: Camera },
      { label: 'DPR / Daily Progress', href: '/field/dpr', icon: FileText },
      { label: 'Execution Intelligence', href: '/execution', icon: Cpu },
    ],
  },
  {
    group: 'TRUST',
    items: [
      { label: 'Evidence', href: '/evidence', icon: ShieldCheck },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { label: 'Offline / Sync', href: '/sync', icon: Wifi },
    ],
  },
];

export const adminNav: SidebarGroup[] = [
  {
    group: 'ADMINISTRATION',
    items: [
      { label: 'Admin Dashboard', href: '/admin', icon: Shield },
      { label: 'Users & Roles', href: '/admin/users', icon: Users },
      { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
    ],
  },
  {
    group: 'WORKSPACE ACCESS', // MANAGER VIEW & ENGINEER VIEW
    items: [
      { label: 'Manager Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Site Engineer Dashboard', href: '/engineer', icon: HardHat },
    ],
  },
  {
    group: 'PROJECT',
    items: [
      { label: 'Projects', href: '/projects', icon: FolderKanban },
      { label: 'Schedule', href: '/schedule', icon: Calendar },
      { label: 'Schedule Twin', href: '/schedule-twin', icon: Layers },
    ],
  },
  {
    group: 'EXECUTION',
    items: [
      { label: 'Field Capture', href: '/field/capture', icon: Camera },
      { label: 'DPR', href: '/field/dpr', icon: FileText },
      { label: 'Execution Intelligence', href: '/execution', icon: Cpu },
      { label: 'Review Queue', href: '/review', icon: ShieldCheck, badge: 3 },
    ],
  },
  {
    group: 'INTELLIGENCE',
    items: [
      { label: 'Progress & Variance', href: '/progress', icon: TrendingUp },
      { label: 'Delay & Dependency Impact', href: '/risks', icon: TrendingDown },
      { label: 'What-if', href: '/what-if', icon: Sliders },
    ],
  },
  {
    group: 'TRUST',
    items: [
      { label: 'Evidence & Audit', href: '/evidence', icon: ShieldCheck },
      { label: 'Schedule Health', href: '/health', icon: Activity },
    ],
  },
  {
    group: 'KNOWLEDGE',
    items: [
      { label: 'Reports & Memory', href: '/reports', icon: BookOpen },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { label: 'Offline / Sync', href: '/sync', icon: Wifi },
    ],
  },
];

// Canonical NAV_GROUPS compatibility export
export const NAV_GROUPS: SidebarGroup[] = adminNav;

export function Sidebar({ collapsed, onToggle, mobileMenuOpen, onCloseMobile }: SidebarProps) {
  const rawPathname = usePathname();
  const pathname = (rawPathname && rawPathname.length > 1 && rawPathname.endsWith('/'))
    ? rawPathname.slice(0, -1)
    : (rawPathname || '/');
  const { userSession } = useApp();
  const role = userSession?.role || 'manager';
  const activeNavGroups = role === 'admin' ? adminNav : role === 'engineer' ? engineerNav : managerNav;

  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setWorkspaceSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine active workspace for Admin
  const activeWorkspace =
    pathname === '/engineer'
      ? ADMIN_WORKSPACES[2]
      : pathname === '/dashboard'
      ? ADMIN_WORKSPACES[1]
      : ADMIN_WORKSPACES[0];

  return (
    <aside
      className={`fixed top-14 bottom-0 left-0 bg-white border-r border-[#D9DEE5] z-30 transition-all duration-200 flex flex-col ${
        collapsed ? 'w-16' : 'w-[248px]'
      } ${
        mobileMenuOpen
          ? 'translate-x-0'
          : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Admin-only Workspace Switcher (Only visible to privileged Admin accounts) */}
      {role === 'admin' && (
        <div ref={switcherRef} className="p-2 border-b border-[#D9DEE5] bg-[#F7F8FA]">
          {!collapsed ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#596579]">
                  CURRENT WORKSPACE
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                  {activeWorkspace.badge}
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setWorkspaceSwitcherOpen(!workspaceSwitcherOpen)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md bg-white border border-[#D9DEE5] hover:border-[#176B87] shadow-2xs text-xs font-semibold text-[#172033] transition-colors cursor-pointer"
                  aria-haspopup="true"
                  aria-expanded={workspaceSwitcherOpen}
                  title="Switch between authorized admin workspaces"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <activeWorkspace.icon className="w-3.5 h-3.5 text-[#176B87] flex-shrink-0" />
                    <span className="truncate">{activeWorkspace.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#596579] flex-shrink-0 transition-transform duration-150 ${
                      workspaceSwitcherOpen ? 'rotate-180 text-[#176B87]' : ''
                    }`}
                  />
                </button>

                {workspaceSwitcherOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 p-1 bg-white border border-[#D9DEE5] rounded-lg shadow-lg z-50 space-y-0.5">
                    {ADMIN_WORKSPACES.map((ws) => {
                      const isCurrent = activeWorkspace.key === ws.key;
                      return (
                        <Link
                          key={ws.href}
                          href={ws.href}
                          onClick={() => {
                            setWorkspaceSwitcherOpen(false);
                            if (onCloseMobile) onCloseMobile();
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors ${
                            isCurrent
                              ? 'bg-[#EDF5F8] text-[#176B87] font-bold'
                              : 'text-[#172033] hover:bg-[#F1F3F5] font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ws.icon
                              className={`w-3.5 h-3.5 flex-shrink-0 ${
                                isCurrent ? 'text-[#176B87]' : 'text-[#596579]'
                              }`}
                            />
                            <span className="truncate">{ws.label}</span>
                          </div>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-[#176B87] flex-shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1" title={`Current Workspace: ${activeWorkspace.label}`}>
              <activeWorkspace.icon className="w-4 h-4 text-[#176B87]" />
            </div>
          )}
        </div>
      )}

      {/* Workflow Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
        {activeNavGroups.map((group) => (
          <div key={group.group} className="space-y-0.5">
            {!collapsed && (
              <h4 className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#596579] select-none">
                {group.group}
              </h4>
            )}
            {group.items.map((item) => {
              // Exact match for root/dashboards, subpath match for detail pages
              const isExactMatch = pathname === item.href;
              const isSubpathMatch =
                item.href !== '/' &&
                item.href !== '/dashboard' &&
                item.href !== '/engineer' &&
                item.href !== '/admin' &&
                pathname.startsWith(`${item.href}/`);
              const isActive = isExactMatch || isSubpathMatch;

              return (
                <Link
                  key={`${group.group}-${item.href}`}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-2.5 md:py-1.5 min-h-[44px] md:min-h-0 rounded-md text-xs transition-colors relative group ${
                    isActive
                      ? 'bg-[#EDF5F8] text-[#176B87] font-semibold'
                      : 'text-[#596579] hover:bg-[#F1F3F5] hover:text-[#172033] font-normal'
                  }`}
                  title={collapsed ? (item.badge !== undefined ? `${item.label} [${item.badge}]` : item.label) : undefined}
                >
                  {/* Left accent bar for active route */}
                  {isActive && (
                    <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#176B87] rounded-r" />
                  )}

                  <item.icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-[#176B87]' : 'text-[#596579] group-hover:text-[#596579]'
                    }`}
                  />

                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate text-xs leading-none">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={`ml-auto pl-2 flex-shrink-0 text-[11px] font-mono leading-none font-medium ${
                            isActive ? 'text-[#176B87]' : 'text-[#596579]'
                          }`}
                        >
                          [{item.badge}]
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer collapse button - clean and free of technical telemetry */}
      <div className="p-2 border-t border-[#D9DEE5] bg-[#F7F8FA]">
        <button
          onClick={onToggle}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center p-2' : 'justify-between px-3 py-1.5'
          } text-xs text-[#596579] hover:text-[#172033] hover:bg-white rounded border border-transparent hover:border-[#D9DEE5] transition-colors cursor-pointer`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {!collapsed && (
            <span className="text-[11px] font-medium text-[#596579]">Collapse sidebar</span>
          )}
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-[#596579]" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-[#596579]" />
          )}
        </button>
      </div>
    </aside>
  );
}
