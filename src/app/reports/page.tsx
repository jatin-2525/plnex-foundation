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
  REPORT_TEMPLATES,
  HISTORICAL_MEMORY_RECORDS,
  ReportTemplate,
  ReportBuilderConfig,
  HistoricalMemoryRecord,
} from '../../lib/domain/reportsAndMemory';
import { CANONICAL_SCHEDULE_VERSION_LABEL } from '../../lib/domain/canonicalModels';
import { DisciplineType } from '../../types';
import {
  FileText,
  TrendingUp,
  Clock,
  AlertTriangle,
  AlertCircle,
  Layers,
  ShieldCheck,
  Search,
  Filter,
  RotateCcw,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  FolderKanban,
  ExternalLink,
  BookOpen,
  ArrowRight,
  HardHat,
  Cpu,
  Sparkles,
  Zap,
  Lock,
  Hash,
  Copy,
  Check,
  History,
  Activity,
  Sliders,
  ChevronRight,
  CheckSquare,
  BarChart2,
} from 'lucide-react';

export default function ReportsAndMemoryPage() {
  const { activeProject } = useApp();
  const { addToast } = useToast();

  // Primary Navigation: REPORTS vs PROJECT MEMORY
  const [activeTab, setActiveTab] = useState<'reports' | 'memory'>('reports');

  // =========================================================================
  // REPORT BUILDER STATE
  // =========================================================================
  const [selectedReportId, setSelectedReportId] = useState<string>('REP-DPR');
  const [builderProject, setBuilderProject] = useState<string>('PRJ-OIL-2026-01');
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-09-18');
  const [scheduleVersion, setScheduleVersion] = useState<string>(CANONICAL_SCHEDULE_VERSION_LABEL);
  const [builderArea, setBuilderArea] = useState<string>('ALL');
  const [builderDiscipline, setBuilderDiscipline] = useState<string>('ALL');
  const [builderStatus, setBuilderStatus] = useState<string>('ALL');
  const [includeEvidence, setIncludeEvidence] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [includeCpmPath, setIncludeCpmPath] = useState<boolean>(true);

  // Preview Report Modal State
  const [previewReportOpen, setPreviewReportOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // =========================================================================
  // PROJECT MEMORY FILTERS STATE
  // - Date
  // - Project
  // - Discipline
  // - Activity Type
  // - Delay Cause
  // =========================================================================
  const [memoryYearFilter, setMemoryYearFilter] = useState<string>('ALL');
  const [memoryProjectFilter, setMemoryProjectFilter] = useState<string>('ALL');
  const [memoryDisciplineFilter, setMemoryDisciplineFilter] = useState<string>('ALL');
  const [memoryActivityTypeFilter, setMemoryActivityTypeFilter] = useState<string>('ALL');
  const [memoryDelayCauseFilter, setMemoryDelayCauseFilter] = useState<string>('ALL');
  const [memorySearch, setMemorySearch] = useState<string>('');

  // Selected Memory Record Drawer
  const [selectedMemoryRecord, setSelectedMemoryRecord] = useState<HistoricalMemoryRecord | null>(null);

  // Active Report Template Object
  const activeReportTemplate = useMemo(() => {
    return REPORT_TEMPLATES.find((r) => r.id === selectedReportId) || REPORT_TEMPLATES[0];
  }, [selectedReportId]);

  // Filtered Project Memory Records
  const filteredMemoryRecords = useMemo(() => {
    return HISTORICAL_MEMORY_RECORDS.filter((rec) => {
      // Date / Year filter
      if (memoryYearFilter !== 'ALL' && rec.year !== memoryYearFilter) {
        return false;
      }
      // Project filter
      if (memoryProjectFilter !== 'ALL' && rec.projectCode !== memoryProjectFilter) {
        return false;
      }
      // Discipline filter
      if (memoryDisciplineFilter !== 'ALL' && rec.discipline !== memoryDisciplineFilter) {
        return false;
      }
      // Activity Type filter
      if (memoryActivityTypeFilter !== 'ALL' && rec.activityType !== memoryActivityTypeFilter) {
        return false;
      }
      // Delay Cause filter
      if (memoryDelayCauseFilter !== 'ALL' && rec.delayCategory !== memoryDelayCauseFilter) {
        return false;
      }
      // Text search
      if (memorySearch.trim()) {
        const q = memorySearch.toLowerCase();
        const matchesTitle = rec.title.toLowerCase().includes(q);
        const matchesCode = rec.projectCode.toLowerCase().includes(q);
        const matchesDiscipline = rec.discipline.toLowerCase().includes(q);
        const matchesPattern = rec.disciplinePattern.toLowerCase().includes(q);
        const matchesCauses = rec.delayCauses.some((c) => c.toLowerCase().includes(q));
        const matchesMitigation = rec.mitigationLearned.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesDiscipline && !matchesPattern && !matchesCauses && !matchesMitigation) {
          return false;
        }
      }
      return true;
    });
  }, [
    memoryYearFilter,
    memoryProjectFilter,
    memoryDisciplineFilter,
    memoryActivityTypeFilter,
    memoryDelayCauseFilter,
    memorySearch,
  ]);

  // Reset Memory Filters
  const handleResetMemoryFilters = () => {
    setMemoryYearFilter('ALL');
    setMemoryProjectFilter('ALL');
    setMemoryDisciplineFilter('ALL');
    setMemoryActivityTypeFilter('ALL');
    setMemoryDelayCauseFilter('ALL');
    setMemorySearch('');
    addToast({
      type: 'info',
      title: 'Memory Filters Reset',
      description: 'Displaying all verified historical construction records.',
    });
  };

  // Action: Generate Report
  const handleGenerateReport = () => {
    setIsGenerating(true);
    addToast({
      type: 'info',
      title: `Generating ${activeReportTemplate.name}`,
      description: 'Synthesizing schedule baselines, field execution events, and verified evidence bindings...',
    });

    setTimeout(() => {
      setIsGenerating(false);
      setPreviewReportOpen(true);
      addToast({
        type: 'success',
        title: 'Report Generated Successfully',
        description: `${activeReportTemplate.name} compiled for ${startDate} to ${endDate}.`,
      });
    }, 700);
  };

  // Action: Export Report
  const handleExportReport = (format: 'PDF' | 'XLSX' | 'CSV') => {
    addToast({
      type: 'success',
      title: `Exporting ${format} Dossier`,
      description: `${activeReportTemplate.name} successfully exported as .${format.toLowerCase()} with SHA-256 seal.`,
    });
  };

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Controls & Compliance' },
    { label: 'Reports & Project Memory', current: true },
  ];

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            HEADER & PRIMARY NAVIGATION: REPORTS vs PROJECT MEMORY
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]/60">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <FolderKanban className="w-3.5 h-3.5" />
                  Documentation & Analytics
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                  <Lock className="w-3 h-3 text-[#2E7D5B]" />
                  Verified Historical Data · Non-Chatbot Engine
                </span>
              </div>

              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                Reports & Project Memory
              </h1>
              <p className="text-xs text-[#596579] mt-0.5 max-w-3xl">
                Generate audit-grade progress dossiers and query verified historical execution productivity, actual durations, and discipline delay patterns across upstream OIL projects.
              </p>
            </div>

            {/* Project Indicator */}
            <div className="flex items-center gap-2 text-xs font-mono text-[#596579] bg-[#F7F8FA] border border-[#D9DEE5] p-2 rounded-lg">
              <span className="text-[#8A94A6]">Active:</span>
              <strong className="text-[#172033]">{activeProject?.code || 'OIL-DUL-01'}</strong>
              <span>· Baseline: {CANONICAL_SCHEDULE_VERSION_LABEL}</span>
            </div>
          </div>

          {/* TWO PRIMARY TABS */}
          <div className="flex items-center justify-between pt-4 flex-wrap gap-3">
            <div className="flex items-center bg-[#F0F2F5] p-1 rounded-xl border border-[#D9DEE5]">
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'reports'
                    ? 'bg-white text-[#176B87] shadow-xs'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>REPORTS</span>
                <span
                  className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === 'reports'
                      ? 'bg-[#EDF5F8] text-[#176B87]'
                      : 'bg-[#E8EBF0] text-[#596579]'
                  }`}
                >
                  {REPORT_TEMPLATES.length} Templates
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('memory')}
                className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'memory'
                    ? 'bg-white text-[#176B87] shadow-xs'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>PROJECT MEMORY</span>
                <span
                  className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === 'memory'
                      ? 'bg-[#EDF5F8] text-[#176B87]'
                      : 'bg-[#E8EBF0] text-[#596579]'
                  }`}
                >
                  {HISTORICAL_MEMORY_RECORDS.length} Verified Records
                </span>
              </button>
            </div>

            <div className="text-xs text-[#596579] flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" />
              <span>Immutable Knowledge Base Online</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: REPORTS SECTION
            Available Reports & Report Builder
            ========================================================================= */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* AVAILABLE REPORTS CAROUSEL / GRID */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                    Available Report Templates
                  </h2>
                  <p className="text-xs text-[#596579]">
                    Select a report type to configure scope parameters in the Report Builder below.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#8A94A6]">7 Standard Formats</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {REPORT_TEMPLATES.map((tmpl) => {
                  const isSelected = tmpl.id === selectedReportId;

                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedReportId(tmpl.id)}
                      className={`p-4 rounded-xl border bg-white shadow-xs cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'border-[#176B87] ring-2 ring-[#176B87] bg-[#EDF5F8]/40'
                          : 'hover:border-[#B3CBE0]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#F0F2F5] text-[#596579] border border-[#D9DEE5]">
                            {tmpl.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EDF5F8] text-[#176B87]">
                            {tmpl.badge}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-[#172033] line-clamp-1">
                          {tmpl.name}
                        </h3>

                        <p className="text-xs text-[#596579] line-clamp-3 leading-relaxed">
                          {tmpl.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#D9DEE5]/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1 text-[#8A94A6]">
                          {tmpl.formatsSupported.map((fmt) => (
                            <span key={fmt} className="font-mono font-bold">
                              {fmt}
                            </span>
                          ))}
                        </div>
                        <span className="font-bold text-[#176B87] flex items-center gap-0.5">
                          Configure &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* =========================================================================
                REPORT BUILDER:
                - Project
                - Date range
                - Schedule version
                - Area
                - Discipline
                - Status
                Actions: Preview, Generate, Export
                ========================================================================= */}
            <div className="bg-white border border-[#D9DEE5] rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-[#D9DEE5] bg-[#F7F8FA] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#176B87]" />
                  <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                    Report Builder: {activeReportTemplate.name}
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#596579]">
                  Target Template ID: {activeReportTemplate.id}
                </span>
              </div>

              <div className="p-5 md:p-6 space-y-6">
                {/* Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {/* 1. Project */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#8A94A6] block">
                      Project *
                    </label>
                    <select
                      value={builderProject}
                      onChange={(e) => setBuilderProject(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-medium outline-none focus:border-[#176B87]"
                    >
                      <option value="PRJ-OIL-2026-01">OIL-DUL-01 (Duliajan Gas Processing)</option>
                      <option value="PRJ-OIL-2026-02">OIL-NHK-04 (Naharkatiya Facility)</option>
                    </select>
                  </div>

                  {/* 2. Date Range: Start Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#8A94A6] block">
                      Reporting Start Date *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-mono outline-none focus:border-[#176B87]"
                    />
                  </div>

                  {/* 2. Date Range: End Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#8A94A6] block">
                      Reporting End Date *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-mono outline-none focus:border-[#176B87]"
                    />
                  </div>

                  {/* 3. Schedule Version */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#8A94A6] block">
                      Schedule Version *
                    </label>
                    <select
                      value={scheduleVersion}
                      onChange={(e) => setScheduleVersion(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-mono outline-none focus:border-[#176B87]"
                    >
                      <option value="V3 · Rev 3.2">V3 · Rev 3.2 (Primavera P6 XML) - Current Baseline</option>
                      <option value="V3 · Rev 3.1">V3 · Rev 3.1 (Primavera P6 XML) - Superseded Baseline</option>
                      <option value="V2 · Rev 2.0">V2 · Rev 2.0 (Primavera P6 XML) - Approved Baseline</option>
                      <option value="V1 · Rev 1.0">V1 · Rev 1.0 (Primavera P6 XML) - Tender Baseline</option>
                    </select>
                  </div>

                  {/* 4. Area */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#8A94A6] block">
                      Area / Location Scope
                    </label>
                    <select
                      value={builderArea}
                      onChange={(e) => setBuilderArea(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87]"
                    >
                      <option value="ALL">All Project Areas</option>
                      <option value="Unit A - Gas Processing">Unit A - Gas Processing</option>
                      <option value="Unit A - Compressor House">Unit A - Compressor House</option>
                      <option value="Overhead Gallery">Overhead Gallery</option>
                      <option value="Flare Bay">Flare Bay</option>
                    </select>
                  </div>

                  {/* 5. Discipline */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#8A94A6] block">
                      Discipline Filter
                    </label>
                    <select
                      value={builderDiscipline}
                      onChange={(e) => setBuilderDiscipline(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87]"
                    >
                      <option value="ALL">All Disciplines</option>
                      <option value="Piping">Piping</option>
                      <option value="Civil">Civil</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Instrumentation">Instrumentation</option>
                    </select>
                  </div>

                  {/* 6. Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#8A94A6] block">
                      Activity Status
                    </label>
                    <select
                      value={builderStatus}
                      onChange={(e) => setBuilderStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87]"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Completed">Completed Only</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Delayed">Delayed / Slip</option>
                      <option value="At Risk">At Risk</option>
                    </select>
                  </div>

                  {/* Checkbox Options */}
                  <div className="sm:col-span-2 flex items-center gap-4 flex-wrap pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#172033]">
                      <input
                        type="checkbox"
                        checked={includeEvidence}
                        onChange={(e) => setIncludeEvidence(e.target.checked)}
                        className="rounded accent-[#176B87]"
                      />
                      <span>Include Verified Evidence Thumbnails & GPS</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#172033]">
                      <input
                        type="checkbox"
                        checked={includeSignatures}
                        onChange={(e) => setIncludeSignatures(e.target.checked)}
                        className="rounded accent-[#176B87]"
                      />
                      <span>Include Digital Seal Sign-off Block</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#172033]">
                      <input
                        type="checkbox"
                        checked={includeCpmPath}
                        onChange={(e) => setIncludeCpmPath(e.target.checked)}
                        className="rounded accent-[#176B87]"
                      />
                      <span>Highlight Zero-Float Critical Path</span>
                    </label>
                  </div>
                </div>

                {/* BUILDER ACTIONS: Preview, Generate, Export */}
                <div className="pt-4 border-t border-[#D9DEE5]/60 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-xs text-[#596579]">
                    <Clock className="w-3.5 h-3.5 text-[#176B87]" />
                    <span>Selected Date Window: <strong>{startDate}</strong> to <strong>{endDate}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Action 1: Preview */}
                    <button
                      type="button"
                      onClick={() => setPreviewReportOpen(true)}
                      className="px-4 py-2 bg-white hover:bg-[#F0F2F5] text-[#172033] border border-[#D9DEE5] text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#176B87]" />
                      <span>Preview Report</span>
                    </button>

                    {/* Action 2: Generate */}
                    <button
                      type="button"
                      onClick={handleGenerateReport}
                      disabled={isGenerating}
                      className="px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isGenerating ? 'Compiling Dossier...' : 'Generate Report'}</span>
                    </button>

                    {/* Action 3: Export */}
                    <div className="flex items-center border border-[#D9DEE5] rounded-lg overflow-hidden bg-white">
                      <span className="px-2.5 py-2 text-[10px] uppercase font-bold text-[#8A94A6] bg-[#F7F8FA] border-r border-[#D9DEE5]">
                        Export
                      </span>
                      <button
                        type="button"
                        onClick={() => handleExportReport('PDF')}
                        className="px-2.5 py-2 text-xs font-bold hover:bg-[#F0F2F5] text-[#172033] transition-colors"
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportReport('XLSX')}
                        className="px-2.5 py-2 text-xs font-bold hover:bg-[#F0F2F5] text-[#2E7D5B] border-l border-[#D9DEE5] transition-colors"
                      >
                        XLSX
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportReport('CSV')}
                        className="px-2.5 py-2 text-xs font-bold hover:bg-[#F0F2F5] text-[#596579] border-l border-[#D9DEE5] transition-colors"
                      >
                        CSV
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: PROJECT MEMORY SECTION
            Show verified historical information:
            - actual durations
            - delay causes
            - productivity observations
            - discipline patterns
            - historical execution records
            Filters: Date, Project, Discipline, Activity Type, Delay Cause
            "Each memory record must link back to its source verified record."
            "Do not turn Project Memory into a generic chatbot."
            ========================================================================= */}
        {activeTab === 'memory' && (
          <div className="space-y-6">
            {/* EMPIRICAL KNOWLEDGE NOTICE */}
            <div className="p-4 rounded-xl bg-[#EDF5F8] border border-[#B3CBE0] flex items-start gap-3 text-xs">
              <BookOpen className="w-5 h-5 text-[#176B87] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-bold text-[#172033]">
                  Structured Engineering Project Memory Vault
                </h3>
                <p className="text-[#596579] leading-relaxed">
                  Project Memory archives verified actual durations, equipment productivities, and physical root causes from closed-out Oil India Limited execution records. Every observation links directly to its underlying QA/QC certificate, signed DPR, or contract closeout dossier.
                </p>
              </div>
            </div>

            {/* FILTERS BAR:
                - Date (Year)
                - Project
                - Discipline
                - Activity Type
                - Delay Cause
            */}
            <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#176B87]" />
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Project Memory Filters
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleResetMemoryFilters}
                  className="text-xs text-[#596579] hover:text-[#172033] flex items-center gap-1 font-medium transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                {/* 1. Date (Year) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A94A6]">Year / Era</label>
                  <select
                    value={memoryYearFilter}
                    onChange={(e) => setMemoryYearFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-medium outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Years (2024 - 2026)</option>
                    <option value="2026">2026 (Active Project)</option>
                    <option value="2025">2025 (OGS-3 Revamp)</option>
                    <option value="2024">2024 (Naharkatiya Trunk)</option>
                  </select>
                </div>

                {/* 2. Project */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A94A6]">Project</label>
                  <select
                    value={memoryProjectFilter}
                    onChange={(e) => setMemoryProjectFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-medium outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Historic Projects</option>
                    <option value="OIL-DUL-01">OIL-DUL-01 (Duliajan)</option>
                    <option value="OIL-OGS-2025">OIL-OGS-2025 (OGS-3)</option>
                    <option value="OIL-NHK-2024">OIL-NHK-2024 (Naharkatiya)</option>
                  </select>
                </div>

                {/* 3. Discipline */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A94A6]">Discipline</label>
                  <select
                    value={memoryDisciplineFilter}
                    onChange={(e) => setMemoryDisciplineFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-medium outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Disciplines</option>
                    <option value="Piping">Piping</option>
                    <option value="Civil">Civil</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                </div>

                {/* 4. Activity Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A94A6]">Activity Type</label>
                  <select
                    value={memoryActivityTypeFilter}
                    onChange={(e) => setMemoryActivityTypeFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-medium outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Activity Types</option>
                    <option value="Erection">Erection</option>
                    <option value="Welding">Welding</option>
                    <option value="Concreting">Concreting</option>
                    <option value="Cable Laying">Cable Laying</option>
                    <option value="Alignment">Alignment</option>
                    <option value="Testing">Testing</option>
                  </select>
                </div>

                {/* 5. Delay Cause */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A94A6]">Delay Cause</label>
                  <select
                    value={memoryDelayCauseFilter}
                    onChange={(e) => setMemoryDelayCauseFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-medium outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Delay Root Causes</option>
                    <option value="Weather / Monsoon">Weather / Monsoon</option>
                    <option value="Equipment Breakdown">Equipment Breakdown</option>
                    <option value="Quality / NCR">Quality / NCR</option>
                    <option value="Inspection Backlog">Inspection Backlog</option>
                    <option value="None (Ahead)">None (Ahead / On Time)</option>
                  </select>
                </div>
              </div>

              {/* Free Text Search */}
              <div className="pt-2 border-t border-[#D9DEE5]/60 flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-[#8A94A6] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={memorySearch}
                    onChange={(e) => setMemorySearch(e.target.value)}
                    placeholder="Search by work scope, discipline pattern, or delay root cause..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87]"
                  />
                </div>
                <span className="text-xs font-mono text-[#596579]">
                  Showing <strong className="text-[#172033]">{filteredMemoryRecords.length}</strong> of{' '}
                  {HISTORICAL_MEMORY_RECORDS.length} verified records
                </span>
              </div>
            </div>

            {/* HISTORICAL MEMORY CARDS LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMemoryRecords.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedMemoryRecord(rec)}
                  className="bg-white border border-[#D9DEE5] hover:border-[#176B87] rounded-xl p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#176B87] bg-[#EDF5F8] px-2 py-0.5 rounded border border-[#B3CBE0]">
                          {rec.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#F0F2F5] text-[#596579]">
                          {rec.discipline} · {rec.activityType}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                          rec.varianceDurationDays > 0
                            ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                            : rec.varianceDurationDays < 0
                            ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                            : 'bg-[#F0F2F5] text-[#596579]'
                        }`}
                      >
                        {rec.varianceDurationDays > 0
                          ? `+${rec.varianceDurationDays}d Overrun`
                          : rec.varianceDurationDays < 0
                          ? `${rec.varianceDurationDays}d Ahead`
                          : '0d Variance'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[#172033] group-hover:text-[#176B87] transition-colors">
                        {rec.title}
                      </h4>
                      <p className="text-[11px] text-[#596579] font-mono mt-0.5">
                        {rec.projectName} ({rec.projectCode}) · {rec.date}
                      </p>
                    </div>

                    {/* DURATION & PRODUCTIVITY METRIC */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#F7F8FA] p-3 rounded-lg border border-[#D9DEE5]/80">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">
                          Actual vs Planned Duration
                        </span>
                        <span className="font-mono text-xs font-bold text-[#172033]">
                          {rec.actualDurationDays} days{' '}
                          <span className="text-[10px] font-normal text-[#8A94A6]">
                            (Plan: {rec.plannedDurationDays}d)
                          </span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">
                          Productivity Rate
                        </span>
                        <span className="font-mono text-xs font-bold text-[#176B87]">
                          {rec.productivityObservation.achievedRate}
                        </span>
                      </div>
                    </div>

                    {/* DISCIPLINE PATTERN */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#176B87] tracking-wider block">
                        Observed Discipline Pattern
                      </span>
                      <p className="text-xs text-[#596579] leading-relaxed line-clamp-2">
                        {rec.disciplinePattern}
                      </p>
                    </div>
                  </div>

                  {/* SOURCE VERIFIED RECORD BINDING */}
                  <div className="pt-3 border-t border-[#D9DEE5]/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[#596579] truncate max-w-[280px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
                      <span className="truncate">
                        Source: <strong>{rec.sourceVerifiedRecord.recordId}</strong> ({rec.sourceVerifiedRecord.title})
                      </span>
                    </div>

                    <span className="text-xs font-bold text-[#176B87] flex items-center gap-0.5 shrink-0 group-hover:underline">
                      Inspect Record &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: REPORT PREVIEW
            Comprehensive formatted document preview with metrics, tables, and seals
            ========================================================================= */}
        <Modal
          isOpen={previewReportOpen}
          onClose={() => setPreviewReportOpen(false)}
          title={`Report Preview: ${activeReportTemplate.name}`}
          subtitle={`Project: ${builderProject} · Period: ${startDate} to ${endDate} · ${scheduleVersion}`}
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-between w-full text-xs">
              <div className="flex items-center gap-2 text-[#596579] font-mono">
                <Lock className="w-3.5 h-3.5 text-[#2E7D5B]" />
                <span>Format Certified: V3 · Rev 3.2 Non-EVM Compliance</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewReportOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#596579] hover:text-[#172033]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleExportReport('PDF')}
                  className="px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Signed PDF</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-xs bg-white p-2">
            {/* OFFICIAL DOCUMENT HEADER */}
            <div className="border-b-2 border-[#172033] pb-4 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#176B87] block mb-1">
                  OIL INDIA LIMITED · INFRASTRUCTURE DIVISION
                </span>
                <h3 className="text-lg font-bold text-[#172033] uppercase">
                  {activeReportTemplate.title}
                </h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  Duliajan Gas Processing & Pipeline Interconnect Project (OIL-DUL-01)
                </p>
              </div>

              <div className="text-right text-[11px] font-mono space-y-0.5">
                <div>Doc No: <strong>OIL/DUL/REP-2026-981</strong></div>
                <div>Data Date: <strong>18 Sep 2026</strong></div>
                <div>Baseline: <strong>{scheduleVersion}</strong></div>
              </div>
            </div>

            {/* EXECUTIVE SUMMARY METRIC STRIP */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5]">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Physical Progress</span>
                <span className="text-base font-bold font-mono text-[#172033]">73.0%</span>
                <span className="text-[10px] text-[#596579] block">Plan: 80.0% (-7.0%)</span>
              </div>
              <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5]">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Critical Path Slip</span>
                <span className="text-base font-bold font-mono text-[#B5473C]">+2 Days</span>
                <span className="text-[10px] text-[#596579] block">Float: 0d (Line 24)</span>
              </div>
              <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5]">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Verified Evidence</span>
                <span className="text-base font-bold font-mono text-[#2E7D5B]">91.4% Bound</span>
                <span className="text-[10px] text-[#596579] block">SHA-256 Registered</span>
              </div>
              <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5]">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Commercial Target</span>
                <span className="text-base font-bold font-mono text-[#172033]">15 Dec 2026</span>
                <span className="text-[10px] text-[#596579] block">Unchanged Milestone</span>
              </div>
            </div>

            {/* SAMPLE REPORT TABLE */}
            <div className="border border-[#D9DEE5] rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#F0F2F5] border-b border-[#D9DEE5] text-[10px] uppercase font-bold text-[#596579]">
                  <tr>
                    <th className="p-2.5">Activity ID</th>
                    <th className="p-2.5">Scope Description</th>
                    <th className="p-2.5">Discipline</th>
                    <th className="p-2.5">Planned Finish</th>
                    <th className="p-2.5">Actual / Projected</th>
                    <th className="p-2.5">Variance</th>
                    <th className="p-2.5">Evidence Binding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EBF0]">
                  <tr>
                    <td className="p-2.5 font-mono font-bold text-[#176B87]">PIP-24-001</td>
                    <td className="p-2.5 font-medium text-[#172033]">Erect Line 24-XX High Pressure Gas Header</td>
                    <td className="p-2.5 text-[#596579]">Piping</td>
                    <td className="p-2.5 font-mono text-[#596579]">15 Sep 2026</td>
                    <td className="p-2.5 font-mono font-bold text-[#2E7D5B]">14 Sep 2026</td>
                    <td className="p-2.5 text-[#2E7D5B] font-bold">+1d Ahead</td>
                    <td className="p-2.5 font-mono text-[10px] text-[#176B87]">EVD-002 (Photo)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-bold text-[#176B87]">PIP-24-002</td>
                    <td className="p-2.5 font-medium text-[#172033]">Weld Line 24-XX Field Joints & NDT Clearance</td>
                    <td className="p-2.5 text-[#596579]">Piping</td>
                    <td className="p-2.5 font-mono text-[#596579]">18 Sep 2026</td>
                    <td className="p-2.5 font-mono font-bold text-[#B5473C]">20 Sep 2026</td>
                    <td className="p-2.5 text-[#B5473C] font-bold">-2d Delay</td>
                    <td className="p-2.5 font-mono text-[10px] text-[#176B87]">EVD-006 (Photo)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-bold text-[#176B87]">CIV-11-001</td>
                    <td className="p-2.5 font-medium text-[#172033]">Foundation Block A Compressor Pedestal</td>
                    <td className="p-2.5 text-[#596579]">Civil</td>
                    <td className="p-2.5 font-mono text-[#596579]">14 Sep 2026</td>
                    <td className="p-2.5 font-mono font-bold text-[#2E7D5B]">14 Sep 2026</td>
                    <td className="p-2.5 text-[#596579]">On Time</td>
                    <td className="p-2.5 font-mono text-[10px] text-[#176B87]">EVD-003 (Lab QC)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-bold text-[#176B87]">MEC-08-003</td>
                    <td className="p-2.5 font-medium text-[#172033]">Align Centrifugal Gas Compressor Skid A</td>
                    <td className="p-2.5 text-[#596579]">Mechanical</td>
                    <td className="p-2.5 font-mono text-[#596579]">22 Sep 2026</td>
                    <td className="p-2.5 font-mono text-[#172033]">22 Sep 2026</td>
                    <td className="p-2.5 text-[#596579]">On Time</td>
                    <td className="p-2.5 font-mono text-[10px] text-[#596579]">Scheduled</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* DIGITAL SIGN-OFF BLOCK */}
            {includeSignatures && (
              <div className="pt-4 border-t border-[#D9DEE5] grid grid-cols-3 gap-4 text-center text-[11px]">
                <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#D9DEE5]/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Prepared By</span>
                  <div className="font-bold text-[#172033]">Debajit Borah</div>
                  <span className="text-[10px] text-[#596579] block">Lead Site Execution Engineer</span>
                  <span className="text-[9px] font-mono text-[#2E7D5B] block">Digital Sign: OK (18 Sep 17:30)</span>
                </div>
                <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#D9DEE5]/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Reviewed By</span>
                  <div className="font-bold text-[#172033]">S. Ramanathan</div>
                  <span className="text-[10px] text-[#596579] block">Quality Assurance & QC Lead</span>
                  <span className="text-[9px] font-mono text-[#2E7D5B] block">Digital Sign: OK (18 Sep 18:00)</span>
                </div>
                <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#D9DEE5]/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Approved By</span>
                  <div className="font-bold text-[#172033]">Rajesh Sharma</div>
                  <span className="text-[10px] text-[#596579] block">Chief Project Controls Manager</span>
                  <span className="text-[9px] font-mono text-[#2E7D5B] block">Digital Seal: OIL-AUTH-441</span>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* =========================================================================
            DRAWER: HISTORICAL MEMORY DETAIL INSPECTION
            "Each memory record must link back to its source verified record."
            "Do not turn Project Memory into a generic chatbot."
            ========================================================================= */}
        <Drawer
          isOpen={!!selectedMemoryRecord}
          onClose={() => setSelectedMemoryRecord(null)}
          title={`Project Memory: ${selectedMemoryRecord?.id || ''}`}
          subtitle={selectedMemoryRecord?.title}
          width="md"
        >
          {selectedMemoryRecord && (
            <div className="space-y-5 text-xs p-1">
              <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#176B87]">
                    {selectedMemoryRecord.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedMemoryRecord.varianceDurationDays > 0
                        ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                        : selectedMemoryRecord.varianceDurationDays < 0
                        ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                        : 'bg-[#F0F2F5] text-[#596579]'
                    }`}
                  >
                    {selectedMemoryRecord.delayCategory}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#172033]">{selectedMemoryRecord.title}</h4>
                <p className="text-[#596579] font-mono text-[11px]">
                  {selectedMemoryRecord.projectName} ({selectedMemoryRecord.projectCode}) · {selectedMemoryRecord.date}
                </p>
              </div>

              {/* ACTUAL DURATIONS COMPARISON */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                  Actual vs Planned Duration Benchmark
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded bg-white border border-[#D9DEE5]">
                    <span className="text-[10px] text-[#8A94A6] block uppercase">Planned</span>
                    <span className="font-mono text-sm font-bold text-[#172033]">
                      {selectedMemoryRecord.plannedDurationDays}d
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-[#D9DEE5]">
                    <span className="text-[10px] text-[#8A94A6] block uppercase">Actual</span>
                    <span className="font-mono text-sm font-bold text-[#176B87]">
                      {selectedMemoryRecord.actualDurationDays}d
                    </span>
                  </div>
                  <div
                    className={`p-2.5 rounded border ${
                      selectedMemoryRecord.varianceDurationDays > 0
                        ? 'bg-[#FBEFEE] border-[#E4B0AA] text-[#B5473C]'
                        : selectedMemoryRecord.varianceDurationDays < 0
                        ? 'bg-[#EDF7F2] border-[#B8DCC9] text-[#2E7D5B]'
                        : 'bg-white border-[#D9DEE5] text-[#596579]'
                    }`}
                  >
                    <span className="text-[10px] block uppercase font-bold">Variance</span>
                    <span className="font-mono text-sm font-black">
                      {selectedMemoryRecord.varianceDurationDays > 0
                        ? `+${selectedMemoryRecord.varianceDurationDays}d`
                        : `${selectedMemoryRecord.varianceDurationDays}d`}
                    </span>
                  </div>
                </div>
              </div>

              {/* PRODUCTIVITY OBSERVATIONS */}
              <div className="p-3.5 rounded-lg bg-white border border-[#D9DEE5] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#176B87] tracking-wider block">
                  Measured Productivity Rate Observation
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8A94A6]">Metric:</span>
                    <span className="font-semibold text-[#172033]">
                      {selectedMemoryRecord.productivityObservation.metricName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A94A6]">Achieved Rate:</span>
                    <span className="font-mono font-bold text-[#176B87]">
                      {selectedMemoryRecord.productivityObservation.achievedRate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A94A6]">Baseline Benchmark:</span>
                    <span className="font-mono text-[#596579]">
                      {selectedMemoryRecord.productivityObservation.benchmarkRate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A94A6]">Crew & Machinery:</span>
                    <span className="text-[#172033] text-[11px]">
                      {selectedMemoryRecord.productivityObservation.equipmentCrewUsed}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#D9DEE5]">
                    <span className="text-[#8A94A6]">Performance Delta:</span>
                    <span className="font-bold text-[#2E7D5B]">
                      {selectedMemoryRecord.productivityObservation.efficiencyDelta}
                    </span>
                  </div>
                </div>
              </div>

              {/* DISCIPLINE PATTERNS & ROOT CAUSES */}
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                    Verified Delay Root Causes
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[#172033] text-xs">
                    {selectedMemoryRecord.delayCauses.map((cause, idx) => (
                      <li key={idx}>{cause}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-[#EDF5F8] border border-[#B3CBE0] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#176B87] tracking-wider block">
                    Discipline Execution Pattern
                  </span>
                  <p className="text-[#172033] leading-relaxed text-xs">
                    {selectedMemoryRecord.disciplinePattern}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#F0F4F8] border border-[#D9DEE5] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#2E7D5B] tracking-wider block">
                    Systemic Mitigation Learned
                  </span>
                  <p className="text-[#596579] leading-relaxed text-xs">
                    {selectedMemoryRecord.mitigationLearned}
                  </p>
                </div>
              </div>

              {/* SOURCE VERIFIED RECORD BINDING */}
              <div className="p-3.5 rounded-lg bg-black text-white space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8A94A6] uppercase font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D5B]" />
                    Source Verified Record
                  </span>
                  <span className="px-2 py-0.2 rounded bg-white/20 font-mono text-[10px]">
                    {selectedMemoryRecord.sourceVerifiedRecord.recordType}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="font-bold text-[#176B87]">
                    {selectedMemoryRecord.sourceVerifiedRecord.recordId}
                  </div>
                  <div className="text-white text-[11px]">
                    {selectedMemoryRecord.sourceVerifiedRecord.title}
                  </div>
                  <div className="text-[#8A94A6] font-mono text-[10px]">
                    {selectedMemoryRecord.sourceVerifiedRecord.hashOrStamp}
                  </div>
                </div>

                {selectedMemoryRecord.sourceVerifiedRecord.linkUrl && (
                  <Link
                    href={selectedMemoryRecord.sourceVerifiedRecord.linkUrl}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#176B87] hover:underline pt-1"
                  >
                    <span>View Primary Artifact in Ledger &rarr;</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AppShell>
  );
}
