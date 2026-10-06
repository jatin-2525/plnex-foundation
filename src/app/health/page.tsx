'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { Modal } from '../../components/shared/Modal';
import { Drawer } from '../../components/shared/Drawer';
import {
  INITIAL_HEALTH_ISSUES,
  SCHEDULE_HEALTH_RULES,
  EXECUTION_DATA_QUALITY_RULES,
  HealthIssue,
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
  Lock,
  GitBranch,
  RefreshCw,
} from 'lucide-react';

export default function ScheduleHealthPage() {
  const router = useRouter();
  const { activeProject } = useApp();
  const { addToast } = useToast();

  // Primary Tabs: 'Schedule Health' vs 'Execution Data Quality'
  const [activeTab, setActiveTab] = useState<'Schedule Health' | 'Execution Data Quality'>('Schedule Health');

  // Issues State
  const [issues, setIssues] = useState<HealthIssue[]>(INITIAL_HEALTH_ISSUES);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Filters State
  const [selectedRuleFilter, setSelectedRuleFilter] = useState<string>('ALL');

  // Rule Audit Reference Mappings for Schedule Health and Execution Data Quality:
  // Schedule Health: 'Missing Activity IDs', 'Duplicate IDs', 'Invalid Dates', 'Missing Dependencies', 'Invalid Hierarchy', 'Missing WBS'
  // Execution Data Quality: 'Unmatched Events', 'Duplicate Events', 'Missing Values', 'Conflicting Reports', 'Low Confidence', 'Stale Events'
  const [severityFilter, setSeverityFilter] = useState<'ALL' | HealthSeverity>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | IssueStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Modals & Drawers
  const [selectedIssueForDetail, setSelectedIssueForDetail] = useState<HealthIssue | null>(null);
  const [fixingIssue, setFixingIssue] = useState<HealthIssue | null>(null);
  const [fixedValue, setFixedValue] = useState<string>('');

  // Active rules strictly isolated per tab (Do not mix categories)
  const currentRules = useMemo(() => {
    return activeTab === 'Schedule Health' ? SCHEDULE_HEALTH_RULES : EXECUTION_DATA_QUALITY_RULES;
  }, [activeTab]);

  // Filtered Issues strictly isolated for the active category
  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      // Must match active category (Strict isolation)
      if (iss.category !== activeTab) {
        return false;
      }
      // Rule filter
      if (selectedRuleFilter !== 'ALL' && iss.rule !== selectedRuleFilter) {
        return false;
      }
      // Severity filter
      if (severityFilter !== 'ALL') {
        const mappedSeverity = iss.severity === 'Needs Attention' ? 'Warning' : iss.severity;
        if (mappedSeverity !== severityFilter) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== 'ALL' && iss.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = iss.id.toLowerCase().includes(q);
        const matchesObj = iss.objectId.toLowerCase().includes(q) || iss.objectName.toLowerCase().includes(q);
        const matchesDesc = iss.description.toLowerCase().includes(q);
        const matchesRule = iss.rule.toLowerCase().includes(q) || iss.canonicalCategory.toLowerCase().includes(q);
        if (!matchesId && !matchesObj && !matchesDesc && !matchesRule) {
          return false;
        }
      }
      return true;
    });
  }, [issues, activeTab, selectedRuleFilter, severityFilter, statusFilter, searchQuery]);

  // Category Metrics (Isolated to current active tab)
  const metrics = useMemo(() => {
    const tabIssues = issues.filter((i) => i.category === activeTab);
    const criticalCount = tabIssues.filter((i) => i.severity === 'Critical' && i.status === 'Open').length;
    const warningCount = tabIssues.filter(
      (i) => (i.severity === 'Warning' || i.severity === 'Needs Attention') && i.status === 'Open'
    ).length;
    const resolvedCount = tabIssues.filter((i) => i.status === 'Resolved').length;

    // Rules where all open issues count is 0 are considered healthy
    const healthyRulesCount = currentRules.filter((r) => {
      const openForRule = tabIssues.filter((i) => i.rule === r.rule && i.status === 'Open').length;
      return openForRule === 0;
    }).length;

    return {
      total: tabIssues.length,
      criticalCount,
      warningCount,
      resolvedCount,
      healthyCount: healthyRulesCount,
      openCount: criticalCount + warningCount,
    };
  }, [issues, activeTab, currentRules]);

  // Run Health Scan Simulation
  const handleRunHealthScan = () => {
    setIsScanning(true);
    addToast({
      type: 'info',
      title: 'Integrity Audit Initiated',
      description: `Evaluating ${activeTab} across active project records...`,
    });

    setTimeout(() => {
      setIsScanning(false);
      addToast({
        type: 'success',
        title: `${activeTab} Audit Complete`,
        description: `Evaluated schedule network. Detected ${metrics.openCount} open items requiring resolution.`,
      });
    }, 700);
  };

  // Action 1: View
  const handleViewIssue = (issue: HealthIssue) => {
    setSelectedIssueForDetail(issue);
  };

  // Action 2: Fix
  const handleOpenFixModal = (issue: HealthIssue) => {
    setFixingIssue(issue);
    setFixedValue(issue.fixPayload?.suggestedValue || '');
  };

  const handleApplyFix = () => {
    if (!fixingIssue) return;

    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === fixingIssue.id) {
          return {
            ...iss,
            status: 'Resolved',
            resolvedAt: new Date().toISOString(),
          };
        }
        return iss;
      })
    );

    addToast({
      type: 'success',
      title: `Issue ${fixingIssue.id} Fixed`,
      description: `Updated ${fixingIssue.fixPayload?.fieldToFix || 'value'} to "${fixedValue}". Network updated.`,
    });

    setFixingIssue(null);
  };

  // Action 3: Review
  const handleReviewIssue = (issue: HealthIssue) => {
    if (issue.category === 'Execution Data Quality') {
      router.push(`/review?eventId=${encodeURIComponent(issue.objectId)}`);
      addToast({
        type: 'info',
        title: 'Navigating to Review Queue',
        description: `Opened human verification queue for ${issue.objectId}.`,
      });
    } else {
      setSelectedIssueForDetail(issue);
      addToast({
        type: 'info',
        title: 'Schedule Item Inspection',
        description: `Reviewing CPM constraints and dependency links for ${issue.objectId}.`,
      });
    }
  };

  // Action 4: Resolve
  const handleResolveIssue = (issue: HealthIssue) => {
    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === issue.id) {
          return {
            ...iss,
            status: 'Resolved',
            resolvedAt: new Date().toISOString(),
          };
        }
        return iss;
      })
    );

    addToast({
      type: 'success',
      title: `Issue ${issue.id} Marked Resolved`,
      description: `Issue verified and marked closed in health audit ledger.`,
    });
  };

  const handleResetFilters = () => {
    setSelectedRuleFilter('ALL');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
  };

  return (
    <StateWrapper>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Trust & Governance' },
            { label: 'Schedule Health', current: true },
          ]}
        />

        {/* =========================================================================
            HEADER & AUDIT ENGINE
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                  <Activity className="w-3.5 h-3.5" />
                  Audit Engine
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                  <CheckCircle2 className="w-3 h-3 text-[#2E7D5B]" />
                  Quality Guard Active
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] text-[#596579] bg-[#F7F8FA] border border-[#D9DEE5]">
                  {activeProject?.code || 'OIL-DUL-01'} · V3 · Rev 3.2
                </span>
              </div>

              <h1 className="text-[28px] sm:text-3xl font-bold text-[#172033] tracking-tight">
                Schedule Health
              </h1>
              <p className="text-sm text-[#596579] mt-1 max-w-3xl">
                Independent audit engine separating baseline CPM schedule logic from field execution data quality.
              </p>
            </div>

            {/* Actions: Scan Trigger */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRunHealthScan}
                disabled={isScanning}
                className="px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Running Audit...' : 'Re-scan Project Health'}</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              PRIMARY TABS: Schedule Health | Execution Data Quality
              Strict Category Separation - Do Not Mix
              ========================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-[#D9DEE5]/60 gap-3">
            <div className="flex items-center bg-[#F1F3F5] p-1 rounded-lg border border-[#D9DEE5] self-start">
              {/* Tab 1: Schedule Health */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('Schedule Health');
                  setSelectedRuleFilter('ALL');
                }}
                className={`flex items-center gap-2.5 px-5 py-2 text-xs font-bold rounded-md transition-all ${
                  activeTab === 'Schedule Health'
                    ? 'bg-white text-[#172033] shadow-xs border border-[#D9DEE5]'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                <Calendar className="w-4 h-4 text-[#176B87]" />
                <span>Schedule Health</span>
                <span
                  className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                    activeTab === 'Schedule Health'
                      ? 'bg-[#EDF5F8] text-[#176B87]'
                      : 'bg-[#D9DEE5] text-[#596579]'
                  }`}
                >
                  {issues.filter((i) => i.category === 'Schedule Health' && i.status === 'Open').length} Open
                </span>
              </button>

              {/* Tab 2: Execution Data Quality */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('Execution Data Quality');
                  setSelectedRuleFilter('ALL');
                }}
                className={`flex items-center gap-2.5 px-5 py-2 text-xs font-bold rounded-md transition-all ${
                  activeTab === 'Execution Data Quality'
                    ? 'bg-white text-[#172033] shadow-xs border border-[#D9DEE5]'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                <FileText className="w-4 h-4 text-[#176B87]" />
                <span>Execution Data Quality</span>
                <span
                  className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                    activeTab === 'Execution Data Quality'
                      ? 'bg-[#EDF5F8] text-[#176B87]'
                      : 'bg-[#D9DEE5] text-[#596579]'
                  }`}
                >
                  {issues.filter((i) => i.category === 'Execution Data Quality' && i.status === 'Open').length} Open
                </span>
              </button>
            </div>

            {/* Severity Breakdown: Healthy | Warning | Critical */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <div
                className="px-2.5 py-1.5 rounded bg-[#EDF7F2] border border-[#B8DCC9] text-[#2E7D5B] font-bold flex items-center gap-1.5"
                title="Checks in healthy state with zero open violations"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5B]" />
                <span>Healthy</span>
              </div>
              <div
                className="px-2.5 py-1.5 rounded bg-[#FDF6ED] border border-[#F0D4A6] text-[#8C5311] font-bold flex items-center gap-1.5"
                title="Moderate risk or data hygiene warning requiring review"
              >
                <AlertCircle className="w-3.5 h-3.5 text-[#8C5311]" />
                <span>{metrics.warningCount} Warning</span>
              </div>
              <div
                className="px-2.5 py-1.5 rounded bg-[#FBEFEE] border border-[#E4B0AA] text-[#9E332A] font-bold flex items-center gap-1.5"
                title="Critical CPM logic breakdown or severe data integrity failure"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#9E332A]" />
                <span>{metrics.criticalCount} Critical</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CHECK CARDS STRIP (6 Categories Strictly Per Tab)
            Schedule Health:
              - broken hierarchy
              - invalid dates
              - missing dependencies
              - duplicate activities
              - WBS issues
              - schedule conflicts
            Execution Data Quality:
              - missing quantity
              - missing unit
              - ambiguous field event
              - missing evidence
              - unmatched event
              - duplicate event
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#D9DEE5]/60 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                {activeTab} Checks (6 Categories):
              </span>
              <span className="text-[11px] text-[#596579]">
                {activeTab === 'Schedule Health'
                  ? 'CPM network logic, calendar constraints & WBS structure'
                  : 'Field diary completeness, measurement units & matching hygiene'}
              </span>
            </div>
            <span className="text-[11px] text-[#596579]">
              Click any check to filter the Issue Table
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {currentRules.map((ruleItem) => {
              const ruleIssues = issues.filter(
                (i) => i.category === activeTab && i.rule === ruleItem.rule && i.status === 'Open'
              );
              const isSelected = selectedRuleFilter === ruleItem.rule;
              const hasCritical = ruleIssues.some((i) => i.severity === 'Critical');
              const hasWarning = ruleIssues.some((i) => i.severity === 'Warning' || i.severity === 'Needs Attention');

              // Determine severity badge: Healthy | Warning | Critical
              const ruleSeverity = ruleIssues.length === 0 ? 'Healthy' : hasCritical ? 'Critical' : 'Warning';

              return (
                <button
                  key={ruleItem.rule}
                  type="button"
                  onClick={() =>
                    setSelectedRuleFilter(isSelected ? 'ALL' : ruleItem.rule)
                  }
                  className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#176B87] bg-[#EDF5F8] ring-1 ring-[#176B87]'
                      : 'border-[#D9DEE5] bg-[#F7F8FA] hover:bg-white hover:border-[#176B87]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${
                        ruleSeverity === 'Healthy'
                          ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                          : ruleSeverity === 'Critical'
                          ? 'bg-[#FBEFEE] text-[#9E332A] border border-[#E4B0AA]'
                          : 'bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]'
                      }`}
                    >
                      {ruleSeverity === 'Healthy' && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {ruleSeverity === 'Critical' && <AlertTriangle className="w-2.5 h-2.5" />}
                      {ruleSeverity === 'Warning' && <AlertCircle className="w-2.5 h-2.5" />}
                      {ruleSeverity}
                    </span>
                    <span className="text-[10px] font-mono text-[#596579]">
                      {ruleIssues.length} open
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-[#172033] line-clamp-1" title={ruleItem.name}>
                      {ruleItem.name}
                    </div>
                    <div className="text-[10px] font-mono text-[#596579] mt-0.5">
                      {ruleItem.canonicalTerm}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            SEARCH & SECONDARY FILTER BAR
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-[#7B8798] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues by rule, object ID, or description..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Severity Filter: Healthy | Warning | Critical */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-xs font-medium text-[#172033] outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="Warning">Warning</option>
                <option value="Healthy">Healthy</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-xs font-medium text-[#172033] outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Resolved">Resolved</option>
                <option value="In Review">In Review</option>
              </select>

              {(selectedRuleFilter !== 'ALL' || severityFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-1 text-xs text-[#9E332A] hover:bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            CANONICAL ISSUE TABLE
            Columns (Exact 7):
            Issue | Severity | Object | Description | Detected | Status | Action
            Actions (Exact 4):
            View | Fix | Review | Resolve
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[10px] uppercase font-bold text-[#7B8798] tracking-wider">
                  <th className="py-3 px-4 whitespace-nowrap">Issue</th>
                  <th className="py-3 px-3 whitespace-nowrap">Severity</th>
                  <th className="py-3 px-4 whitespace-nowrap">Object</th>
                  <th className="py-3 px-4 min-w-[280px]">Description</th>
                  <th className="py-3 px-3 whitespace-nowrap">Detected</th>
                  <th className="py-3 px-3 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5]">
                {filteredIssues.map((issue) => {
                  const effectiveSeverity =
                    issue.severity === 'Needs Attention' ? 'Warning' : issue.severity;

                  return (
                    <tr
                      key={issue.id}
                      className="hover:bg-[#F9FAFC] transition-colors group"
                    >
                      {/* 1. Issue (Rule + Issue ID) */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-bold text-[#172033] block">
                            {issue.rule}
                          </span>
                          <span className="font-mono text-[10px] text-[#176B87] bg-[#EDF5F8] px-1.5 py-0.2 rounded border border-[#B3CBE0] inline-block">
                            {issue.id}
                          </span>
                        </div>
                      </td>

                      {/* 2. Severity: Healthy | Warning | Critical */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        {effectiveSeverity === 'Critical' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FBEFEE] text-[#9E332A] border border-[#E4B0AA]">
                            <AlertTriangle className="w-3 h-3" />
                            Critical
                          </span>
                        ) : effectiveSeverity === 'Warning' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]">
                            <AlertCircle className="w-3 h-3" />
                            Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                            <CheckCircle2 className="w-3 h-3" />
                            Healthy
                          </span>
                        )}
                      </td>

                      {/* 3. Object */}
                      <td className="py-3.5 px-4 align-top max-w-[200px]">
                        <div>
                          <span className="font-mono font-bold text-[#176B87] block truncate">
                            {issue.objectId}
                          </span>
                          <span className="text-[11px] text-[#596579] line-clamp-1">
                            {issue.objectName}
                          </span>
                        </div>
                      </td>

                      {/* 4. Description */}
                      <td className="py-3.5 px-4 align-top">
                        <p className="text-xs text-[#172033] leading-relaxed">
                          {issue.description}
                        </p>
                        <p className="text-[11px] text-[#596579] mt-0.5 italic">
                          Impact: {issue.impactExplanation}
                        </p>
                      </td>

                      {/* 5. Detected */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap font-mono text-[11px] text-[#596579]">
                        {issue.detected || issue.detectedAt}
                      </td>

                      {/* 6. Status */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            issue.status === 'Resolved'
                              ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                              : issue.status === 'Open'
                              ? 'bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]'
                              : 'bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5]'
                          }`}
                        >
                          {issue.status}
                        </span>
                      </td>

                      {/* 7. Action: View | Fix | Review | Resolve */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Action: View */}
                          <button
                            type="button"
                            onClick={() => handleViewIssue(issue)}
                            className="px-2 py-1 text-[11px] font-bold text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5] border border-[#D9DEE5] rounded transition-colors"
                            title="View complete issue details"
                          >
                            View
                          </button>

                          {/* Action: Fix */}
                          {issue.fixPayload && issue.status !== 'Resolved' && (
                            <button
                              type="button"
                              onClick={() => handleOpenFixModal(issue)}
                              className="px-2 py-1 text-[11px] font-bold text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded transition-colors"
                              title="Apply suggested data repair"
                            >
                              Fix
                            </button>
                          )}

                          {/* Action: Review */}
                          {issue.status !== 'Resolved' && (
                            <button
                              type="button"
                              onClick={() => handleReviewIssue(issue)}
                              className="px-2 py-1 text-[11px] font-bold text-[#8C5311] hover:bg-[#FDF6ED] border border-[#F0D4A6] rounded transition-colors"
                              title="Inspect in review queue"
                            >
                              Review
                            </button>
                          )}

                          {/* Action: Resolve */}
                          {issue.status !== 'Resolved' ? (
                            <button
                              type="button"
                              onClick={() => handleResolveIssue(issue)}
                              className="px-2 py-1 text-[11px] font-bold text-[#2E7D5B] hover:bg-[#EDF7F2] border border-[#B8DCC9] rounded transition-colors"
                              title="Mark issue resolved"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#2E7D5B] font-mono font-bold px-1.5 py-0.5">
                              ✓ Done
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-[#F7F8FA] border-t border-[#D9DEE5] flex items-center justify-between text-xs text-[#596579]">
            <span>Category: <strong className="text-[#172033]">{activeTab}</strong></span>
            <span>Total Shown: <strong className="font-mono text-[#172033]">{filteredIssues.length}</strong></span>
          </div>
        </div>

        {/* =========================================================================
            DRAWER: ISSUE DETAILS INSPECTION (View Action)
            ========================================================================= */}
        <Drawer
          isOpen={Boolean(selectedIssueForDetail)}
          onClose={() => setSelectedIssueForDetail(null)}
          title={`Health Issue Details: ${selectedIssueForDetail?.id || ''}`}
          subtitle={`${selectedIssueForDetail?.category || ''} · ${selectedIssueForDetail?.rule || ''}`}
          width="lg"
        >
          {selectedIssueForDetail && (
            <div className="space-y-5 text-xs p-1">
              <div className="p-3.5 bg-[#F7F8FA] rounded-lg border border-[#D9DEE5] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-[#7B8798]">Affected Object</span>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#EDF5F8] text-[#176B87]">
                    {selectedIssueForDetail.objectType}
                  </span>
                </div>
                <div className="font-mono font-bold text-sm text-[#172033]">
                  {selectedIssueForDetail.objectId}
                </div>
                <div className="text-xs text-[#596579]">
                  {selectedIssueForDetail.objectName}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#7B8798]">Problem Description</span>
                <p className="text-xs text-[#172033] leading-relaxed p-3 bg-white border border-[#D9DEE5] rounded-lg">
                  {selectedIssueForDetail.description}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#7B8798]">Project CPM / EVM Impact</span>
                <p className="text-xs text-[#9E332A] leading-relaxed p-3 bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg">
                  {selectedIssueForDetail.impactExplanation}
                </p>
              </div>

              {selectedIssueForDetail.fixPayload && (
                <div className="space-y-2 p-3.5 bg-[#EDF7F2] border border-[#B8DCC9] rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-[#2E7D5B] block">
                    Suggested Remediation
                  </span>
                  <div className="text-xs space-y-1">
                    <div>Field: <strong className="font-mono">{selectedIssueForDetail.fixPayload.fieldToFix}</strong></div>
                    <div>Current: <span className="font-mono text-[#9E332A]">{selectedIssueForDetail.fixPayload.currentValue}</span></div>
                    <div>Suggested: <span className="font-mono text-[#2E7D5B] font-bold">{selectedIssueForDetail.fixPayload.suggestedValue}</span></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenFixModal(selectedIssueForDetail);
                      setSelectedIssueForDetail(null);
                    }}
                    className="mt-2 px-3 py-1.5 text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#25664A] rounded-lg shadow-xs"
                  >
                    Open Fix Tool &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </Drawer>

        {/* =========================================================================
            MODAL: FIX DATA (Fix Action)
            ========================================================================= */}
        <Modal
          isOpen={Boolean(fixingIssue)}
          onClose={() => setFixingIssue(null)}
          title={`Remediate Data Issue: ${fixingIssue?.id || ''}`}
          subtitle={`Rule: ${fixingIssue?.rule || ''} · Target: ${fixingIssue?.objectId || ''}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setFixingIssue(null)}
                className="px-3 py-1.5 text-xs text-[#596579] hover:text-[#172033]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyFix}
                className="px-4 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-xs"
              >
                Apply &amp; Resolve Issue
              </button>
            </div>
          }
        >
          {fixingIssue && (
            <div className="space-y-4 text-xs">
              <p className="text-[#596579]">
                Updating <strong>{fixingIssue.fixPayload?.fieldToFix}</strong> on object{' '}
                <strong className="font-mono">{fixingIssue.objectId}</strong>.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-[#172033] mb-1">
                  New Value:
                </label>
                <input
                  type="text"
                  value={fixedValue}
                  onChange={(e) => setFixedValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg font-mono outline-none focus:border-[#176B87]"
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </StateWrapper>
  );
}
