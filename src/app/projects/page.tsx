'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { PageHeader } from '../../components/shared/PageHeader';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { Modal } from '../../components/shared/Modal';
import { projectService } from '../../lib/api/projectService';
import { PortfolioProject, ProjectScheduleHealth } from '../../types';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  X,
  ExternalLink,
  Calendar,
  ClipboardList,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  Download,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
  FileCheck,
  Check,
  ChevronDown,
} from 'lucide-react';

export default function ProjectsPage() {
  const router = useRouter();
  const { allProjects, setActiveProjectId, addProject } = useApp();
  const { addToast } = useToast();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [updatedFilter, setUpdatedFilter] = useState<string>('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProjectForReport, setSelectedProjectForReport] = useState<PortfolioProject | null>(null);

  // New Project Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    organization: 'Oil India Limited',
    location: '',
    contractor: '',
    projectManager: '',
    siteEngineer: '',
    startDate: '2026-10-01',
    targetCompletionDate: '2027-05-31',
    budget: '₹ 120.00 Cr',
    scheduleVersion: 'Rev 1.0 (P6 XML)',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs = [
    { label: 'Portfolio' },
    { label: 'Projects Directory', current: true },
  ];

  // Unique organizations list from data
  const organizationOptions = useMemo(() => {
    const orgs = Array.from(new Set(allProjects.map((p) => p.organization)));
    return orgs;
  }, [allProjects]);

  // Filtering Logic
  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      // Search: Project ID / Name / Contractor / Location
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          project.id.toLowerCase().includes(query) ||
          project.code.toLowerCase().includes(query) ||
          project.name.toLowerCase().includes(query) ||
          project.organization.toLowerCase().includes(query) ||
          project.contractor.toLowerCase().includes(query) ||
          project.location.toLowerCase().includes(query);

        if (!matchesQuery) return false;
      }

      // Filter: Status
      if (statusFilter !== 'all' && project.status !== statusFilter) {
        return false;
      }

      // Filter: Organization
      if (organizationFilter !== 'all' && project.organization !== organizationFilter) {
        return false;
      }

      // Filter: Schedule Health
      if (healthFilter !== 'all') {
        if (healthFilter === 'healthy' && project.scheduleHealth !== 'healthy') {
          return false;
        }
        if (healthFilter === 'critical-slip' && project.scheduleHealth !== 'critical-slip') {
          return false;
        }
        if (healthFilter === 'near-critical' && project.scheduleHealth !== 'near-critical') {
          return false;
        }
      }

      // Filter: Updated Date
      if (updatedFilter !== 'all') {
        const now = new Date('2026-09-18T20:00:00Z').getTime();
        const lastUpdatedTime = project.lastUpdated ? new Date(project.lastUpdated).getTime() : 0;
        const diffHours = (now - lastUpdatedTime) / (1000 * 60 * 60);

        if (updatedFilter === 'today' && diffHours > 24) {
          return false;
        }
        if (updatedFilter === '7days' && diffHours > 24 * 7) {
          return false;
        }
        if (updatedFilter === '30days' && diffHours > 24 * 30) {
          return false;
        }
      }

      return true;
    });
  }, [allProjects, searchQuery, statusFilter, organizationFilter, healthFilter, updatedFilter]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== 'all' ||
    organizationFilter !== 'all' ||
    healthFilter !== 'all' ||
    updatedFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setOrganizationFilter('all');
    setHealthFilter('all');
    setUpdatedFilter('all');
  };

  // Portfolio Overview Aggregate Metrics
  const portfolioStats = useMemo(() => {
    const total = allProjects.length;
    if (total === 0) return { total: 0, onTrack: 0, atRiskDelayed: 0, avgProgress: 0, totalReviews: 0, totalRisks: 0 };

    const onTrack = allProjects.filter((p) => p.status === 'on-track' || p.status === 'completed').length;
    const atRiskDelayed = allProjects.filter((p) => p.status === 'at-risk' || p.status === 'delayed').length;
    const avgProgress = Math.round(
      allProjects.reduce((acc, curr) => acc + curr.overallProgress, 0) / total
    );
    const totalReviews = allProjects.reduce((acc, curr) => acc + (curr.openReviews || 0), 0);
    const totalRisks = allProjects.reduce((acc, curr) => acc + (curr.openRisks || 0), 0);

    return { total, onTrack, atRiskDelayed, avgProgress, totalReviews, totalRisks };
  }, [allProjects]);

  // Action Handlers
  const handleOpenProject = (project: PortfolioProject) => {
    setActiveProjectId(project.id);
    router.push('/dashboard');
  };

  const handleOpenSchedule = (project: PortfolioProject) => {
    setActiveProjectId(project.id);
    router.push('/schedule');
  };

  const handleOpenFieldCapture = (project: PortfolioProject) => {
    setActiveProjectId(project.id);
    router.push('/field');
  };

  const handleOpenReports = (project: PortfolioProject) => {
    setSelectedProjectForReport(project);
  };

  // Form Submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Project Name is required';
    if (!formData.code.trim()) errors.code = 'Project Code / ID is required';
    if (!formData.location.trim()) errors.location = 'Asset Location is required';
    if (!formData.contractor.trim()) errors.contractor = 'Contractor consortium is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      const generatedId = `PRJ-OIL-2026-${String(allProjects.length + 1).padStart(2, '0')}`;
      const res = await projectService.createProject({
        id: generatedId,
        code: formData.code.toUpperCase(),
        name: formData.name,
        organization: formData.organization,
        location: formData.location,
        contractor: formData.contractor,
        projectManager: formData.projectManager || 'Rajesh Sharma, Chief Project Controls Manager',
        siteEngineer: formData.siteEngineer || 'Debajit Borah, Lead Site Execution Engineer',
        startDate: formData.startDate,
        targetCompletionDate: formData.targetCompletionDate,
        budget: formData.budget,
        scheduleVersion: formData.scheduleVersion,
        overallProgress: 0,
        plannedProgress: 0,
        variance: 0,
        delayedCount: 0,
        atRiskCount: 0,
        completedCount: 0,
        status: 'on-track',
        scheduleHealth: 'healthy',
        openReviews: 0,
        openRisks: 0,
        lastUpdated: new Date().toISOString(),
      });

      if (res.data) {
        addProject(res.data);
        setActiveProjectId(res.data.id);
        addToast({
          type: 'success',
          title: 'Project Registered Successfully',
          description: `Created ${res.data.name} (${res.data.code}) with baseline ${res.data.scheduleVersion}.`,
        });
        setIsCreateModalOpen(false);
        setFormData({
          code: '',
          name: '',
          organization: 'Oil India Limited',
          location: '',
          contractor: '',
          projectManager: '',
          siteEngineer: '',
          startDate: '2026-10-01',
          targetCompletionDate: '2027-05-31',
          budget: '₹ 120.00 Cr',
          scheduleVersion: 'Rev 1.0 (P6 XML)',
        });
      }
    } catch {
      addToast({
        type: 'critical',
        title: 'Project Creation Failed',
        description: 'Unable to commit project parameters to portfolio database.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (iso?: string) => {
    if (!iso) return 'Not recorded';
    try {
      const date = new Date(iso);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ', ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' UTC';
    } catch {
      return iso;
    }
  };

  const getHealthBadge = (health?: ProjectScheduleHealth) => {
    switch (health) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B]" />
            Healthy
          </span>
        );
      case 'near-critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D98B32]" />
            Float Erosion
          </span>
        );
      case 'critical-slip':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B5473C]" />
            Critical Path Slip
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#596579]" />
            Standard
          </span>
        );
    }
  };

  return (
    <StateWrapper>
      <div className="space-y-6 pb-12">
        <Breadcrumbs items={breadcrumbs} />

        {/* Enterprise Page Header */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded bg-[#EDF5F8] flex items-center justify-center text-[#176B87]">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#172033] tracking-tight">Projects</h1>
                </div>
              </div>
              <p className="text-xs text-[#596579]">
                Portfolio-level navigation, baseline schedule registries, and planning-to-execution alignment across operational assets.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  addToast({
                    type: 'info',
                    title: 'Portfolio Refreshed',
                    description: 'Schedule baselines and execution counters synchronized with central repository.',
                  });
                }}
                className="px-3 py-2 text-xs font-medium text-[#596579] hover:text-[#172033] bg-[#F7F8FA] hover:bg-[#D9DEE5] border border-[#D9DEE5] rounded-md transition-colors inline-flex items-center gap-2"
                title="Refresh project list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded-md transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Project</span>
              </button>
            </div>
          </div>

          {/* Portfolio Metrics Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-[#D9DEE5]">
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded">
              <span className="text-[11px] text-[#596579] font-medium block">Total Projects</span>
              <span className="text-lg font-bold text-[#172033] font-mono">{portfolioStats.total}</span>
            </div>
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded">
              <span className="text-[11px] text-[#2E7D5B] font-medium block">On Track / Complete</span>
              <span className="text-lg font-bold text-[#2E7D5B] font-mono">{portfolioStats.onTrack}</span>
            </div>
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded">
              <span className="text-[11px] text-[#D98B32] font-medium block">At Risk / Delayed</span>
              <span className="text-lg font-bold text-[#D98B32] font-mono">{portfolioStats.atRiskDelayed}</span>
            </div>
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded">
              <span className="text-[11px] text-[#596579] font-medium block">Portfolio Avg Progress</span>
              <span className="text-lg font-bold text-[#176B87] font-mono">{portfolioStats.avgProgress}%</span>
            </div>
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded">
              <span className="text-[11px] text-[#596579] font-medium block">Open Reviews</span>
              <span className="text-lg font-bold text-[#172033] font-mono">
                {portfolioStats.totalReviews}{' '}
                <span className="text-[10px] text-[#596579] font-normal">items</span>
              </span>
            </div>
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded">
              <span className="text-[11px] text-[#B5473C] font-medium block">Critical Path Risks</span>
              <span className="text-lg font-bold text-[#B5473C] font-mono">
                {portfolioStats.totalRisks}{' '}
                <span className="text-[10px] text-[#596579] font-normal">chains</span>
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search: Project ID / Name */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Project ID, Name, Code, Location, or Contractor..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] focus:bg-white rounded-md text-[#172033] placeholder-[#7B8798] transition-colors outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7B8798] hover:text-[#172033]"
                  aria-label="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter 1: Status */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#596579] font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F7F8FA] hover:bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="on-track">On Track</option>
                  <option value="at-risk">At Risk</option>
                  <option value="delayed">Delayed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Filter 2: Organization */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#596579] font-medium">Organization:</span>
                <select
                  value={organizationFilter}
                  onChange={(e) => setOrganizationFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F7F8FA] hover:bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer max-w-[180px] truncate"
                >
                  <option value="all">All Organizations</option>
                  {organizationOptions.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 3: Schedule Health */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#596579] font-medium">Health:</span>
                <select
                  value={healthFilter}
                  onChange={(e) => setHealthFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F7F8FA] hover:bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer"
                >
                  <option value="all">All Health</option>
                  <option value="healthy">Healthy (0d float)</option>
                  <option value="near-critical">Float Erosion</option>
                  <option value="critical-slip">Critical Path Slip</option>
                </select>
              </div>

              {/* Filter 4: Updated Date */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#596579] font-medium">Updated:</span>
                <select
                  value={updatedFilter}
                  onChange={(e) => setUpdatedFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F7F8FA] hover:bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today (&lt; 24h)</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                </select>
              </div>

              {/* Clear filters button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 text-xs text-[#B5473C] hover:bg-[#FBEFEE] border border-[#E4B0AA] rounded-md transition-colors inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Active status result counter */}
          <div className="flex items-center justify-between text-xs text-[#596579] pt-2 border-t border-[#F1F3F5]">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="text-[#172033] font-mono">{filteredProjects.length}</strong> of{' '}
                <span className="font-mono">{allProjects.length}</span> projects
              </span>
              {hasActiveFilters && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#EDF5F8] text-[#176B87] font-medium">
                  Filters Active
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#7B8798]">
              Master Schedule Twin Baseline Engine
            </div>
          </div>
        </div>

        {/* Empty State: No Projects Created At All */}
        {allProjects.length === 0 ? (
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#EDF5F8] text-[#176B87] flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#172033] mb-1">No projects have been created.</h3>
            <p className="text-xs text-[#596579] max-w-md mx-auto mb-4">
              Initialize your project portfolio by uploading a Primavera P6 XML or MS Project baseline schedule file to begin tracking actual progress.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded-md transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Empty State: No Projects Match Current Query / Filters */
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-10 text-center">
            <div className="w-10 h-10 rounded-full bg-[#F1F3F5] text-[#596579] flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#172033] mb-1">No projects match the current filters</h3>
            <p className="text-xs text-[#596579] max-w-sm mx-auto mb-4">
              No project records matched your criteria ({searchQuery ? `"${searchQuery}"` : 'selected filters'}).
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-1.5 text-xs font-medium text-[#176B87] bg-[#EDF5F8] hover:bg-[#D9EAF0] rounded-md transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Projects Portfolio Data Table */
          <div className="bg-white border border-[#D9DEE5] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
                  <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[#596579] font-medium h-11">
                    <th className="py-3 px-4 whitespace-nowrap">Project ID</th>
                    <th className="py-3 px-4 whitespace-nowrap min-w-[240px]">Project Name</th>
                    <th className="py-3 px-4 whitespace-nowrap">Organization</th>
                    <th className="py-3 px-4 whitespace-nowrap">Schedule Version</th>
                    <th className="py-3 px-4 whitespace-nowrap min-w-[190px]">Overall Progress</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">Open Reviews</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">Open Risks</th>
                    <th className="py-3 px-4 whitespace-nowrap">Last Updated</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DEE5]/60">
                  {filteredProjects.map((project) => {
                    const varianceDelta = project.overallProgress - project.plannedProgress;
                    const hasNegativeVariance = varianceDelta < 0;

                    return (
                      <tr
                        key={project.id}
                        className="h-11 sm:h-12 hover:bg-[#F9FAFC] transition-colors group"
                      >
                        {/* 1. Project ID */}
                        <td className="py-3 px-4 align-middle">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-[#176B87] tracking-tight">
                              {project.id}
                            </span>
                            <span className="font-mono text-[10px] text-[#596579]">
                              {project.code}
                            </span>
                          </div>
                        </td>

                        {/* 2. Project Name */}
                        <td className="py-3 px-4 align-middle">
                          <div>
                            <button
                              type="button"
                              onClick={() => handleOpenProject(project)}
                              className="font-semibold text-[#172033] hover:text-[#176B87] text-left transition-colors flex items-center gap-1"
                            >
                              <span>{project.name}</span>
                              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#176B87] transition-opacity flex-shrink-0" />
                            </button>
                            <div className="flex items-center gap-2 text-[11px] text-[#596579] mt-0.5">
                              <span>{project.location}</span>
                              <span>•</span>
                              <span className="truncate max-w-[200px]" title={project.contractor}>
                                {project.contractor}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Organization */}
                        <td className="py-3 px-4 align-middle whitespace-nowrap">
                          <span className="text-[#172033] font-medium flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-[#596579] flex-shrink-0" />
                            <span>{project.organization}</span>
                          </span>
                        </td>

                        {/* 4. Schedule Version */}
                        <td className="py-3 px-4 align-middle whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-medium text-[#172033] bg-[#F1F3F5] px-2 py-0.5 rounded border border-[#D9DEE5] inline-block w-fit">
                              {project.scheduleVersion || 'Rev 1.0 (P6 XML)'}
                            </span>
                            <div className="mt-1">
                              {getHealthBadge(project.scheduleHealth)}
                            </div>
                          </div>
                        </td>

                        {/* 5. Overall Progress */}
                        <td className="py-3 px-4 align-middle">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="font-bold text-[#172033]">
                                Actual: {project.overallProgress}%
                              </span>
                              <span className="text-[#596579]">
                                Target: {project.plannedProgress}%
                              </span>
                            </div>
                            <ProgressBar
                              actual={project.overallProgress}
                              planned={project.plannedProgress}
                              size="sm"
                              status={project.status}
                              showLabels={false}
                            />
                            <div className="flex items-center justify-between text-[10px]">
                              <span
                                className={`font-mono font-medium ${
                                  hasNegativeVariance ? 'text-[#B5473C]' : 'text-[#2E7D5B]'
                                }`}
                              >
                                {varianceDelta > 0 ? `+${varianceDelta}%` : `${varianceDelta}%`} Var
                              </span>
                              <span className="text-[#7B8798]">
                                {project.completedCount} pkg done
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 6. Open Reviews */}
                        <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                          {(project.openReviews || 0) > 0 ? (
                            <Link
                              href="/matching"
                              onClick={() => setActiveProjectId(project.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6] hover:bg-[#F9ECCF] transition-colors"
                              title="Click to view match verification queue"
                            >
                              <AlertTriangle className="w-3 h-3 text-[#D98B32]" />
                              <span>{project.openReviews} pending</span>
                            </Link>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono text-[#2E7D5B] bg-[#EDF7F2]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>0 items</span>
                            </span>
                          )}
                        </td>

                        {/* 7. Open Risks */}
                        <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                          {(project.openRisks || 0) > 0 ? (
                            <Link
                              href="/variance"
                              onClick={() => setActiveProjectId(project.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] hover:bg-[#FBE5E1] transition-colors"
                              title="Click to view critical path delay chains"
                            >
                              <AlertCircle className="w-3 h-3 text-[#B5473C]" />
                              <span>{project.openRisks} risks</span>
                            </Link>
                          ) : (
                            <span className="text-xs font-mono text-[#7B8798]">None</span>
                          )}
                        </td>

                        {/* 8. Last Updated */}
                        <td className="py-3 px-4 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-2 text-xs text-[#596579]">
                            <Clock className="w-3.5 h-3.5 text-[#7B8798] flex-shrink-0" />
                            <span className="font-mono text-[11px]">
                              {formatTimestamp(project.lastUpdated)}
                            </span>
                          </div>
                        </td>

                        {/* 9. Status */}
                        <td className="py-3 px-4 align-middle whitespace-nowrap">
                          <StatusBadge status={project.status} size="sm" />
                        </td>

                        {/* 10. Actions */}
                        <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenProject(project)}
                              className="px-3 py-1 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded transition-colors inline-flex items-center gap-1"
                              title="Open Project Manager Dashboard"
                            >
                              <span>Open</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenSchedule(project)}
                              className="px-2 py-1 text-xs font-medium text-[#172033] bg-[#F7F8FA] hover:bg-[#D9DEE5] border border-[#D9DEE5] rounded transition-colors inline-flex items-center gap-1"
                              title="View Master Schedule WBS"
                            >
                              <Calendar className="w-3 h-3 text-[#596579]" />
                              <span className="hidden sm:inline">Schedule</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenFieldCapture(project)}
                              className="px-2 py-1 text-xs font-medium text-[#172033] bg-[#F7F8FA] hover:bg-[#D9DEE5] border border-[#D9DEE5] rounded transition-colors inline-flex items-center gap-1"
                              title="Go to Field Ingestion & Extraction"
                            >
                              <ClipboardList className="w-3 h-3 text-[#596579]" />
                              <span className="hidden sm:inline">Field Capture</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenReports(project)}
                              className="px-2 py-1 text-xs font-medium text-[#596579] hover:text-[#172033] bg-white hover:bg-[#F1F3F5] border border-[#D9DEE5] rounded transition-colors inline-flex items-center gap-1"
                              title="View Project Controls Reports & Dossier"
                            >
                              <FileText className="w-3 h-3 text-[#176B87]" />
                              <span className="hidden sm:inline">Reports</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-4 py-3 bg-[#F7F8FA] border-t border-[#D9DEE5] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#596579] gap-2">
              <div className="flex items-center gap-2">
                <span>Enterprise Portfolio Repository</span>
                <span>•</span>
                <span>Primavera P6 Baseline v22.12 XML Compatible</span>
              </div>
              <div className="font-mono text-[11px]">
                Active Project Scope: All Operational Assets
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create New Project */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Project"
          subtitle="Register a new infrastructure project baseline with work breakdown hierarchy."
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-medium text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSubmit}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded-md transition-colors inline-flex items-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Project...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Project</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project ID / Code */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Project Code / Tag <span className="text-[#B5473C]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. OIL-BGJ-05 or PRJ-OIL-2026-07"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className={`w-full px-3 py-2 text-xs bg-[#F7F8FA] border rounded-md font-mono text-[#172033] outline-none ${
                    formErrors.code ? 'border-[#B5473C]' : 'border-[#D9DEE5] focus:border-[#176B87] focus:bg-white'
                  }`}
                />
                {formErrors.code && (
                  <p className="text-[11px] text-[#B5473C] mt-1">{formErrors.code}</p>
                )}
              </div>

              {/* Organization */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Operating Organization <span className="text-[#B5473C]">*</span>
                </label>
                <select
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] focus:bg-white rounded-md text-[#172033] outline-none"
                >
                  <option value="Oil India Limited">Oil India Limited</option>
                  <option value="Numaligarh Refinery / OIL JV">Numaligarh Refinery / OIL JV</option>
                  <option value="Arunachal Asset (OIL)">Arunachal Asset (OIL)</option>
                  <option value="Rajasthan Exploration Project (OIL)">Rajasthan Exploration Project (OIL)</option>
                </select>
              </div>
            </div>

            {/* Project Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">
                Project Name <span className="text-[#B5473C]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Moran Compressor Station Modernization Phase-III"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 text-xs bg-[#F7F8FA] border rounded-md text-[#172033] outline-none ${
                  formErrors.name ? 'border-[#B5473C]' : 'border-[#D9DEE5] focus:border-[#176B87] focus:bg-white'
                }`}
              />
              {formErrors.name && (
                <p className="text-[11px] text-[#B5473C] mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Asset Location */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Asset Location <span className="text-[#B5473C]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Baghjan Field, Tinsukia, Assam"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={`w-full px-3 py-2 text-xs bg-[#F7F8FA] border rounded-md text-[#172033] outline-none ${
                    formErrors.location ? 'border-[#B5473C]' : 'border-[#D9DEE5] focus:border-[#176B87] focus:bg-white'
                  }`}
                />
                {formErrors.location && (
                  <p className="text-[11px] text-[#B5473C] mt-1">{formErrors.location}</p>
                )}
              </div>

              {/* Contractor Consortium */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Contractor / Consortium <span className="text-[#B5473C]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Larsen & Toubro Hydrocarbon Ltd."
                  value={formData.contractor}
                  onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
                  className={`w-full px-3 py-2 text-xs bg-[#F7F8FA] border rounded-md text-[#172033] outline-none ${
                    formErrors.contractor ? 'border-[#B5473C]' : 'border-[#D9DEE5] focus:border-[#176B87] focus:bg-white'
                  }`}
                />
                {formErrors.contractor && (
                  <p className="text-[11px] text-[#B5473C] mt-1">{formErrors.contractor}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Schedule Version */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Schedule Format &amp; Baseline
                </label>
                <select
                  value={formData.scheduleVersion}
                  onChange={(e) => setFormData({ ...formData, scheduleVersion: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] focus:bg-white rounded-md text-[#172033] outline-none"
                >
                  <option value="Rev 1.0 (P6 XML)">Rev 1.0 (Primavera P6 XML)</option>
                  <option value="Rev 1.0 (MS Project)">Rev 1.0 (MS Project XML)</option>
                  <option value="Rev 1.0 (Excel WBS)">Rev 1.0 (Standard WBS Excel)</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Baseline Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] focus:bg-white rounded-md text-[#172033] outline-none font-mono"
                />
              </div>

              {/* Target Completion */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Target Finish Date
                </label>
                <input
                  type="date"
                  value={formData.targetCompletionDate}
                  onChange={(e) => setFormData({ ...formData, targetCompletionDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] focus:bg-white rounded-md text-[#172033] outline-none font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-[#EDF5F8] rounded border border-[#C5DCE6] text-xs text-[#176B87] flex items-start gap-2">
              <Check className="w-4 h-4 text-[#176B87] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Automatic WBS Schedule Ingestion:</strong>
                <p className="mt-0.5 text-[11px] text-[#2C4A60]">
                  Upon creation, PLnEX will initialize the schedule twin hierarchy (L1-L6), enabling real-time site update matching and delay propagation.
                </p>
              </div>
            </div>
          </form>
        </Modal>

        {/* Modal: Project Controls Summary Report */}
        {selectedProjectForReport && (
          <Modal
            isOpen={Boolean(selectedProjectForReport)}
            onClose={() => setSelectedProjectForReport(null)}
            title={`Project Controls Dossier — ${selectedProjectForReport.code}`}
            subtitle={selectedProjectForReport.name}
            maxWidth="2xl"
            footer={
              <div className="flex items-center justify-between w-full">
                <div className="text-[11px] text-[#596579] font-mono">
                  Reporting Date: 18 Sep 2026
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      addToast({
                        type: 'info',
                        title: 'Schedule Dossier Exported',
                        description: `Exported ${selectedProjectForReport.code} schedule variance summary report as CSV.`,
                      });
                      setSelectedProjectForReport(null);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-[#172033] bg-[#F7F8FA] hover:bg-[#D9DEE5] border border-[#D9DEE5] rounded transition-colors inline-flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveProjectId(selectedProjectForReport.id);
                      router.push('/dashboard');
                    }}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded transition-colors inline-flex items-center gap-2"
                  >
                    <span>Open Dashboard</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            }
          >
            <div className="space-y-4 text-xs">
              {/* Executive Summary Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded">
                <div>
                  <span className="text-[11px] text-[#596579] block">Contractor</span>
                  <span className="font-semibold text-[#172033] truncate block">
                    {selectedProjectForReport.contractor}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#596579] block">Sanctioned Budget</span>
                  <span className="font-semibold text-[#172033] font-mono">
                    {selectedProjectForReport.budget}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#596579] block">Baseline Version</span>
                  <span className="font-semibold text-[#172033] font-mono">
                    {selectedProjectForReport.scheduleVersion}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#596579] block">Current Health</span>
                  <div className="mt-0.5">{getHealthBadge(selectedProjectForReport.scheduleHealth)}</div>
                </div>
              </div>

              {/* Progress & Variance Analysis */}
              <div className="border border-[#D9DEE5] rounded p-3 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Schedule Twin Physical Progress
                </h4>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span>Actual Progress: <strong className="text-[#176B87]">{selectedProjectForReport.overallProgress}%</strong></span>
                  <span>Planned Target: <strong>{selectedProjectForReport.plannedProgress}%</strong></span>
                  <span
                    className={`font-semibold ${
                      selectedProjectForReport.overallProgress < selectedProjectForReport.plannedProgress
                        ? 'text-[#B5473C]'
                        : 'text-[#2E7D5B]'
                    }`}
                  >
                    Net Variance: {selectedProjectForReport.overallProgress - selectedProjectForReport.plannedProgress}%
                  </span>
                </div>
                <ProgressBar
                  actual={selectedProjectForReport.overallProgress}
                  planned={selectedProjectForReport.plannedProgress}
                  size="md"
                  status={selectedProjectForReport.status}
                />
              </div>

              {/* Key Controls Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 border border-[#D9DEE5] rounded bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-[#D98B32]" />
                    <span className="font-semibold text-[#172033]">Match Verification Queue</span>
                  </div>
                  <p className="text-[#596579] text-[11px] mb-2">
                    Field execution updates requiring manager sign-off before committing to the schedule twin.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#172033]">
                      {selectedProjectForReport.openReviews || 0} Events Pending
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveProjectId(selectedProjectForReport.id);
                        router.push('/matching');
                      }}
                      className="text-[#176B87] hover:underline font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <span>Review Queue</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="p-3 border border-[#D9DEE5] rounded bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-[#B5473C]" />
                    <span className="font-semibold text-[#172033]">Critical Path Delays</span>
                  </div>
                  <p className="text-[#596579] text-[11px] mb-2">
                    Eroded downstream total float impacting commercial commissioning target dates.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#172033]">
                      {selectedProjectForReport.openRisks || 0} Delay Chains Active
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveProjectId(selectedProjectForReport.id);
                        router.push('/variance');
                      }}
                      className="text-[#176B87] hover:underline font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <span>Delay Analysis</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct Route Links */}
              <div className="pt-2 border-t border-[#D9DEE5] flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-[#596579]">
                  Fast Navigation into project modules:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProjectId(selectedProjectForReport.id);
                      router.push('/schedule');
                    }}
                    className="text-xs text-[#176B87] hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>WBS Schedule</span>
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProjectId(selectedProjectForReport.id);
                      router.push('/field');
                    }}
                    className="text-xs text-[#176B87] hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <ClipboardList className="w-3 h-3" />
                    <span>Field Capture</span>
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProjectId(selectedProjectForReport.id);
                      router.push('/evidence');
                    }}
                    className="text-xs text-[#176B87] hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <FileCheck className="w-3 h-3" />
                    <span>Evidence Vault</span>
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </StateWrapper>
  );
}
