'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { AppShell } from '../../components/shell/AppShell';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { Modal } from '../../components/shared/Modal';
import { Drawer } from '../../components/shared/Drawer';
import {
  INITIAL_HEALTH_ISSUES,
  SCHEDULE_STRUCTURE_RULES,
  EXECUTION_DATA_RULES,
  HealthIssue,
  HealthCategory,
  HealthRule,
  HealthSeverity,
  IssueStatus,
} from '../../lib/domain/healthEngine';
import {
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  RotateCcw,
  Check,
  X,
  ExternalLink,
  Layers,
  Calendar,
  FileText,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Eye,
  Wrench,
  HelpCircle,
  Folder,
  Lock,
  GitBranch,
  RefreshCw,
  Download,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function ScheduleHealthPage() {
  const { activeProject } = useApp();
  const { addToast } = useToast();

  // Issues State
  const [issues, setIssues] = useState<HealthIssue[]>(INITIAL_HEALTH_ISSUES);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | HealthCategory>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | HealthSeverity>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | IssueStatus>('ALL');
  const [ruleFilter, setRuleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Modals & Drawers
  const [selectedIssueForDetail, setSelectedIssueForDetail] = useState<HealthIssue | null>(null);
  const [fixingIssue, setFixingIssue] = useState<HealthIssue | null>(null);
  const [ignoringIssue, setIgnoringIssue] = useState<HealthIssue | null>(null);
  const [ignoreReason, setIgnoreReason] = useState<string>('');
  const [fixedValue, setFixedValue] = useState<string>('');

  // Filtered Issues
  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      // Category filter
      if (categoryFilter !== 'ALL' && iss.category !== categoryFilter) {
        return false;
      }
      // Severity filter
      if (severityFilter !== 'ALL' && iss.severity !== severityFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && iss.status !== statusFilter) {
        return false;
      }
      // Rule filter
      if (ruleFilter !== 'ALL' && iss.rule !== ruleFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = iss.id.toLowerCase().includes(q);
        const matchesObj = iss.objectId.toLowerCase().includes(q) || iss.objectName.toLowerCase().includes(q);
        const matchesDesc = iss.description.toLowerCase().includes(q);
        const matchesRule = iss.rule.toLowerCase().includes(q);
        if (!matchesId && !matchesObj && !matchesDesc && !matchesRule) {
          return false;
        }
      }
      return true;
    });
  }, [issues, categoryFilter, severityFilter, statusFilter, ruleFilter, searchQuery]);

  // Top Summary Metric Calculations
  const metrics = useMemo(() => {
    const criticalCount = issues.filter((i) => i.severity === 'Critical' && i.status === 'Open').length;
    const attentionCount = issues.filter((i) => i.severity === 'Needs Attention' && i.status === 'Open').length;
    const resolvedCount = issues.filter((i) => i.status === 'Resolved').length;
    const ignoredCount = issues.filter((i) => i.status === 'Ignored').length;

    return {
      healthyRate: 82.4, // Project data quality score %
      criticalCount,
      attentionCount,
      resolvedCount,
      ignoredCount,
      totalOpen: criticalCount + attentionCount,
    };
  }, [issues]);

  // Run Health Scan Simulation
  const handleRunHealthScan = () => {
    setIsScanning(true);
    addToast({
      type: 'info',
      title: 'Health Audit Initiated',
      description: 'Evaluating CPM forward/backward passes, WBS hierarchy, and execution reports.',
    });

    setTimeout(() => {
      setIsScanning(false);
      addToast({
        type: 'success',
        title: 'Schedule Health Audit Complete',
        description: `Evaluated 146 activities & 12 field events. Detected ${metrics.criticalCount} critical blockers.`,
      });
    }, 800);
  };

  // Action: Fix Data
  const handleOpenFixModal = (issue: HealthIssue) => {
    setFixingIssue(issue);
    setFixedValue(issue.fixPayload?.suggestedValue || '');
  };

  const handleApplyFix = () => {
    if (!fixingIssue) return;

    setIssues((prev) =>
      prev.map((i) =>
        i.id === fixingIssue.id
          ? {
              ...i,
              status: 'Resolved',
              resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : i
      )
    );

    addToast({
      type: 'success',
      title: 'Data Quality Fix Applied',
      description: `Resolved ${fixingIssue.id}: ${fixingIssue.fixPayload?.fieldToFix} updated to "${fixedValue}".`,
    });

    setFixingIssue(null);
  };

  // Action: Ignore with Reason
  const handleOpenIgnoreModal = (issue: HealthIssue) => {
    setIgnoringIssue(issue);
    setIgnoreReason('');
  };

  const handleApplyIgnore = () => {
    if (!ignoringIssue) return;
    if (!ignoreReason.trim()) {
      addToast({
        type: 'warning',
        title: 'Engineering Justification Required',
        description: 'You must provide a technical reason to suppress or ignore this health check.',
      });
      return;
    }

    setIssues((prev) =>
      prev.map((i) =>
        i.id === ignoringIssue.id
          ? {
              ...i,
              status: 'Ignored',
              ignoredReason: ignoreReason,
            }
          : i
      )
    );

    addToast({
      type: 'info',
      title: 'Health Issue Suppressed',
      description: `Issue ${ignoringIssue.id} marked as Ignored with documented engineering justification.`,
    });

    setIgnoringIssue(null);
  };

  // Action: Reset Filters
  const handleResetFilters = () => {
    setCategoryFilter('ALL');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
    setRuleFilter('ALL');
    setSearchQuery('');
  };

  const breadcrumbs = [
    { label: 'Controls & Compliance' },
    { label: 'Schedule Health & Data Quality', current: true },
  ];

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            HEADER: Schedule Health & Data Quality
            Purpose: Find structural problems in project schedule and execution data
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]/60">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <Activity className="w-3.5 h-3.5" />
                  Quality & Health Governance
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                  <CheckCircle2 className="w-3 h-3 text-[#2E7D5B]" />
                  CPM Network Integrity Scanner
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#F0F2F5] text-[#596579] border border-[#D9DEE5]">
                  Pure Project Data Quality · No Server Telemetry
                </span>
              </div>

              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                Schedule Health & Data Quality
              </h1>
              <p className="text-xs text-[#596579] mt-0.5 max-w-3xl">
                Pinpoint structural flaws in Primavera P6 schedule networks and execution reports before logic errors distort critical path projections and project forecasts.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleRunHealthScan}
                disabled={isScanning}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] disabled:opacity-50 rounded-lg shadow-xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Running Scan...' : 'Run Health Scan'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  addToast({
                    type: 'success',
                    title: 'Audit Report Exported',
                    description: 'Schedule Data Quality Diagnostic report exported to CSV/PDF.',
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F0F2F5] rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#596579]" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* PROJECT INFO BADGE */}
          <div className="pt-3 flex items-center justify-between text-xs text-[#596579] font-mono flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-[#176B87]" />
              <span>Project:</span>
              <strong className="text-[#172033]">{activeProject?.code || 'OIL-DUL-01'}</strong>
              <span>· Baseline: V3 · Rev 3.2</span>
            </div>
            <div>
              <span>Evaluated: 146 activities · 12 field events · Reference Date: 18 Sep 2026</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TOP SUMMARY CARDS:
            - Healthy
            - Needs Attention
            - Critical
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. HEALTHY */}
          <div
            onClick={() => setSeverityFilter(severityFilter === 'Healthy' ? 'ALL' : 'Healthy')}
            className={`p-5 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
              severityFilter === 'Healthy'
                ? 'ring-2 ring-[#2E7D5B] border-[#2E7D5B]'
                : 'hover:border-[#B8DCC9]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-[#2E7D5B] tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />
                Healthy Status
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                {metrics.healthyRate}% Compliant
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-[#172033] mb-1">
              136 / 146 Activities
            </div>
            <p className="text-xs text-[#596579] leading-relaxed">
              Zero duplicate IDs, clean activity coding, and valid durations across 93% of the schedule network.
            </p>
          </div>

          {/* 2. NEEDS ATTENTION */}
          <div
            onClick={() => setSeverityFilter(severityFilter === 'Needs Attention' ? 'ALL' : 'Needs Attention')}
            className={`p-5 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
              severityFilter === 'Needs Attention'
                ? 'ring-2 ring-[#9A5B13] border-[#9A5B13]'
                : 'hover:border-[#ECD1A4]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-[#9A5B13] tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#9A5B13]" />
                Needs Attention
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FEF7EE] text-[#9A5B13] border border-[#ECD1A4]">
                {metrics.attentionCount} Warnings
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-[#9A5B13] mb-1">
              {metrics.attentionCount} Non-Fatal Issues
            </div>
            <p className="text-xs text-[#596579] leading-relaxed">
              Stale field updates (&gt;48h), missing measurement units, open-ended finishes, and WBS level depth mismatches.
            </p>
          </div>

          {/* 3. CRITICAL */}
          <div
            onClick={() => setSeverityFilter(severityFilter === 'Critical' ? 'ALL' : 'Critical')}
            className={`p-5 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
              severityFilter === 'Critical'
                ? 'ring-2 ring-[#B5473C] border-[#B5473C]'
                : 'hover:border-[#E4B0AA]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-[#B5473C] tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#B5473C]" />
                Critical Blockers
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                {metrics.criticalCount} Blockers
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-[#B5473C] mb-1">
              {metrics.criticalCount} Integrity Violations
            </div>
            <p className="text-xs text-[#596579] leading-relaxed">
              Inverted schedule dates, missing WBS parent codes, dangling open-starts, and duplicate field submissions.
            </p>
          </div>
        </div>

        {/* =========================================================================
            HEALTH CATEGORIES DIAGNOSTIC GRID
            1. Schedule Structure (7 rules)
            2. Execution Data (5 rules)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CATEGORY 1: SCHEDULE STRUCTURE */}
          <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9DEE5]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#176B87]" />
                <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                  Schedule Structure Integrity
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#596579]">
                7 Rule Checks
              </span>
            </div>

            <div className="space-y-2">
              {SCHEDULE_STRUCTURE_RULES.map((chk) => {
                const ruleIssues = issues.filter(
                  (i) => i.rule === chk.rule && i.status === 'Open'
                );
                const hasCritical = ruleIssues.some((i) => i.severity === 'Critical');
                const hasWarning = ruleIssues.some((i) => i.severity === 'Needs Attention');

                return (
                  <div
                    key={chk.rule}
                    onClick={() => {
                      setCategoryFilter('Schedule Structure');
                      setRuleFilter(ruleFilter === chk.rule ? 'ALL' : chk.rule);
                    }}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      ruleFilter === chk.rule
                        ? 'border-[#176B87] bg-[#EDF5F8]'
                        : hasCritical
                        ? 'bg-[#FBEFEE]/30 border-[#E4B0AA] hover:bg-[#FBEFEE]/60'
                        : hasWarning
                        ? 'bg-[#FEF7EE]/30 border-[#ECD1A4] hover:bg-[#FEF7EE]/60'
                        : 'bg-[#F7F8FA] border-[#D9DEE5] hover:bg-white'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#172033]">{chk.name}</span>
                        <span className="text-[10px] font-mono text-[#8A94A6]">({chk.rule})</span>
                      </div>
                      <p className="text-[11px] text-[#596579] line-clamp-1">{chk.description}</p>
                    </div>

                    <div className="shrink-0">
                      {hasCritical ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                          {ruleIssues.length} Critical
                        </span>
                      ) : hasWarning ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FEF7EE] text-[#9A5B13] border border-[#ECD1A4]">
                          {ruleIssues.length} Warning
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                          Passed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CATEGORY 2: EXECUTION DATA */}
          <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9DEE5]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#176B87]" />
                <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                  Execution Data Quality
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#596579]">
                5 Rule Checks
              </span>
            </div>

            <div className="space-y-2">
              {EXECUTION_DATA_RULES.map((chk) => {
                const ruleIssues = issues.filter(
                  (i) => i.rule === chk.rule && i.status === 'Open'
                );
                const hasCritical = ruleIssues.some((i) => i.severity === 'Critical');
                const hasWarning = ruleIssues.some((i) => i.severity === 'Needs Attention');

                return (
                  <div
                    key={chk.rule}
                    onClick={() => {
                      setCategoryFilter('Execution Data');
                      setRuleFilter(ruleFilter === chk.rule ? 'ALL' : chk.rule);
                    }}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      ruleFilter === chk.rule
                        ? 'border-[#176B87] bg-[#EDF5F8]'
                        : hasCritical
                        ? 'bg-[#FBEFEE]/30 border-[#E4B0AA] hover:bg-[#FBEFEE]/60'
                        : hasWarning
                        ? 'bg-[#FEF7EE]/30 border-[#ECD1A4] hover:bg-[#FEF7EE]/60'
                        : 'bg-[#F7F8FA] border-[#D9DEE5] hover:bg-white'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#172033]">{chk.name}</span>
                        <span className="text-[10px] font-mono text-[#8A94A6]">({chk.rule})</span>
                      </div>
                      <p className="text-[11px] text-[#596579] line-clamp-1">{chk.description}</p>
                    </div>

                    <div className="shrink-0">
                      {hasCritical ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                          {ruleIssues.length} Critical
                        </span>
                      ) : hasWarning ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FEF7EE] text-[#9A5B13] border border-[#ECD1A4]">
                          {ruleIssues.length} Warning
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                          Passed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            FILTERS & SEARCH BAR
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Category Filter */}
              <div className="flex items-center bg-[#F0F2F5] p-1 rounded-lg border border-[#D9DEE5]">
                {(['ALL', 'Schedule Structure', 'Execution Data'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(cat);
                      setRuleFilter('ALL');
                    }}
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      categoryFilter === cat
                        ? 'bg-white text-[#176B87] font-bold shadow-xs'
                        : 'text-[#596579] hover:text-[#172033]'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Categories' : cat}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-xs font-medium text-[#172033] outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Open">Open Issues</option>
                <option value="Resolved">Resolved</option>
                <option value="Ignored">Ignored with Reason</option>
              </select>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-xs font-medium text-[#172033] outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="Critical">Critical Only</option>
                <option value="Needs Attention">Needs Attention Only</option>
              </select>

              {ruleFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#EDF5F8] text-[#176B87] font-mono text-[11px] border border-[#B3CBE0]">
                  <span>Rule: {ruleFilter}</span>
                  <button onClick={() => setRuleFilter('ALL')} className="hover:text-black">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            {/* Clear Filters */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-[#596579] hover:text-[#172033] flex items-center gap-1 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="pt-2 border-t border-[#D9DEE5]/60 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-[#8A94A6] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues by ID, object, rule, or description..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87]"
              />
            </div>
            <span className="text-xs font-mono text-[#596579]">
              Showing <strong className="text-[#172033]">{filteredIssues.length}</strong> issues
            </span>
          </div>
        </div>

        {/* =========================================================================
            MAIN ISSUE TABLE
            Columns:
            - Issue ID
            - Category
            - Severity
            - Object
            - Description
            - Detected
            - Status
            - Action
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider">
                  <th className="py-3 px-4">Issue ID</th>
                  <th className="py-3 px-4">Category & Rule</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Target Object</th>
                  <th className="py-3 px-4">Problem Description & Impact</th>
                  <th className="py-3 px-4">Detected</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EBF0]">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => setSelectedIssueForDetail(issue)}
                    className="hover:bg-[#F0F2F5]/60 transition-colors cursor-pointer group"
                  >
                    {/* Issue ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#176B87]">
                      <span className="px-2 py-0.5 rounded bg-[#EDF5F8] border border-[#B3CBE0]">
                        {issue.id}
                      </span>
                    </td>

                    {/* Category & Rule */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-[#172033] block">{issue.category}</span>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono text-[#596579] bg-[#F0F2F5] border border-[#D9DEE5]">
                          {issue.rule}
                        </span>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-3.5 px-4">
                      {issue.severity === 'Critical' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                          <AlertTriangle className="w-3 h-3" />
                          Critical
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FEF7EE] text-[#9A5B13] border border-[#ECD1A4]">
                          <AlertCircle className="w-3 h-3" />
                          Needs Attention
                        </span>
                      )}
                    </td>

                    {/* Object */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#176B87]">{issue.objectId}</span>
                        <span className="text-[10px] font-mono uppercase bg-[#F0F2F5] px-1 py-0.2 rounded text-[#596579]">
                          {issue.objectType === 'SCHEDULE_ACTIVITY' ? 'Activity' : 'Field Event'}
                        </span>
                      </div>
                      <div className="font-medium text-[#172033] text-[11px] truncate mt-0.5">
                        {issue.objectName}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-medium text-[#172033] text-[11px] line-clamp-2">
                        {issue.description}
                      </p>
                      <p className="text-[10px] text-[#8A94A6] mt-0.5 line-clamp-1 italic">
                        {issue.impactExplanation}
                      </p>
                    </td>

                    {/* Detected */}
                    <td className="py-3.5 px-4 font-mono text-[#596579] whitespace-nowrap">
                      {issue.detectedAt}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {issue.status === 'Resolved' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                          <Check className="w-3 h-3" />
                          Resolved
                        </span>
                      ) : issue.status === 'Ignored' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#F0F2F5] text-[#596579] border border-[#D9DEE5]">
                          Ignored
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FEF7EE] text-[#9A5B13] border border-[#ECD1A4]">
                          Open
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Fix Data Action */}
                        {issue.fixPayload && issue.status === 'Open' && (
                          <button
                            type="button"
                            onClick={() => handleOpenFixModal(issue)}
                            className="px-2.5 py-1 rounded bg-[#176B87] hover:bg-[#135A72] text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1"
                            title="Apply quick structural fix"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>Fix Data</span>
                          </button>
                        )}

                        {/* Review Action */}
                        {issue.suggestedAction === 'Review' && issue.status === 'Open' && (
                          <Link
                            href="/review"
                            className="px-2.5 py-1 rounded bg-[#176B87] hover:bg-[#135A72] text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1"
                            title="Open in Review Queue"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Review</span>
                          </Link>
                        )}

                        {/* View Activity Action */}
                        {issue.objectType === 'SCHEDULE_ACTIVITY' && (
                          <Link
                            href="/schedule-twin"
                            className="p-1 rounded border border-[#D9DEE5] hover:bg-[#F0F2F5] text-[#596579] transition-colors"
                            title="View Activity in Schedule Twin"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        {/* Ignore with Reason Action */}
                        {issue.status === 'Open' && (
                          <button
                            type="button"
                            onClick={() => handleOpenIgnoreModal(issue)}
                            className="p-1 rounded border border-[#D9DEE5] hover:bg-[#FBEFEE] text-[#596579] hover:text-[#B5473C] transition-colors"
                            title="Ignore with Reason"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            MODAL: FIX DATA
            Quick Remediation Dialog for structural schedule / execution flaws
            ========================================================================= */}
        <Modal
          isOpen={!!fixingIssue}
          onClose={() => setFixingIssue(null)}
          title={`Remediate Data Issue: ${fixingIssue?.id || ''}`}
          subtitle={`Object: ${fixingIssue?.objectId} (${fixingIssue?.objectName})`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full text-xs">
              <button
                type="button"
                onClick={() => setFixingIssue(null)}
                className="px-4 py-2 font-semibold text-[#596579] hover:text-[#172033]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyFix}
                className="px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white font-bold rounded-lg shadow-xs"
              >
                Apply Correction & Resolve
              </button>
            </div>
          }
        >
          {fixingIssue && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">
                  Structural Diagnosis
                </span>
                <p className="text-[#172033] font-medium leading-relaxed">
                  {fixingIssue.description}
                </p>
              </div>

              {/* Before vs After Correction Fields */}
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-[#FBEFEE]/60 border border-[#E4B0AA] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#B5473C] block">
                    Current Faulty Value ({fixingIssue.fixPayload?.fieldToFix})
                  </span>
                  <div className="font-mono text-xs text-[#172033] font-bold">
                    {fixingIssue.fixPayload?.currentValue}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#176B87] block">
                    Corrected Value to Write into Project Data *
                  </label>
                  <input
                    type="text"
                    value={fixedValue}
                    onChange={(e) => setFixedValue(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#176B87] rounded-lg font-mono text-xs text-[#172033] font-bold outline-none ring-1 ring-[#176B87]"
                  />
                  <span className="text-[10px] text-[#8A94A6]">
                    Suggested value: {fixingIssue.fixPayload?.suggestedValue}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#EDF5F8] border border-[#B3CBE0] text-[11px] text-[#596579] flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-[#176B87] shrink-0 mt-0.5" />
                <span>
                  Remediation will update schedule working model and recalculate downstream Critical Path relationships.
                </span>
              </div>
            </div>
          )}
        </Modal>

        {/* =========================================================================
            MODAL: IGNORE WITH REASON
            Mandatory justification required to suppress health check
            ========================================================================= */}
        <Modal
          isOpen={!!ignoringIssue}
          onClose={() => setIgnoringIssue(null)}
          title={`Ignore Health Check: ${ignoringIssue?.id || ''}`}
          subtitle={`Object: ${ignoringIssue?.objectId} (${ignoringIssue?.objectName})`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full text-xs">
              <button
                type="button"
                onClick={() => setIgnoringIssue(null)}
                className="px-4 py-2 font-semibold text-[#596579] hover:text-[#172033]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyIgnore}
                className="px-4 py-2 bg-[#B5473C] hover:bg-[#9B3C32] text-white font-bold rounded-lg shadow-xs"
              >
                Confirm & Ignore Check
              </button>
            </div>
          }
        >
          {ignoringIssue && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-[#FEF7EE] border border-[#ECD1A4] text-[#9A5B13] leading-relaxed">
                <strong>Attention:</strong> Suppressing this health check will mark it as &ldquo;Ignored&rdquo; in executive audit logs. A technical justification is required for compliance audits.
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#172033] block">
                  Mandatory Engineering Justification *
                </label>
                <textarea
                  rows={3}
                  value={ignoreReason}
                  onChange={(e) => setIgnoreReason(e.target.value)}
                  placeholder="e.g. Activity represents temporary contractor works outside EPC scope as authorized in meeting #14..."
                  className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg text-xs text-[#172033] outline-none focus:border-[#176B87] resize-none"
                />
              </div>
            </div>
          )}
        </Modal>

        {/* =========================================================================
            DRAWER: ISSUE DETAIL INSPECTION
            ========================================================================= */}
        <Drawer
          isOpen={!!selectedIssueForDetail}
          onClose={() => setSelectedIssueForDetail(null)}
          title={`Issue Diagnostic: ${selectedIssueForDetail?.id || ''}`}
          subtitle={selectedIssueForDetail?.objectName}
          width="md"
        >
          {selectedIssueForDetail && (
            <div className="space-y-5 text-xs p-1">
              <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#176B87]">
                    {selectedIssueForDetail.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedIssueForDetail.severity === 'Critical'
                        ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                        : 'bg-[#FEF7EE] text-[#9A5B13] border border-[#ECD1A4]'
                    }`}
                  >
                    {selectedIssueForDetail.severity}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#172033]">
                  {selectedIssueForDetail.objectName}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-[#596579]">
                  <span className="font-mono font-bold text-[#176B87]">
                    {selectedIssueForDetail.objectId}
                  </span>
                  <span>•</span>
                  <span>{selectedIssueForDetail.category}</span>
                  <span>•</span>
                  <span className="font-mono">Rule: {selectedIssueForDetail.rule}</span>
                </div>
              </div>

              {/* Problem Description */}
              <div className="p-3 rounded-lg bg-white border border-[#D9DEE5] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                  Problem Description
                </span>
                <p className="text-[#172033] leading-relaxed text-xs">
                  {selectedIssueForDetail.description}
                </p>
              </div>

              {/* Schedule / CPM Impact */}
              <div className="p-3 rounded-lg bg-[#FBEFEE]/40 border border-[#E4B0AA] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#B5473C] tracking-wider block">
                  Downstream CPM / Quality Impact
                </span>
                <p className="text-[#172033] leading-relaxed text-xs">
                  {selectedIssueForDetail.impactExplanation}
                </p>
              </div>

              {/* Actions Available */}
              <div className="space-y-2 pt-2 border-t border-[#D9DEE5]">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                  Remediation Actions
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedIssueForDetail.fixPayload && selectedIssueForDetail.status === 'Open' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenFixModal(selectedIssueForDetail);
                        setSelectedIssueForDetail(null);
                      }}
                      className="flex-1 py-2 px-3 bg-[#176B87] hover:bg-[#135A72] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Fix Data</span>
                    </button>
                  )}

                  {selectedIssueForDetail.objectType === 'SCHEDULE_ACTIVITY' && (
                    <Link
                      href="/schedule-twin"
                      className="flex-1 py-2 px-3 bg-white border border-[#D9DEE5] hover:bg-[#F0F2F5] text-[#172033] font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Activity</span>
                    </Link>
                  )}

                  {selectedIssueForDetail.status === 'Open' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenIgnoreModal(selectedIssueForDetail);
                        setSelectedIssueForDetail(null);
                      }}
                      className="py-2 px-3 bg-white border border-[#D9DEE5] hover:bg-[#FBEFEE] text-[#596579] hover:text-[#B5473C] font-semibold rounded-lg text-xs"
                    >
                      Ignore with Reason
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AppShell>
  );
}
