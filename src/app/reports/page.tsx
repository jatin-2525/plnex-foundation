'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { Modal } from '../../components/shared/Modal';
import { Drawer } from '../../components/shared/Drawer';
import { SCurveChart } from '../../components/shared/SCurveChart';
import {
  REPORT_TEMPLATES,
  HISTORICAL_MEMORY_RECORDS,
  ReportTemplate,
  HistoricalMemoryRecord,
  MemoryCategory,
} from '../../lib/domain/reportsAndMemory';
import { CANONICAL_SCHEDULE_VERSION_LABEL } from '../../lib/domain/canonicalModels';
import {
  FileText,
  TrendingUp,
  Clock,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Search,
  Filter,
  RotateCcw,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Lock,
  History,
  Check,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';

export default function ReportsAndMemoryPage() {
  const { activeProject } = useApp();
  const { addToast } = useToast();

  // Primary Navigation: Separate REPORTS vs PROJECT MEMORY
  const [activeTab, setActiveTab] = useState<'reports' | 'memory'>('reports');

  // =========================================================================
  // REPORT BUILDER STATE
  // 6 Canonical Reports:
  // - Daily Progress
  // - Progress Summary
  // - Delay Report
  // - Risk Report
  // - Exception Report
  // - Evidence-linked Activity Report
  // =========================================================================
  const [selectedReportId, setSelectedReportId] = useState<string>('REP-DPR');
  const [builderProject, setBuilderProject] = useState<string>('PRJ-OIL-2026-01');
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-09-18');
  const [scheduleVersion] = useState<string>(CANONICAL_SCHEDULE_VERSION_LABEL);
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
  // PROJECT MEMORY STATE
  // Strict rule: Empirical engineering repository without conversational chatbot
  // Instead provide: Search, Filters, Historical records, Source links, Evidence links
  // Categories:
  // - Historical Execution
  // - Actual Durations
  // - Delay Causes
  // - Verified Progress
  // - Past Decisions
  // - Evidence
  // =========================================================================
  const [memoryCategoryFilter, setMemoryCategoryFilter] = useState<'ALL' | MemoryCategory>('ALL');
  const [memoryProjectFilter, setMemoryProjectFilter] = useState<string>('ALL');
  const [memoryDisciplineFilter, setMemoryDisciplineFilter] = useState<string>('ALL');
  const [memoryYearFilter, setMemoryYearFilter] = useState<string>('ALL');
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
      // Category filter
      if (memoryCategoryFilter !== 'ALL' && rec.category !== memoryCategoryFilter) {
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
      // Year filter
      if (memoryYearFilter !== 'ALL' && rec.year !== memoryYearFilter) {
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
        const matchesDecision = rec.pastDecision?.summary.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesCode && !matchesDiscipline && !matchesPattern && !matchesCauses && !matchesDecision) {
          return false;
        }
      }
      return true;
    });
  }, [
    memoryCategoryFilter,
    memoryProjectFilter,
    memoryDisciplineFilter,
    memoryYearFilter,
    memorySearch,
  ]);

  const handleResetMemoryFilters = () => {
    setMemoryCategoryFilter('ALL');
    setMemoryProjectFilter('ALL');
    setMemoryDisciplineFilter('ALL');
    setMemoryYearFilter('ALL');
    setMemorySearch('');
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    addToast({
      type: 'info',
      title: 'Compiling Report Dossier',
      description: `Assembling verified progress, baseline CPM variance, and signed evidence links.`,
    });

    setTimeout(() => {
      setIsGenerating(false);
      setPreviewReportOpen(true);
      addToast({
        type: 'success',
        title: 'Report Dossier Generated',
        description: `${activeReportTemplate.name} compiled with authoritative data for ${builderProject}.`,
      });
    }, 700);
  };

  const handleExportReport = (format: 'PDF' | 'XLSX' | 'CSV') => {
    addToast({
      type: 'success',
      title: `Export Initiated (${format})`,
      description: `Downloading signed ${activeReportTemplate.name} export package.`,
    });
  };

  return (
    <StateWrapper>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Knowledge & Memory' },
            { label: 'Reports & Project Memory', current: true },
          ]}
        />

        {/* =========================================================================
            HEADER: REPORTS & PROJECT MEMORY
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <BookOpen className="w-3.5 h-3.5" />
                  Project Knowledge
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                  <CheckCircle2 className="w-3 h-3 text-[#2E7D5B]" />
                  Verified Evidence Links Active
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] text-[#596579] bg-[#F7F8FA] border border-[#D9DEE5]">
                  {activeProject?.code || 'OIL-DUL-01'} · V3 · Rev 3.2
                </span>
              </div>

              <h1 className="text-[28px] sm:text-3xl font-bold text-[#172033] tracking-tight">
                Reports &amp; Project Memory
              </h1>
              <p className="text-sm text-[#596579] mt-1 max-w-3xl">
                Statutory baseline progress reporting and empirical engineering memory repository. Every record is grounded in verified physical evidence.
              </p>
            </div>

            <div className="text-xs text-[#596579] font-mono flex items-center gap-2">
              <span>Cutoff Date:</span>
              <strong className="text-[#172033]">18 Sep 2026</strong>
            </div>
          </div>

          {/* =========================================================================
              PRIMARY TABS: REPORTS vs PROJECT MEMORY (Clearly Separated)
              ========================================================================= */}
          <div className="flex items-center justify-between pt-3 border-t border-[#D9DEE5]/60 flex-wrap gap-3">
            <div className="flex items-center bg-[#F1F3F5] p-1 rounded-lg border border-[#D9DEE5]">
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-6 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'reports'
                    ? 'bg-white text-[#176B87] shadow-xs'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Reports</span>
                <span
                  className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === 'reports'
                      ? 'bg-[#EDF5F8] text-[#176B87]'
                      : 'bg-[#D9DEE5] text-[#596579]'
                  }`}
                >
                  6 Available
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('memory')}
                className={`flex items-center gap-2 px-6 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'memory'
                    ? 'bg-white text-[#176B87] shadow-xs'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Project Memory</span>
                <span
                  className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === 'memory'
                      ? 'bg-[#EDF5F8] text-[#176B87]'
                      : 'bg-[#D9DEE5] text-[#596579]'
                  }`}
                >
                  {HISTORICAL_MEMORY_RECORDS.length} Verified Records
                </span>
              </button>
            </div>

            <div className="text-xs text-[#596579] font-mono">
              Mode: <strong className="text-[#172033]">{activeTab === 'reports' ? 'Statutory Dossiers' : 'Historical Memory Vault'}</strong>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 1: REPORTS
            6 Canonical Reports:
            - Daily Progress
            - Progress Summary
            - Delay Report
            - Risk Report
            - Exception Report
            - Evidence-linked Activity Report
            ========================================================================= */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* 6 REPORT CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {REPORT_TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.id === selectedReportId;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedReportId(tmpl.id)}
                    className={`p-5 rounded-lg border text-left transition-all relative flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-[#176B87] bg-white shadow-xs ring-2 ring-[#176B87]'
                        : 'border-[#D9DEE5] bg-white hover:border-[#176B87]/50 hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                          {tmpl.badge}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-[#7B8798]">
                          {tmpl.formatsSupported.join(' · ')}
                        </div>
                      </div>

                      <h3 className="font-bold text-base text-[#172033] mb-1">
                        {tmpl.name}
                      </h3>
                      <p className="text-xs text-[#596579] line-clamp-2">
                        {tmpl.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#D9DEE5] flex items-center justify-between text-xs">
                      <span className="text-[#7B8798] font-mono text-[11px]">
                        {tmpl.defaultTimeframe}
                      </span>
                      <span
                        className={`font-bold flex items-center gap-1 ${
                          isSelected ? 'text-[#176B87]' : 'text-[#596579]'
                        }`}
                      >
                        {isSelected ? '✓ Selected' : 'Configure →'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* REPORT BUILDER CONFIGURATION PANEL */}
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D9DEE5]/60 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#176B87]" />
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Report Parameters: {activeReportTemplate.name}
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#596579]">
                  Schedule Baseline: <strong className="text-[#172033]">{scheduleVersion}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#172033] mb-1">
                    Project
                  </label>
                  <select
                    value={builderProject}
                    onChange={(e) => setBuilderProject(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-[#172033] outline-none"
                  >
                    <option value="PRJ-OIL-2026-01">OIL-DUL-01 (Duliajan Gas Processing)</option>
                    <option value="PRJ-OIL-2026-02">OIL-OGS-2025 (OGS-3 Revamp)</option>
                    <option value="PRJ-OIL-2026-03">OIL-NHK-2024 (Naharkatiya Pipeline)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#172033] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-[#172033] font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#172033] mb-1">
                    End Date (Cutoff)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-[#172033] font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#172033] mb-1">
                    Engineering Discipline
                  </label>
                  <select
                    value={builderDiscipline}
                    onChange={(e) => setBuilderDiscipline(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-[#172033] outline-none"
                  >
                    <option value="ALL">All Disciplines</option>
                    <option value="Piping">Piping</option>
                    <option value="Civil">Civil</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 flex-wrap pt-2 border-t border-[#D9DEE5] text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-[#172033]">
                  <input
                    type="checkbox"
                    checked={includeEvidence}
                    onChange={(e) => setIncludeEvidence(e.target.checked)}
                    className="rounded accent-[#176B87]"
                  />
                  <span>Include Verified Evidence Thumbnails &amp; Hashes</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[#172033]">
                  <input
                    type="checkbox"
                    checked={includeSignatures}
                    onChange={(e) => setIncludeSignatures(e.target.checked)}
                    className="rounded accent-[#176B87]"
                  />
                  <span>Include Lead Engineer Sign-off Digital Seal</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[#172033]">
                  <input
                    type="checkbox"
                    checked={includeCpmPath}
                    onChange={(e) => setIncludeCpmPath(e.target.checked)}
                    className="rounded accent-[#176B87]"
                  />
                  <span>Highlight Zero-Float Critical Path</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#D9DEE5]/60 flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs text-[#596579]">
                  Generating report: <strong className="text-[#172033]">{activeReportTemplate.name}</strong>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPreviewReportOpen(true)}
                    className="px-4 py-2 bg-white hover:bg-[#F1F3F5] text-[#172033] border border-[#D9DEE5] text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#176B87]" />
                    <span>Preview Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isGenerating ? 'Compiling Dossier...' : 'Generate Report'}</span>
                  </button>

                  <div className="flex items-center border border-[#D9DEE5] rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => handleExportReport('PDF')}
                      className="px-3 py-2 text-xs font-bold hover:bg-[#F1F3F5] text-[#172033] transition-colors"
                    >
                      Export PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportReport('XLSX')}
                      className="px-3 py-2 text-xs font-bold hover:bg-[#F1F3F5] text-[#2E7D5B] border-l border-[#D9DEE5] transition-colors"
                    >
                      XLSX
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportReport('CSV')}
                      className="px-3 py-2 text-xs font-bold hover:bg-[#F1F3F5] text-[#596579] border-l border-[#D9DEE5] transition-colors"
                    >
                      CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Progress S-Curve Preview for Progress Summary Template */}
            <div className="mt-4">
              <SCurveChart
                variant="compact"
                title="Progress Summary Dossier — Cumulative Physical S-Curve"
                subtitle="Baseline target vs actual site execution trajectory for statutory reporting"
              />
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 2: PROJECT MEMORY
            Strict Rule: Empirical engineering repository without conversational chatbot
            Instead provide: Search, Filters, Historical records, Source links, Evidence links
            Categories:
            - Historical Execution
            - Actual Durations
            - Delay Causes
            - Verified Progress
            - Past Decisions
            - Evidence
            Every memory record points to a verified source.
            ========================================================================= */}
        {activeTab === 'memory' && (
          <div className="space-y-6">
            {/* EMPIRICAL REPOSITORY BANNER */}
            <div className="p-4 rounded-lg bg-[#EDF5F8] border border-[#B3CBE0] flex items-start gap-3.5 text-xs">
              <BookOpen className="w-5 h-5 text-[#176B87] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-bold text-[#172033] uppercase tracking-wider text-[11px]">
                  Empirical Engineering Memory Repository
                </h3>
                <p className="text-[#596579] leading-relaxed">
                  Project Memory archives verified historical execution, actual durations, delay root causes, verified progress milestones, past decisions, and evidence links across Oil India Limited projects. Every memory record is anchored to an immutable verified source.
                </p>
              </div>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#176B87]" />
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Memory Repository Search &amp; Filters
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

              {/* Free Text Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#7B8798] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  placeholder="Search historical memory records by scope, past decisions, delay root causes, or discipline..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87] focus:bg-white transition-colors"
                />
              </div>

              {/* Categorical Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
                {/* 1. Category Facet (The 6 required categories) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7B8798] mb-1">
                    Memory Facet
                  </label>
                  <select
                    value={memoryCategoryFilter}
                    onChange={(e) => setMemoryCategoryFilter(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-medium outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Categories (6 Facets)</option>
                    <option value="Historical Execution">Historical Execution</option>
                    <option value="Actual Durations">Actual Durations</option>
                    <option value="Delay Causes">Delay Causes</option>
                    <option value="Verified Progress">Verified Progress</option>
                    <option value="Past Decisions">Past Decisions</option>
                    <option value="Evidence">Evidence</option>
                  </select>
                </div>

                {/* 2. Project Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7B8798] mb-1">
                    Project
                  </label>
                  <select
                    value={memoryProjectFilter}
                    onChange={(e) => setMemoryProjectFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-medium outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Historic Projects</option>
                    <option value="OIL-DUL-01">OIL-DUL-01 (Duliajan Gas Processing)</option>
                    <option value="OIL-OGS-2025">OIL-OGS-2025 (OGS-3 Revamp)</option>
                    <option value="OIL-NHK-2024">OIL-NHK-2024 (Naharkatiya Trunk)</option>
                  </select>
                </div>

                {/* 3. Discipline Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7B8798] mb-1">
                    Discipline
                  </label>
                  <select
                    value={memoryDisciplineFilter}
                    onChange={(e) => setMemoryDisciplineFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-medium outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Disciplines</option>
                    <option value="Piping">Piping</option>
                    <option value="Civil">Civil</option>
                    <option value="Mechanical">Mechanical</option>
                  </select>
                </div>

                {/* 4. Year Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7B8798] mb-1">
                    Year / Era
                  </label>
                  <select
                    value={memoryYearFilter}
                    onChange={(e) => setMemoryYearFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-medium outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Years (2024 - 2026)</option>
                    <option value="2026">2026 (Active Project)</option>
                    <option value="2025">2025 (Completed Revamp)</option>
                    <option value="2024">2024 (Historical Trunk)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-[#D9DEE5]/60 flex items-center justify-between text-xs text-[#596579]">
                <span>
                  Showing <strong className="text-[#172033] font-mono">{filteredMemoryRecords.length}</strong> of {HISTORICAL_MEMORY_RECORDS.length} verified memory records
                </span>
                <span className="text-[11px] font-mono text-[#2E7D5B] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Every memory record points to a verified source
                </span>
              </div>
            </div>

            {/* HISTORICAL MEMORY RECORDS LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMemoryRecords.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedMemoryRecord(rec)}
                  className="bg-white border border-[#D9DEE5] hover:border-[#176B87] rounded-lg p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#176B87] bg-[#EDF5F8] px-2 py-0.5 rounded border border-[#B3CBE0]">
                          {rec.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#F1F3F5] text-[#596579]">
                          {rec.category}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                        {rec.verifiedProgress}% Verified
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

                    {/* DURATION & PRODUCTIVITY METRICS */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#F7F8FA] p-3 rounded-lg border border-[#D9DEE5]/80">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#7B8798] block">
                          Actual Duration
                        </span>
                        <span className="font-mono text-xs font-bold text-[#172033]">
                          {rec.actualDurationDays} days{' '}
                          <span className="text-[10px] font-normal text-[#7B8798]">
                            (Plan: {rec.plannedDurationDays}d)
                          </span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#7B8798] block">
                          Productivity Rate
                        </span>
                        <span className="font-mono text-xs font-bold text-[#176B87]">
                          {rec.productivityObservation.achievedRate}
                        </span>
                      </div>
                    </div>

                    {/* PAST DECISION IF APPLICABLE */}
                    {rec.pastDecision && (
                      <div className="p-3 bg-[#FDF6ED] border border-[#F0D4A6] rounded-lg space-y-1 text-xs">
                        <span className="text-[10px] font-bold uppercase text-[#D98B32] block">
                          Past Decision Record
                        </span>
                        <p className="text-[#172033] font-medium">{rec.pastDecision.summary}</p>
                        <p className="text-[11px] text-[#596579] italic">Authorized by {rec.pastDecision.authorizedBy}</p>
                      </div>
                    )}

                    {/* DELAY ROOT CAUSES IF APPLICABLE */}
                    {rec.delayCauses.length > 0 && rec.delayCategory !== 'None (Ahead)' && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-[#B5473C] tracking-wider block">
                          Recorded Delay Causes
                        </span>
                        <ul className="text-xs text-[#596579] list-disc list-inside space-y-0.5">
                          {rec.delayCauses.map((dc, idx) => (
                            <li key={idx} className="truncate">{dc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* SOURCE LINKS & EVIDENCE LINKS (Mandatory per Prompt) */}
                  <div className="pt-3 border-t border-[#D9DEE5]/60 flex items-center justify-between text-xs flex-wrap gap-2">
                    {/* Source link */}
                    <div className="flex items-center gap-1.5 text-[#596579] truncate max-w-[240px]">
                      <Lock className="w-3 h-3 text-[#2E7D5B] shrink-0" />
                      <span className="truncate">
                        Source: <strong className="text-[#172033]">{rec.sourceVerifiedRecord.recordId}</strong>
                      </span>
                    </div>

                    {/* Evidence link */}
                    <Link
                      href={rec.evidenceLink.linkUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-bold text-[#176B87] hover:underline"
                    >
                      <span>Evidence: {rec.evidenceLink.evidenceId}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: REPORT PREVIEW
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
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D5B]" />
                <span>Statutory Compliance Certified: V3 · Rev 3.2 Non-EVM Standard</span>
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
            <div className="border-b-2 border-[#172033] pb-4 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#176B87] block mb-1">
                  OIL INDIA LIMITED · INFRASTRUCTURE DIVISION
                </span>
                <h3 className="text-lg font-bold text-[#172033] uppercase">
                  {activeReportTemplate.title}
                </h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  Duliajan Gas Processing &amp; Pipeline Interconnect · Reporting Date: 18 Sep 2026
                </p>
              </div>
              <div className="text-right font-mono text-[11px] text-[#596579]">
                <div>Ref: {activeReportTemplate.id}-2026-09</div>
                <div>Status: Verified</div>
              </div>
            </div>

            <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#7B8798] uppercase font-bold block">Physical Verified Progress</span>
                <span className="text-xl font-bold font-mono text-[#176B87]">73.0%</span>
              </div>
              <div>
                <span className="text-[10px] text-[#7B8798] uppercase font-bold block">Baseline Target</span>
                <span className="text-xl font-bold font-mono text-[#172033]">80.0%</span>
              </div>
              <div>
                <span className="text-[10px] text-[#7B8798] uppercase font-bold block">CPM Critical Variance</span>
                <span className="text-xl font-bold font-mono text-[#B5473C]">-7.0% (-2d)</span>
              </div>
              <div>
                <span className="text-[10px] text-[#7B8798] uppercase font-bold block">Evidence Dossier</span>
                <span className="text-xl font-bold font-mono text-[#2E7D5B]">100% Traceable</span>
              </div>
            </div>

            {/* S-Curve in Modal Preview */}
            <SCurveChart
              variant="compact"
              title="Physical Progress S-Curve (CPM Baseline vs Verified Actual)"
              subtitle="Statutory Cutoff: 18 Sep 2026"
            />
          </div>
        </Modal>

        {/* =========================================================================
            DRAWER: MEMORY RECORD INSPECTION
            ========================================================================= */}
        <Drawer
          isOpen={Boolean(selectedMemoryRecord)}
          onClose={() => setSelectedMemoryRecord(null)}
          title={`Memory Record: ${selectedMemoryRecord?.id || ''}`}
          subtitle={`${selectedMemoryRecord?.category || ''} · ${selectedMemoryRecord?.projectName || ''}`}
          width="lg"
        >
          {selectedMemoryRecord && (
            <div className="space-y-5 text-xs p-1">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                  {selectedMemoryRecord.category}
                </span>
                <h3 className="font-bold text-base text-[#172033] mt-1.5">
                  {selectedMemoryRecord.title}
                </h3>
                <p className="text-[11px] text-[#596579] font-mono mt-0.5">
                  {selectedMemoryRecord.projectName} ({selectedMemoryRecord.projectCode}) · {selectedMemoryRecord.date}
                </p>
              </div>

              {/* Source link card */}
              <div className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-[#7B8798] block">
                  Verified Source Record
                </span>
                <div className="font-bold text-xs text-[#172033]">
                  {selectedMemoryRecord.sourceVerifiedRecord.title}
                </div>
                <div className="font-mono text-[11px] text-[#176B87]">
                  Record ID: {selectedMemoryRecord.sourceVerifiedRecord.recordId}
                </div>
                <div className="font-mono text-[10px] text-[#596579]">
                  {selectedMemoryRecord.sourceVerifiedRecord.hashOrStamp}
                </div>
              </div>

              {/* Evidence link card */}
              <div className="p-3.5 bg-[#EDF7F2] border border-[#B8DCC9] rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#2E7D5B] block">
                    Linked Evidence Proof
                  </span>
                  <div className="font-bold text-xs text-[#172033] mt-0.5">
                    {selectedMemoryRecord.evidenceLink.title}
                  </div>
                  <div className="font-mono text-[11px] text-[#2E7D5B]">
                    {selectedMemoryRecord.evidenceLink.evidenceId}
                  </div>
                </div>

                <Link
                  href={selectedMemoryRecord.evidenceLink.linkUrl}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#25664A] rounded-lg shadow-xs flex items-center gap-1"
                >
                  <span>Open Evidence</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Verification sign-off */}
              <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg text-[11px] text-[#596579] space-y-1">
                <div>Verified By: <strong className="text-[#172033]">{selectedMemoryRecord.verifiedBy}</strong></div>
                <div>Timestamp: <span className="font-mono">{selectedMemoryRecord.verifiedAt}</span></div>
                <div>Confidence Score: <strong className="font-mono text-[#176B87]">{selectedMemoryRecord.confidenceScore}%</strong></div>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </StateWrapper>
  );
}
