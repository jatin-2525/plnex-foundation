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
  HelpCircle,
  MessageSquare,
  GitBranch,
  Sparkles,
  FileSearch,
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
  subtitle?: string;
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

// Role-specific navigation groups strictly consolidated into clear functional groups
export const managerNav: SidebarGroup[] = [
  {
    group: 'OVERVIEW',
    items: [
      { label: 'Manager Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Projects', href: '/projects', icon: FolderKanban, subtitle: 'Portfolio Projects Overview' },
    ],
  },
  {
    group: 'PLAN',
    items: [
      { label: 'Master Schedule', href: '/schedule', icon: Calendar, subtitle: 'Committed Baseline CPM Network' },
      { label: 'Schedule Twin', href: '/schedule-twin', icon: Layers, subtitle: 'Dynamic CPM Twin with Field Progress' },
      { label: 'WBS Activities', href: '/activities', icon: ListChecks, subtitle: 'WBS Activities & Scope' },
    ],
  },
  {
    group: 'EXECUTION',
    items: [
      { label: 'AI Match Engine', href: '/matching', icon: Sparkles, subtitle: 'Entity Extraction & Baseline Remap Engine' },
      { label: 'Review Queue', href: '/review', icon: ShieldCheck, badge: 3, subtitle: '3 Pending Verification Items' },
      { label: 'Execution Intelligence', href: '/execution', icon: Cpu, subtitle: 'Live Site Telemetry & Unstructured Stream' },
    ],
  },
  {
    group: 'ANALYZE',
    items: [
      { label: 'Progress & S-Curve', href: '/progress', icon: TrendingUp, subtitle: 'Earned Value S-Curve & Trend Analytics' },
      { label: 'Delays & Risks', href: '/risks', icon: TrendingDown, subtitle: 'Float Consumption & Critical Chain Risks' },
      { label: 'Delay Chain & Root Cause', href: '/variance', icon: GitBranch, subtitle: 'Predecessor Delay Propagation & Root Causes' },
      { label: 'What-if Sandbox', href: '/what-if', icon: Sliders, subtitle: 'Predictive Forward-Pass Sandbox' },
      { label: 'Schedule Health', href: '/health', icon: Activity, subtitle: 'CPM Logic & Field Hygiene Rules' },
    ],
  },
  {
    group: 'EVIDENCE',
    items: [
      { label: 'Evidence & Audit', href: '/evidence', icon: ShieldCheck, subtitle: 'Immutable Ledger & Proof Repository' },
      { label: 'Reports & Memory', href: '/reports', icon: BookOpen, subtitle: 'Historical Variance Lessons & Cases' },
    ],
  },
  {
    group: 'TOOLS',
    items: [
      { label: 'Messages', href: '/messages', icon: MessageSquare, badge: 2, subtitle: 'Direct Field & Site Communications' },
      { label: 'Offline / Sync', href: '/sync', icon: Wifi, subtitle: 'Local Browser Cache & Queue Simulation' },
      { label: 'Help & Support', href: '/support', icon: HelpCircle, subtitle: 'FAQs, Knowledge & Email Assistance' },
    ],
  },
];

export const engineerNav: SidebarGroup[] = [
  {
    group: 'OVERVIEW',
    items: [
      { label: 'Site Engineer Dashboard', href: '/engineer', icon: HardHat, subtitle: 'Daily Shift & Workfront Focus' },
      { label: 'My Activities', href: '/activities', icon: ListChecks, subtitle: 'Direct Workfront Scope & Milestones' },
    ],
  },
  {
    group: 'EXECUTION',
    items: [
      { label: 'Entity Extraction Hub', href: '/field', icon: FileSearch, subtitle: 'Multi-Modal Ingestion & NLP Extraction' },
      { label: 'Field Capture', href: '/field/capture', icon: Camera, subtitle: 'Fast Mobile Entry for Single Site Events' },
      { label: 'DPR / Daily Progress', href: '/field/dpr', icon: FileText, subtitle: 'Official End-of-Shift Submission & Signoff' },
      { label: 'Execution Intelligence', href: '/execution', icon: Cpu, subtitle: 'Live Site Telemetry & Unstructured Stream' },
    ],
  },
  {
    group: 'EVIDENCE',
    items: [
      { label: 'Evidence Vault', href: '/evidence', icon: ShieldCheck, subtitle: 'Photographic Proofs & Lift Tickets' },
    ],
  },
  {
    group: 'TOOLS',
    items: [
      { label: 'Messages', href: '/messages', icon: MessageSquare, badge: 1, subtitle: 'Direct Communications' },
      { label: 'Offline / Sync', href: '/sync', icon: Wifi, subtitle: 'Local Browser Cache & Queue' },
      { label: 'Help & Support', href: '/support', icon: HelpCircle, subtitle: 'FAQs, Field Help & Email Assistance' },
    ],
  },
];

