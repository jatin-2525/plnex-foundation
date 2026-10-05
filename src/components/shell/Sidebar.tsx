'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  ClipboardList,
  GitCompare,
  TrendingDown,
  TrendingUp,
  LayoutDashboard,
  ShieldCheck,
  Layers,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  HardHat,
  ListChecks,
  Cpu,
  AlertTriangle,
  Sliders,
  Activity,
  BookOpen,
  Wifi,
  Camera,
  FileText,
  Shield,
  Users,
  Building2,
  Settings,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

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
  isLive?: boolean;
}

interface SidebarGroup {
  group: string;
  items: SidebarNavItem[];
}

export function Sidebar({ collapsed, onToggle, mobileMenuOpen, onCloseMobile }: SidebarProps) {
  const rawPathname = usePathname();
  const pathname = (rawPathname && rawPathname.length > 1 && rawPathname.endsWith('/'))
    ? rawPathname.slice(0, -1)
    : (rawPathname || '/');
  const { userSession } = useApp();

  const role: UserRole = userSession?.role || 'manager';

  // Manager Navigation
  const managerNav: SidebarGroup[] = [
    {
      group: '',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
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
        { label: 'Execution Intelligence', href: '/execution', icon: Cpu, isLive: true },
        { label: 'Review Queue', href: '/review', icon: ShieldCheck, badge: 6 },
      ],
    },
    {
      group: 'CONTROL',
      items: [
        { label: 'Progress & Variance', href: '/progress', icon: TrendingUp, badge: '-7%' },
        { label: 'Delay & Impact', href: '/risks', icon: TrendingDown },
        { label: 'What-if', href: '/what-if', icon: Sliders },
      ],
    },
    {
      group: 'TRUST',
      items: [
        { label: 'Evidence & Audit', href: '/evidence', icon: ShieldCheck },
        { label: 'Schedule Health', href: '/health', icon: Activity, badge: 5 },
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

  // Site Engineer Navigation
  const engineerNav: SidebarGroup[] = [
    {
      group: '',
      items: [
        { label: 'Dashboard', href: '/engineer', icon: HardHat },
        { label: 'My Activities', href: '/activities', icon: ListChecks },
      ],
    },
    {
      group: 'FIELD',
      items: [
        { label: 'Field Capture', href: '/field/capture', icon: Camera },
        { label: 'DPR / Time Agent', href: '/field/dpr', icon: FileText },
      ],
    },
    {
      group: 'EXECUTION',
      items: [
        { label: 'Execution Intelligence', href: '/execution', icon: Cpu, isLive: true },
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

  // Admin Navigation (full admin control hub with visibility and system tools)
  const adminNav: SidebarGroup[] = [
    {
      group: 'ADMINISTRATION',
      items: [
        { label: 'Admin Hub', href: '/admin', icon: Shield },
        { label: 'Users & Roles', href: '/admin/users', icon: Users },
        { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
        { label: 'Settings', href: '/admin/settings', icon: Settings },
        { label: 'Foundation & Showcase', href: '/showcase', icon: Layers },
      ],
    },
    {
      group: 'MANAGER VIEW',
      items: [
        { label: 'Manager Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Projects', href: '/projects', icon: FolderKanban },
        { label: 'Schedule', href: '/schedule', icon: Calendar },
        { label: 'Schedule Twin', href: '/schedule-twin', icon: Layers },
        { label: 'Execution Intelligence', href: '/execution', icon: Cpu, isLive: true },
        { label: 'Review Queue', href: '/review', icon: ShieldCheck, badge: 6 },
        { label: 'Progress & Variance', href: '/progress', icon: TrendingUp },
        { label: 'Delay & Impact', href: '/risks', icon: TrendingDown },
        { label: 'What-if', href: '/what-if', icon: Sliders },
        { label: 'Schedule Health', href: '/health', icon: Activity, badge: 5 },
        { label: 'Reports & Memory', href: '/reports', icon: BookOpen },
      ],
    },
    {
      group: 'ENGINEER VIEW',
      items: [
        { label: 'Engineer Dashboard', href: '/engineer', icon: HardHat },
        { label: 'My Activities', href: '/activities', icon: ListChecks },
        { label: 'Field Capture', href: '/field/capture', icon: Camera },
        { label: 'DPR / Time Agent', href: '/field/dpr', icon: FileText },
      ],
    },
    {
      group: 'SHARED OPERATIONS',
      items: [
        { label: 'Evidence & Audit', href: '/evidence', icon: ShieldCheck },
        { label: 'Offline / Sync', href: '/sync', icon: Wifi },
      ],
    },
  ];

  const navGroups: SidebarGroup[] =
    role === 'admin' ? adminNav : role === 'engineer' ? engineerNav : managerNav;

  return (
    <aside
      className={`fixed top-14 bottom-0 left-0 bg-white border-r border-[#D9DEE5] z-30 transition-all duration-200 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      } ${
        mobileMenuOpen
          ? 'translate-x-0'
          : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Workflow Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && group.group && (
              <h4 className="px-3 pt-2 text-[10px] font-bold uppercase tracking-wider text-[#8A94A6]">
                {group.group}
              </h4>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors relative group ${
                    isActive
                      ? 'bg-[#EDF5F8] text-[#176B87] font-semibold'
                      : 'text-[#596579] hover:bg-[#F0F2F5] hover:text-[#172033]'
                  }`}
                  title={collapsed ? (item.isLive ? `${item.label} (Live)` : item.label) : undefined}
                >
                  {/* Left accent bar for active route */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#176B87] rounded-r" />
                  )}

                  <item.icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-[#176B87]' : 'text-[#596579]'
                    }`}
                  />

                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      {item.isLive ? (
                        <div className="flex flex-col min-w-0 text-left">
                          <span className="truncate leading-tight text-xs">{item.label}</span>
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#2E7D5B] font-semibold mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B]" />
                            <span>Live</span>
                          </span>
                        </div>
                      ) : (
                        <span className="truncate text-xs">{item.label}</span>
                      )}

                      {item.badge !== undefined && !item.isLive && (
                        <span
                          className={`ml-auto pl-3 flex-shrink-0 inline-flex items-center justify-center`}
                        >
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none ${
                              typeof item.badge === 'number'
                                ? 'bg-[#FDF6ED] text-[#D98B32] border border-[#F0D4A6]'
                                : 'bg-[#EDF2F8] text-[#176B87] border border-[#B3CBE0]'
                            }`}
                          >
                            {item.badge}
                          </span>
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

      {/* Footer collapse button */}
      <div className="p-2 border-t border-[#D9DEE5] bg-[#F7F8FA] flex items-center justify-between">
        {!collapsed && (
          <div className="px-2 text-[10px] text-[#8A94A6] font-mono">
            <span>PLnEX • {role.toUpperCase()} • V3 · Rev 3.2</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 text-[#596579] hover:text-[#172033] hover:bg-white rounded border border-transparent hover:border-[#D9DEE5] transition-colors ml-auto cursor-pointer"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
