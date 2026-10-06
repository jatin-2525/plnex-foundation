'use client';

import React from 'react';
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

export const NAV_GROUPS: SidebarGroup[] = [
  {
    group: 'WORKSPACE',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'My Activities', href: '/activities', icon: ListChecks },
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
      { label: 'Review Queue', href: '/review', icon: ShieldCheck, badge: 6 },
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
      { label: 'Sync', href: '/sync', icon: Wifi },
    ],
  },
];

// Compatibility aliases
export const managerNav = NAV_GROUPS;
export const engineerNav = NAV_GROUPS;
export const adminNav = NAV_GROUPS;

export function Sidebar({ collapsed, onToggle, mobileMenuOpen, onCloseMobile }: SidebarProps) {
  const rawPathname = usePathname();
  const pathname = (rawPathname && rawPathname.length > 1 && rawPathname.endsWith('/'))
    ? rawPathname.slice(0, -1)
    : (rawPathname || '/');
  const { userSession } = useApp();

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
      {/* Workflow Navigation */}
      <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.group} className="space-y-0.5">
            {!collapsed && (
              <h4 className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#596579] select-none">
                {group.group}
              </h4>
            )}
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors relative group ${
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
            collapsed ? 'justify-center p-1.5' : 'justify-between px-2.5 py-1.5'
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