export const adminNav: SidebarGroup[] = [
  {
    group: 'GOVERNANCE',
    items: [
      { label: 'Admin Dashboard', href: '/admin', icon: Shield, subtitle: 'System Health & Security Control' },
      { label: 'Users & Roles', href: '/admin/users', icon: Users, subtitle: 'User Directory & Persona Access' },
      { label: 'Organizations', href: '/admin/organizations', icon: Building2, subtitle: 'Client & Contractor Tenants' },
    ],
  },
  {
    group: 'WORKSPACE VIEWS',
    items: [
      { label: 'Manager Dashboard', href: '/dashboard', icon: LayoutDashboard, subtitle: 'Project Executive Command View' },
      { label: 'Site Engineer Dashboard', href: '/engineer', icon: HardHat, subtitle: 'Field Execution Workfront View' },
    ],
  },
  {
    group: 'PLAN',
    items: [
      { label: 'Projects', href: '/projects', icon: FolderKanban, subtitle: 'Portfolio Projects Overview' },
      { label: 'Master Schedule', href: '/schedule', icon: Calendar, subtitle: 'Committed Baseline CPM Network' },
      { label: 'Schedule Twin', href: '/schedule-twin', icon: Layers, subtitle: 'Dynamic CPM Twin with Field Progress' },
    ],
  },
  {
    group: 'EXECUTION',
    items: [
      { label: 'AI Match Engine', href: '/matching', icon: Sparkles, subtitle: 'Entity Extraction & Baseline Remap Engine' },
      { label: 'Entity Extraction Hub', href: '/field', icon: FileSearch, subtitle: 'Multi-Modal Ingestion & NLP Extraction' },
      { label: 'Review Queue', href: '/review', icon: ShieldCheck, badge: 3, subtitle: 'Pending Verification Items' },
      { label: 'Execution Stream', href: '/execution', icon: Cpu, subtitle: 'Live Site Telemetry' },
    ],
  },
  {
    group: 'ANALYZE',
    items: [
      { label: 'Progress & S-Curve', href: '/progress', icon: TrendingUp, subtitle: 'Earned Value S-Curve & Trends' },
      { label: 'Delays & Risks', href: '/risks', icon: TrendingDown, subtitle: 'Float Consumption & Risks' },
      { label: 'Delay Chain & Root Cause', href: '/variance', icon: GitBranch, subtitle: 'Predecessor Delay Propagation & Root Causes' },
      { label: 'Schedule Health', href: '/health', icon: Activity, subtitle: 'CPM Logic & Field Hygiene Rules' },
    ],
  },
  {
    group: 'EVIDENCE',
    items: [
      { label: 'Evidence & Audit', href: '/evidence', icon: ShieldCheck, subtitle: 'Immutable Ledger & Proof Repository' },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { label: 'Messages', href: '/messages', icon: MessageSquare, subtitle: 'Cross-Project Communications' },
      { label: 'Offline / Sync', href: '/sync', icon: Wifi, subtitle: 'Local Browser Queue' },
      { label: 'Help & Support', href: '/support', icon: HelpCircle, subtitle: 'System FAQs & Email Assistance' },
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
      className={`fixed top-14 bottom-0 left-0 bg-[#103F39] dark:bg-[#17221D] border-r border-[#0D342F] dark:border-[#3A5146] z-30 transition-all duration-200 flex flex-col text-[#EEF3E8] dark:text-[#F2F4E9] ${
        collapsed ? 'w-16' : 'w-[248px]'
      } ${
        mobileMenuOpen
          ? 'translate-x-0'
          : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Admin-only Workspace Switcher (Only visible to privileged Admin accounts) */}
      {role === 'admin' && (
        <div ref={switcherRef} className="p-2 border-b border-[#0D342F] dark:border-[#3A5146] bg-[#0C312C] dark:bg-[#101815]">
          {!collapsed ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E5C185] dark:text-[#E9C46A]">
                  CURRENT WORKSPACE
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#194E46] dark:bg-[#243832] text-[#EEF3E8] dark:text-[#72C6AD] border border-[#235F56] dark:border-[#3A5146]">
                  {activeWorkspace.badge}
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setWorkspaceSwitcherOpen(!workspaceSwitcherOpen)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#103F39] dark:bg-[#17221D] border border-[#235F56] dark:border-[#3A5146] hover:border-[#E5C185] dark:hover:border-[#72C6AD] shadow-2xs text-xs font-semibold text-[#EEF3E8] dark:text-[#F2F4E9] transition-colors cursor-pointer"
                  aria-haspopup="true"
                  aria-expanded={workspaceSwitcherOpen}
                  title="Switch between authorized admin workspaces"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <activeWorkspace.icon className="w-3.5 h-3.5 text-[#E5C185] dark:text-[#72C6AD] flex-shrink-0" />
                    <span className="truncate">{activeWorkspace.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#E5C185] dark:text-[#E9C46A] flex-shrink-0 transition-transform duration-150 ${
                      workspaceSwitcherOpen ? 'rotate-180 text-[#E5C185]' : ''
                    }`}
                  />
                </button>

                {workspaceSwitcherOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 p-1 bg-[#0C312C] dark:bg-[#17221D] border border-[#235F56] dark:border-[#3A5146] rounded-xl shadow-xl z-50 space-y-0.5">
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
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                            isCurrent
                              ? 'bg-[#08786A] dark:bg-[#243832] text-white dark:text-[#72C6AD] font-bold'
                              : 'text-[#EEF3E8] dark:text-[#F2F4E9] hover:bg-[#194E46] dark:hover:bg-[#243832] font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ws.icon
                              className={`w-3.5 h-3.5 flex-shrink-0 ${
                                isCurrent ? 'text-[#E5C185] dark:text-[#72C6AD]' : 'text-[#A3BEB4] dark:text-[#B5C1B5]'
                              }`}
                            />
                            <span className="truncate">{ws.label}</span>
                          </div>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-[#E5C185] dark:text-[#72C6AD] flex-shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1" title={`Current Workspace: ${activeWorkspace.label}`}>
              <activeWorkspace.icon className="w-4 h-4 text-[#E5C185] dark:text-[#72C6AD]" />
            </div>
          )}
        </div>
      )}

      {/* Workflow Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
        {activeNavGroups.map((group) => (
          <div key={group.group} className="space-y-0.5">
            {!collapsed && (
              <h4 className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#E5C185] dark:text-[#E9C46A] select-none font-mono">
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
                  className={`flex items-center gap-2.5 px-3 py-2.5 md:py-2 min-h-[44px] md:min-h-0 rounded-lg text-xs transition-colors relative group ${
                    isActive
                      ? 'bg-[#08786A] dark:bg-[#243832] text-white dark:text-[#72C6AD] font-semibold shadow-xs'
                      : 'text-[#EEF3E8] dark:text-[#B5C1B5] hover:bg-[#194E46] dark:hover:bg-[#243832] hover:text-white dark:hover:text-[#F2F4E9] font-normal'
                  }`}
                  title={item.subtitle ? `${item.label} — ${item.subtitle}` : (item.badge !== undefined ? `${item.label} [${item.badge}]` : item.label)}
                >
                  {/* Left accent bar for active route */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#E5C185] dark:bg-[#72C6AD] rounded-r" />
                  )}

                  <item.icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-[#E5C185] dark:text-[#72C6AD]' : 'text-[#A3BEB4] dark:text-[#859688] group-hover:text-white dark:group-hover:text-[#F2F4E9]'
                    }`}
                  />

                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate text-xs leading-none">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={`ml-auto pl-2 flex-shrink-0 text-[11px] font-mono leading-none font-medium ${
                            isActive ? 'text-[#E5C185] dark:text-[#72C6AD]' : 'text-[#A3BEB4] dark:text-[#E9C46A]'
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
      <div className="p-2 border-t border-[#0D342F] dark:border-[#3A5146] bg-[#0C312C] dark:bg-[#101815]">
        <button
          onClick={onToggle}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center p-2' : 'justify-between px-3 py-1.5'
          } text-xs text-[#EEF3E8] dark:text-[#B5C1B5] hover:text-white dark:hover:text-[#F2F4E9] hover:bg-[#194E46] dark:hover:bg-[#243832] rounded-lg border border-transparent hover:border-[#235F56] dark:hover:border-[#3A5146] transition-colors cursor-pointer`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {!collapsed && (
            <span className="text-[11px] font-medium text-[#EEF3E8] dark:text-[#B5C1B5]">Collapse sidebar</span>
          )}
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-[#E5C185] dark:text-[#E9C46A]" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-[#E5C185] dark:text-[#E9C46A]" />
          )}
        </button>
      </div>
    </aside>
  );
}
