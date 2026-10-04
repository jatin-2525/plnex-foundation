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
}

interface SidebarGroup {
  group: string;
  items: SidebarNavItem[];
}

export function Sidebar({ collapsed, onToggle, mobileMenuOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
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
        { label: 'Execution Intelligence', href: '/execution', icon: Cpu },
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

  // Admin Navigation (deliberate admin hub with full visibility and system tools)
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
        { label: 'Progress & Variance', href: '/progress', icon: TrendingUp },
        { label: 'Delay & Impact', href: '/risks', icon: TrendingDown },
        { label: 'What-if', href: '/what-if', icon: Sliders },
        { label: 'Schedule Health', href: '/health', icon: Activity },
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
        { label: 'Execution Intelligence', href: '/execution', icon: Cpu },
        { label: 'Review Queue', href: '/review', icon: ShieldCheck },
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
        collapsed ? 'w-16' : 'w-60'
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
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8A94A6]">
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors relative group ${
                    isActive
                      ? 'bg-[#EDF5F8] text-[#176B87] font-semibold'
                      : 'text-[#596579] hover:bg-[#F0F2F5] hover:text-[#172033]'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Left accent bar for active */}
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
                      <span className="truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={`ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                            typeof item.badge === 'number'
                              ? 'bg-[#FDF6ED] text-[#D98B32] border border-[#F0D4A6]'
                              : 'bg-[#EDF2F8] text-[#176B87] border border-[#B3CBE0]'
                          }`}
                        >
                          {item.badge}
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
          className="p-1.5 text-[#596579] hover:text-[#172033] hover:bg-white rounded border border-transparent hover:border-[#D9DEE5] transition-colors ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
