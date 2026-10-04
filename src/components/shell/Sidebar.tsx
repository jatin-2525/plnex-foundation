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
  Sparkles,
  FolderKanban,
  HardHat,
  ListChecks,
  Cpu,
  AlertTriangle,
  Sliders,
  Activity,
  BookOpen,
  Wifi,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../types/permissions';

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
  stage?: string;
  permission?: any;
  badge?: string | number;
}

interface SidebarGroup {
  group: string;
  items: SidebarNavItem[];
}

export function Sidebar({ collapsed, onToggle, mobileMenuOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { userSession } = useApp();

  const navItems: SidebarGroup[] = [
    {
      group: 'OVERVIEW',
      items: [
        {
          label: 'Projects Portfolio',
          href: '/projects',
          icon: FolderKanban,
          stage: 'PORTFOLIO',
        },
        {
          label: 'Manager Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          stage: 'ACTION',
          permission: 'variance:read' as const,
          badge: 2,
        },
        {
          label: 'Engineer Dashboard',
          href: '/engineer',
          icon: HardHat,
          stage: 'FIELD EXECUTION',
          badge: 'Site',
        },
        {
          label: 'My Activities',
          href: '/activities',
          icon: ListChecks,
          stage: 'ASSIGNED TASKS',
          permission: 'field:write' as const,
        },
        {
          label: 'Schedule Twin',
          href: '/schedule-twin',
          icon: Layers,
          stage: 'UPDATE & VARIANCE',
          permission: 'variance:read' as const,
        },
      ],
    },
    {
      group: 'CORE PIPELINE (PLAN → ACTION)',
      items: [
        {
          label: '1. Master Schedule',
          href: '/schedule',
          icon: Calendar,
          stage: 'PLAN',
          permission: 'plan:read' as const,
        },
        {
          label: '2. Field Ingestion',
          href: '/field',
          icon: ClipboardList,
          stage: 'FIELD & EXTRACT',
          permission: 'field:read' as const,
        },
        {
          label: 'Execution Intel',
          href: '/execution',
          icon: Cpu,
          stage: 'INTEL & LINKING',
          badge: 'Live',
        },
        {
          label: '3. Match & Verify',
          href: '/matching',
          icon: GitCompare,
          stage: 'MATCH & VERIFY',
          badge: 2,
          permission: 'match:read' as const,
        },
        {
          label: 'Review Queue',
          href: '/review',
          icon: ShieldCheck,
          stage: 'GOVERNANCE',
          badge: 6,
        },
        {
          label: 'Progress & Variance',
          href: '/progress',
          icon: TrendingUp,
          stage: 'S-CURVE & TRACK',
          badge: '-7%',
        },
        {
          label: 'Risks & Dependencies',
          href: '/risks',
          icon: AlertTriangle,
          stage: 'CPM RISK & SLIP',
          badge: 3,
        },
        {
          label: '4. Delay & Impact',
          href: '/variance',
          icon: TrendingDown,
          stage: 'IMPACT & ACTION',
          permission: 'impact:read' as const,
        },
        {
          label: 'What-if Simulator',
          href: '/what-if',
          icon: Sliders,
          stage: 'SANDBOX SIM',
          badge: 'Sim',
        },
      ],
    },
    {
      group: 'CONTROLS & COMPLIANCE',
      items: [
        {
          label: 'Evidence & Audit',
          href: '/evidence',
          icon: ShieldCheck,
          permission: 'evidence:read' as const,
        },
        {
          label: 'Schedule Health',
          href: '/health',
          icon: Activity,
          badge: 5,
        },
        {
          label: 'Offline / Sync Center',
          href: '/sync',
          icon: Wifi,
          badge: 'Sync',
        },
        {
          label: 'Reports & Memory',
          href: '/reports',
          icon: BookOpen,
        },
        {
          label: 'Foundation Showcase',
          href: '/showcase',
          icon: Layers,
          badge: 'Design System',
        },
      ],
    },
  ];

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
        {navItems.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8A94A6]">
                {group.group}
              </h4>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const isAllowed = item.permission
                ? hasPermission(userSession.role, item.permission)
                : true;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors relative group ${
                    isActive
                      ? 'bg-[#EDF5F8] text-[#176B87] font-semibold'
                      : isAllowed
                      ? 'text-[#596579] hover:bg-[#F0F2F5] hover:text-[#172033]'
                      : 'text-[#B0B8C9] hover:bg-[#FBEFEE] hover:text-[#B5473C]'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Left accent bar for active */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#176B87] rounded-r" />
                  )}

                  <item.icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-[#176B87]' : isAllowed ? 'text-[#596579]' : 'text-[#B0B8C9]'
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
            <span>PLnEX v1.0 • OIL</span>
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
