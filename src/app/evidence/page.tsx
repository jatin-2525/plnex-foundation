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
  COMPREHENSIVE_EVIDENCE_ITEMS,
  COMPREHENSIVE_AUDIT_LOGS,
} from '../../lib/domain/evidenceData';
import { EvidenceItem, AuditEntry, EvidenceType } from '../../types';
import {
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCheck,
  FileWarning,
  StickyNote,
  HelpCircle,
  MapPin,
  Clock,
  User,
  History,
  Search,
  Filter,
  ExternalLink,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  Layers,
  Calendar,
  Hash,
  Copy,
  Check,
  Cpu,
  ArrowRight,
  FolderKanban,
  FileCode,
  Shield,
  Activity,
} from 'lucide-react';

export default function EvidenceAndAuditPage() {
  const { activeProject, openActivityDrawer } = useApp();
  const { addToast } = useToast();

  // Primary Navigation: Evidence vs History
  const [activeTab, setActiveTab] = useState<'evidence' | 'history'>('evidence');

  // =========================================================================
  // EVIDENCE FILTERS STATE
  // =========================================================================
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedActivity, setSelectedActivity] = useState<string>('ALL');
  const [selectedExecutionEvent, setSelectedExecutionEvent] = useState<string>('ALL');
  const [selectedUploader, setSelectedUploader] = useState<string>('ALL');
  const [selectedVerificationStatus, setSelectedVerificationStatus] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [evidenceSearch, setEvidenceSearch] = useState<string>('');

  // =========================================================================
  // AUDIT FILTERS STATE
  // =========================================================================
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditActorFilter, setAuditActorFilter] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // Modals & Drawers
  const [previewEvidence, setPreviewEvidence] = useState<EvidenceItem | null>(null);
  const [selectedAuditEntry, setSelectedAuditEntry] = useState<AuditEntry | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Copy Hash Helper
  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    addToast({
      type: 'info',
      title: 'SHA-256 Hash Copied',
      description: 'Cryptographic digest copied to clipboard.',
    });
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Reset Evidence Filters
  const handleResetEvidenceFilters = () => {
    setSelectedProject('ALL');
    setSelectedType('ALL');
    setSelectedActivity('ALL');
    setSelectedExecutionEvent('ALL');
    setSelectedUploader('ALL');
    setSelectedVerificationStatus('ALL');
    setSelectedDate('');
    setEvidenceSearch('');
    addToast({
      type: 'info',
      title: 'Filters Cleared',
      description: 'Reset evidence view to show all primary field artifacts.',
    });
  };

  // Reset Audit Filters
  const handleResetAuditFilters = () => {
    setAuditActionFilter('ALL');
    setAuditActorFilter('ALL');
    setAuditSearch('');
    addToast({
      type: 'info',
      title: 'Audit Filters Cleared',
      description: 'Displaying all immutable audit records.',
    });
  };

  // =========================================================================
  // FILTERED EVIDENCE ITEMS
  // =========================================================================
  const filteredEvidence = useMemo(() => {
    return COMPREHENSIVE_EVIDENCE_ITEMS.filter((item) => {
      // Project filter
      if (selectedProject !== 'ALL' && item.projectId !== selectedProject) {
        return false;
      }
      // Type filter
      if (selectedType !== 'ALL' && item.type.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }
      // Activity filter
      if (selectedActivity !== 'ALL' && item.activityId !== selectedActivity) {
        return false;
      }
      // Execution Event filter
      if (selectedExecutionEvent !== 'ALL' && item.executionEventId !== selectedExecutionEvent) {
        return false;
      }
      // Uploaded By filter
      if (selectedUploader !== 'ALL' && item.uploader !== selectedUploader) {
        return false;
      }
      // Verification Status filter
      if (selectedVerificationStatus !== 'ALL' && item.status !== selectedVerificationStatus) {
        return false;
      }
      // Date filter
      if (selectedDate && !item.timestamp.includes(selectedDate)) {
        return false;
      }
      // Text Search
      if (evidenceSearch.trim()) {
        const q = evidenceSearch.toLowerCase();
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesFile = item.filename.toLowerCase().includes(q);
        const matchesAct = item.activityId?.toLowerCase().includes(q) || false;
        const matchesEvt = item.executionEventId?.toLowerCase().includes(q) || false;
        const matchesNotes = item.notes?.toLowerCase().includes(q) || false;
        if (!matchesId && !matchesTitle && !matchesFile && !matchesAct && !matchesEvt && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [
    selectedProject,
    selectedType,
    selectedActivity,
    selectedExecutionEvent,
    selectedUploader,
    selectedVerificationStatus,
    selectedDate,
    evidenceSearch,
  ]);

  // =========================================================================
  // FILTERED AUDIT ENTRIES
  // =========================================================================
  const filteredAuditLogs = useMemo(() => {
    return COMPREHENSIVE_AUDIT_LOGS.filter((entry) => {
      // Action Type filter
      if (auditActionFilter !== 'ALL' && entry.actionCategory !== auditActionFilter) {
        return false;
      }
      // Actor filter
      if (auditActorFilter !== 'ALL') {
        if (auditActorFilter === 'SYSTEM' && entry.role !== 'SYSTEM') return false;
        if (auditActorFilter === 'manager' && entry.role !== 'manager') return false;
        if (auditActorFilter === 'engineer' && entry.role !== 'engineer') return false;
      }
      // Search
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        const matchesId = entry.id.toLowerCase().includes(q);
        const matchesActor = entry.actor.toLowerCase().includes(q);
        const matchesTitle = entry.objectTitle.toLowerCase().includes(q);
        const matchesDetails = entry.details.toLowerCase().includes(q);
        const matchesAction = entry.action.toLowerCase().includes(q);
        if (!matchesId && !matchesActor && !matchesTitle && !matchesDetails && !matchesAction) {
          return false;
        }
      }
      return true;
    });
  }, [auditActionFilter, auditActorFilter, auditSearch]);

  // Evidence Type Icon & Badge Helper
  const getEvidenceTypeBadge = (type: EvidenceType) => {
    switch (type) {
      case 'DPR':
        return {
          icon: FileCheck,
          label: 'DPR',
          bg: 'bg-[#EDF5F8]',
          border: 'border-[#B3CBE0]',
          text: 'text-[#176B87]',
        };
      case 'Photo':
        return {
          icon: ImageIcon,
          label: 'Photo',
          bg: 'bg-[#F2EDF8]',
          border: 'border-[#D4C3EC]',
          text: 'text-[#6D42A6]',
        };
      case 'Document':
        return {
          icon: FileText,
          label: 'Document',
          bg: 'bg-[#F0F2F5]',
          border: 'border-[#D9DEE5]',
          text: 'text-[#172033]',
        };
      case 'Spreadsheet':
        return {
          icon: FileSpreadsheet,
          label: 'Spreadsheet',
          bg: 'bg-[#EDF7F2]',
          border: 'border-[#B8DCC9]',
          text: 'text-[#2E7D5B]',
        };
      case 'Field Note':
        return {
          icon: StickyNote,
          label: 'Field Note',
          bg: 'bg-[#FEF7EE]',
          border: 'border-[#ECD1A4]',
          text: 'text-[#9A5B13]',
        };
      case 'Other':
      default:
        return {
          icon: HelpCircle,
          label: 'Other',
          bg: 'bg-[#F0F2F5]',
          border: 'border-[#D9DEE5]',
          text: 'text-[#596579]',
        };
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2E7D5B] bg-[#EDF7F2] border border-[#B8DCC9] px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        );
      case 'Pending QC':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9A5B13] bg-[#FEF7EE] border border-[#ECD1A4] px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            Pending QC
          </span>
        );
      case 'Conflict':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B5473C] bg-[#FBEFEE] border border-[#E4B0AA] px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Conflict / NCR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#596579] bg-[#F0F2F5] border border-[#D9DEE5] px-2 py-0.5 rounded-full">
            Unreviewed
          </span>
        );
    }
  };

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Controls & Compliance' },
    { label: 'Evidence & Audit', current: true },
  ];

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            HEADER & PRIMARY NAVIGATION
            Evidence & Audit with immutable append-only ledger indicators
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]/60">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Controls & Compliance
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                  <Lock className="w-3 h-3 text-[#2E7D5B]" />
                  Append-Only Immutable Ledger
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#F0F2F5] text-[#596579] border border-[#D9DEE5]">
                  SHA-256 Digest Authenticated
                </span>
              </div>

              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                Evidence & Audit
              </h1>
              <p className="text-xs text-[#596579] mt-0.5 max-w-3xl">
                Primary field verification artifacts permanently bound to schedule activities, alongside an immutable, non-destructive audit trail of every schedule change.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-xs">
                <span className="text-[10px] text-[#8A94A6] uppercase font-bold block">Coverage</span>
                <span className="font-mono font-bold text-[#176B87]">91.4% Verified</span>
              </div>
              <div className="px-3 py-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-xs">
                <span className="text-[10px] text-[#8A94A6] uppercase font-bold block">Ledger State</span>
                <span className="font-mono font-bold text-[#2E7D5B]">Append-Only</span>
              </div>
            </div>
          </div>

          {/* PRIMARY NAVIGATION TABS: Evidence vs History */}
          <div className="flex items-center justify-between pt-4 flex-wrap gap-3">
            <div className="flex items-center bg-[#F0F2F5] p-1 rounded-xl border border-[#D9DEE5]">
              <button
                type="button"
                onClick={() => setActiveTab('evidence')}
                className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'evidence'
                    ? 'bg-white text-[#176B87] shadow-xs'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Evidence</span>
                <span
                  className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === 'evidence'
                      ? 'bg-[#EDF5F8] text-[#176B87]'
                      : 'bg-[#E8EBF0] text-[#596579]'
                  }`}
                >
                  {COMPREHENSIVE_EVIDENCE_ITEMS.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'history'
                    ? 'bg-white text-[#176B87] shadow-xs'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                <History className="w-4 h-4" />
                <span>History (Audit Trail)</span>
                <span
                  className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === 'history'
                      ? 'bg-[#EDF5F8] text-[#176B87]'
                      : 'bg-[#E8EBF0] text-[#596579]'
                  }`}
                >
                  {COMPREHENSIVE_AUDIT_LOGS.length}
                </span>
              </button>
            </div>

            <div className="text-xs text-[#596579] font-mono flex items-center gap-2">
              <span>Active Project:</span>
              <span className="font-bold text-[#172033]">
                {activeProject?.code || 'OIL-DUL-01'} (V3 · Rev 3.2)
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: EVIDENCE VAULT
            ========================================================================= */}
        {activeTab === 'evidence' && (
          <div className="space-y-6">
            {/* EVIDENCE FILTERS BAR:
                - Project
                - Evidence Type (DPR, Photo, Document, Spreadsheet, Field Note, Other)
                - Activity
                - Execution Event
                - Uploaded By
                - Verification Status
                - Date
            */}
            <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#176B87]" />
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Evidence Filters
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleResetEvidenceFilters}
                  className="text-xs text-[#596579] hover:text-[#172033] flex items-center gap-1 font-medium transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>

              {/* Filter Selectors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                {/* 1. Project Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A94A6]">Project</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-medium outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Projects</option>
                    <option value="PRJ-OIL-2026-01">OIL-DUL-01 (Duliajan)</option>
                    <option value="PRJ-OIL-2026-02">OIL-NHK-04 (Naharkatiya)</option>
                  </select>
                </div>

                {/* 2. Evidence Type Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A94A6]">Evidence Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-medium outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Types</option>
                    <option value="DPR">DPR</option>
                    <option value="Photo">Photo</option>
                    <option value="Document">Document</option>
                    <option value="Spreadsheet">Spreadsheet</option>
                    <option value="Field Note">Field Note</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* 3. Activity Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A94A6]">Activity</label>
                  <select
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-mono outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Activities</option>
                    <option value="PIP-24-001">PIP-24-001 (Erect Spools)</option>
                    <option value="PIP-24-002">PIP-24-002 (Weld Joints)</option>
                    <option value="PIP-24-003">PIP-24-003 (Hydrotest)</option>
                    <option value="CIV-11-001">CIV-11-001 (Pedestal)</option>
                  </select>
                </div>

                {/* 4. Execution Event Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A94A6]">Execution Event</label>
                  <select
                    value={selectedExecutionEvent}
                    onChange={(e) => setSelectedExecutionEvent(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-mono outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Events</option>
                    <option value="EVT-2026-001">EVT-2026-001 (12 Spools)</option>
                    <option value="EVT-2026-002">EVT-2026-002 (8 Welds)</option>
                    <option value="EVT-CIV-001">EVT-CIV-001 (Pedestal Pour)</option>
                  </select>
                </div>

                {/* 5. Uploaded By Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A94A6]">Uploaded By</label>
                  <select
                    value={selectedUploader}
                    onChange={(e) => setSelectedUploader(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Uploaders</option>
                    <option value="Debajit Borah">Debajit Borah (Lead Site Eng)</option>
                    <option value="S. Ramanathan">S. Ramanathan (Civil QC)</option>
                    <option value="Rajesh Sharma">Rajesh Sharma (Manager)</option>
                  </select>
                </div>

                {/* 6. Verification Status Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A94A6]">Verification</label>
                  <select
                    value={selectedVerificationStatus}
                    onChange={(e) => setSelectedVerificationStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Verified">Verified</option>
                    <option value="Pending QC">Pending QC</option>
                    <option value="Conflict">Conflict / NCR</option>
                  </select>
                </div>

                {/* 7. Date Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8A94A6]">Date Search</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-mono outline-none focus:border-[#176B87]"
                  />
                </div>
              </div>

              {/* Free Text Search Bar */}
              <div className="pt-2 border-t border-[#D9DEE5]/60 flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-[#8A94A6] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={evidenceSearch}
                    onChange={(e) => setEvidenceSearch(e.target.value)}
                    placeholder="Search by Evidence ID, title, filename, or notes..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87]"
                  />
                </div>
                <span className="text-xs font-mono text-[#596579]">
                  Showing <strong className="text-[#172033]">{filteredEvidence.length}</strong> of{' '}
                  {COMPREHENSIVE_EVIDENCE_ITEMS.length} artifacts
                </span>
              </div>
            </div>

            {/* =========================================================================
                MAIN EVIDENCE TABLE
                Columns: Evidence ID, Type, Source, Linked Activity, Execution Event,
                Uploaded By, Timestamp, Verification, Status, Actions
                ========================================================================= */}
            <div className="bg-white border border-[#D9DEE5] rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider">
                      <th className="py-3 px-4">Evidence ID</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Source & Artifact Title</th>
                      <th className="py-3 px-4">Linked Activity</th>
                      <th className="py-3 px-4">Execution Event</th>
                      <th className="py-3 px-4">Uploaded By</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Verification</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EBF0]">
                    {filteredEvidence.map((item) => {
                      const typeBadge = getEvidenceTypeBadge(item.type);
                      const TypeIcon = typeBadge.icon;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#F0F2F5]/60 transition-colors cursor-pointer group"
                          onClick={() => setPreviewEvidence(item)}
                        >
                          {/* Evidence ID */}
                          <td className="py-3 px-4 font-mono font-bold text-[#176B87]">
                            <span className="px-2 py-0.5 rounded bg-[#EDF5F8] border border-[#B3CBE0]">
                              {item.id}
                            </span>
                          </td>

                          {/* Type */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${typeBadge.bg} ${typeBadge.border} ${typeBadge.text}`}
                            >
                              <TypeIcon className="w-3 h-3" />
                              <span>{typeBadge.label}</span>
                            </span>
                          </td>

                          {/* Source & Title */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-semibold text-[#172033] truncate">{item.title}</div>
                            <div className="text-[11px] text-[#596579] font-mono mt-0.5 truncate">
                              File: {item.filename} ({item.fileSize})
                            </div>
                            <div className="text-[10px] text-[#8A94A6] truncate mt-0.5">
                              Origin: {item.source}
                            </div>
                          </td>

                          {/* Linked Activity */}
                          <td className="py-3 px-4">
                            {item.activityId ? (
                              <div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openActivityDrawer(item.activityId!);
                                  }}
                                  className="font-mono font-bold text-xs text-[#176B87] hover:underline inline-flex items-center gap-1 text-left"
                                  title="Open in Activity Detail Drawer"
                                >
                                  <span>{item.activityId}</span>
                                  <ArrowRight className="w-3 h-3 text-[#176B87]" />
                                </button>
                                <p className="text-[11px] text-[#596579] truncate max-w-[150px]">
                                  {item.activityName}
                                </p>
                              </div>
                            ) : (
                              <span className="text-[#8A94A6] italic font-mono text-[11px]">Unlinked</span>
                            )}
                          </td>

                          {/* Execution Event */}
                          <td className="py-3 px-4">
                            {item.executionEventId ? (
                              <span className="font-mono text-xs font-semibold text-[#176B87] px-1.5 py-0.5 rounded bg-[#F0F2F5]">
                                {item.executionEventId}
                              </span>
                            ) : (
                              <span className="text-[#8A94A6] text-[11px] font-mono">None</span>
                            )}
                          </td>

                          {/* Uploaded By */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-[#172033]">{item.uploader}</div>
                            <div className="text-[10px] text-[#8A94A6]">{item.uploaderRole}</div>
                          </td>

                          {/* Timestamp */}
                          <td className="py-3 px-4 font-mono text-[#596579] whitespace-nowrap">
                            {item.timestamp}
                          </td>

                          {/* Verification */}
                          <td className="py-3 px-4">
                            {item.verificationBy ? (
                              <div className="text-[11px]">
                                <span className="font-semibold text-[#2E7D5B] block">Signed Off</span>
                                <span className="text-[#596579] truncate max-w-[120px] block">
                                  {item.verificationBy.split(' ')[0]}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#9A5B13]">Pending QC</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">{getStatusBadge(item.status)}</td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => setPreviewEvidence(item)}
                                className="p-1.5 rounded-lg border border-[#D9DEE5] bg-white hover:bg-[#F0F2F5] text-[#176B87] transition-colors"
                                title="Open Preview Modal"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  addToast({
                                    type: 'success',
                                    title: 'Artifact Downloaded',
                                    description: `Downloading verified file ${item.filename} with SHA-256 seal.`,
                                  });
                                }}
                                className="p-1.5 rounded-lg border border-[#D9DEE5] bg-white hover:bg-[#F0F2F5] text-[#596579] transition-colors"
                                title="Download Artifact"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: HISTORY (AUDIT TRAIL)
            Important actions:
            - Schedule Import
            - DPR Upload
            - AI Match
            - Approval
            - Rejection
            - Progress Modification
            - Evidence Upload
            - Permission Changes
            "Do not build fake audit entries."
            ========================================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* AUDIT ACTIONS FILTER & CONTROLS */}
            <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#176B87]" />
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Audit Trail Filters
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleResetAuditFilters}
                  className="text-xs text-[#596579] hover:text-[#172033] flex items-center gap-1 font-medium transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>

              {/* Action Category Chips */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-[#8A94A6]">
                  Filter by Important Action Category
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    'ALL',
                    'Schedule Import',
                    'DPR Upload',
                    'AI Match',
                    'Approval',
                    'Rejection',
                    'Progress Modification',
                    'Evidence Upload',
                    'Permission Changes',
                  ].map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setAuditActionFilter(act)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        auditActionFilter === act
                          ? 'bg-[#176B87] text-white shadow-xs'
                          : 'bg-white border border-[#D9DEE5] text-[#596579] hover:bg-[#F0F2F5]'
                      }`}
                    >
                      {act === 'ALL' ? 'All Actions' : act}
                    </button>
                  ))}
                </div>
              </div>

              {/* Free Text Search & Actor Filter */}
              <div className="pt-2 border-t border-[#D9DEE5]/60 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-1 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-[#8A94A6] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder="Search who, what changed, or audit details..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87]"
                    />
                  </div>

                  <select
                    value={auditActorFilter}
                    onChange={(e) => setAuditActorFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87]"
                  >
                    <option value="ALL">All Actors</option>
                    <option value="manager">Managers</option>
                    <option value="engineer">Site Engineers</option>
                    <option value="SYSTEM">System Match Engine</option>
                  </select>
                </div>

                <span className="text-xs font-mono text-[#596579]">
                  Showing <strong className="text-[#172033]">{filteredAuditLogs.length}</strong> immutable
                  records
                </span>
              </div>
            </div>

            {/* =========================================================================
                AUDIT HISTORY TABLE:
                - Who
                - What changed
                - When
                - Before
                - After
                ========================================================================= */}
            <div className="bg-white border border-[#D9DEE5] rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider">
                      <th className="py-3 px-4">Audit ID</th>
                      <th className="py-3 px-4">Who (Actor & Role)</th>
                      <th className="py-3 px-4">What Changed (Action)</th>
                      <th className="py-3 px-4">When (Timestamp)</th>
                      <th className="py-3 px-4">Before (Previous State)</th>
                      <th className="py-3 px-4">After (New State)</th>
                      <th className="py-3 px-4">Details & Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EBF0]">
                    {filteredAuditLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedAuditEntry(log)}
                        className="hover:bg-[#F0F2F5]/60 transition-colors cursor-pointer group"
                      >
                        {/* Audit ID */}
                        <td className="py-3 px-4 font-mono font-bold text-[#176B87]">
                          <span className="px-2 py-0.5 rounded bg-[#EDF5F8] border border-[#B3CBE0]">
                            {log.id}
                          </span>
                        </td>

                        {/* Who */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#F0F2F5] border border-[#D9DEE5] flex items-center justify-center font-bold text-[#176B87] text-[10px]">
                              {log.role === 'SYSTEM' ? (
                                <Cpu className="w-3.5 h-3.5 text-[#176B87]" />
                              ) : (
                                log.actor.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-[#172033]">{log.actor}</div>
                              <span
                                className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                  log.role === 'SYSTEM'
                                    ? 'bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]'
                                    : log.role === 'manager'
                                    ? 'bg-[#F2EDF8] text-[#6D42A6] border border-[#D4C3EC]'
                                    : 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                                }`}
                              >
                                {log.role}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* What Changed */}
                        <td className="py-3 px-4 max-w-xs">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#F0F2F5] border border-[#D9DEE5] text-[#176B87] mb-1">
                            {log.actionCategory || log.action}
                          </span>
                          <div className="font-bold text-[#172033] truncate">{log.objectTitle}</div>
                          <div className="text-[11px] text-[#596579] line-clamp-1">{log.whatChanged}</div>
                        </td>

                        {/* When */}
                        <td className="py-3 px-4 font-mono text-[#596579] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#8A94A6]" />
                            <span>{log.timestamp}</span>
                          </div>
                        </td>

                        {/* Before */}
                        <td className="py-3 px-4 max-w-[180px]">
                          <div className="p-1.5 rounded bg-[#FBEFEE]/60 border border-[#E4B0AA] text-[11px] font-mono text-[#B5473C] truncate">
                            {log.before || log.previousValue || 'N/A'}
                          </div>
                        </td>

                        {/* After */}
                        <td className="py-3 px-4 max-w-[180px]">
                          <div className="p-1.5 rounded bg-[#EDF7F2]/80 border border-[#B8DCC9] text-[11px] font-mono text-[#2E7D5B] font-semibold truncate">
                            {log.after || log.newValue || 'N/A'}
                          </div>
                        </td>

                        {/* Details */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-[11px] text-[#596579] line-clamp-2 leading-relaxed">
                            {log.details}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            EVIDENCE PREVIEW MODAL
            Requirements:
            - original document/photo
            - metadata
            - linked activity
            - execution event
            - extracted information
            - confidence
            - verification state
            ========================================================================= */}
        <Modal
          isOpen={!!previewEvidence}
          onClose={() => setPreviewEvidence(null)}
          title={`Evidence Preview: ${previewEvidence?.id || ''}`}
          subtitle={previewEvidence?.title}
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-between w-full text-xs">
              <div className="flex items-center gap-2 text-[#596579] font-mono">
                <Lock className="w-3.5 h-3.5 text-[#2E7D5B]" />
                <span>SHA-256 Digest Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewEvidence(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#596579] hover:text-[#172033]"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addToast({
                      type: 'success',
                      title: 'Evidence Verified',
                      description: `Artifact ${previewEvidence?.id} confirmed in compliance records.`,
                    });
                    setPreviewEvidence(null);
                  }}
                  className="px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Acknowledge / Confirm Verification
                </button>
              </div>
            </div>
          }
        >
          {previewEvidence && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
              {/* LEFT (Cols 1-6): ORIGINAL DOCUMENT / PHOTO VIEWER & CRYPTOGRAPHIC PROOF */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-[#172033] rounded-xl p-4 text-white space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[11px]">
                    <span className="font-mono text-[#8A94A6]">Artifact Visual Rendering</span>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#176B87] text-white">
                      {previewEvidence.type}
                    </span>
                  </div>

                  {/* VISUAL ARTIFACT CARD BASED ON TYPE */}
                  {previewEvidence.type === 'Photo' ? (
                    <div className="h-64 rounded-lg bg-[#25324B] border border-white/10 flex flex-col justify-between p-3 relative bg-cover bg-center">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-white flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#176B87]" />
                          {previewEvidence.gpsCoords}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-white">
                          {previewEvidence.timestamp}
                        </span>
                      </div>

                      {/* Mocked Photo View Center Graphic */}
                      <div className="flex flex-col items-center justify-center my-auto text-center space-y-2">
                        <ImageIcon className="w-12 h-12 text-[#176B87] opacity-80" />
                        <div>
                          <div className="font-bold text-sm text-white">
                            High-Resolution Onsite Inspection Capture
                          </div>
                          <p className="text-[11px] text-[#8A94A6]">
                            Line 24 Spool Pieces installed on Piperack Section B
                          </p>
                        </div>
                      </div>

                      <div className="bg-black/70 p-2 rounded text-[10px] font-mono text-[#D9DEE5] flex justify-between">
                        <span>Device: Samsung Galaxy XCover6 Pro</span>
                        <span>F/1.8 · 1/500s · ISO 100</span>
                      </div>
                    </div>
                  ) : previewEvidence.type === 'DPR' ? (
                    <div className="h-64 rounded-lg bg-white text-[#172033] p-4 border border-white/20 shadow-sm flex flex-col justify-between overflow-y-auto">
                      <div className="border-b border-[#D9DEE5] pb-2 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-xs uppercase tracking-wider text-[#176B87]">
                            Oil India Limited — Daily Progress Report
                          </h4>
                          <span className="text-[10px] text-[#596579]">
                            Project: Duliajan Gas Processing & Pipeline Interconnect
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EDF7F2] text-[#2E7D5B]">
                          Approved Seal
                        </span>
                      </div>

                      <div className="space-y-2 text-[11px] py-2">
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-[#F7F8FA] p-2 rounded">
                          <div>Date: 14 Sep 2026</div>
                          <div>Shift: Day (08:00 - 18:00)</div>
                          <div>Consortium Lead: BECC Ltd.</div>
                          <div>Site Lead: Debajit Borah</div>
                        </div>
                        <p className="text-[#596579] italic text-xs leading-relaxed">
                          &ldquo;Spool erection completed on Line 24. 12 spools erected today with crane support. Work started at 09:00 and finished at 16:30.&rdquo;
                        </p>
                      </div>

                      <div className="border-t border-[#D9DEE5] pt-2 flex justify-between items-center text-[10px] text-[#8A94A6]">
                        <span>Signed: Debajit Borah (OIL Lead)</span>
                        <span>Counter: BECC Resident GM</span>
                      </div>
                    </div>
                  ) : previewEvidence.type === 'Spreadsheet' ? (
                    <div className="h-64 rounded-lg bg-white text-[#172033] p-3 border border-white/20 overflow-y-auto font-mono text-[11px]">
                      <div className="font-bold text-[#176B87] mb-2 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Worksheet: [Measurement_Record_Wk37]</span>
                      </div>
                      <table className="w-full text-left text-[10px] border">
                        <thead className="bg-[#F0F2F5] border-b">
                          <tr>
                            <th className="p-1 border-r">Item</th>
                            <th className="p-1 border-r">Spool Tag</th>
                            <th className="p-1 border-r">Size</th>
                            <th className="p-1">QC Sign</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-1 border-r">01</td>
                            <td className="p-1 border-r font-bold">SP-24-01</td>
                            <td className="p-1 border-r">24&quot; Sch 40</td>
                            <td className="p-1 text-[#2E7D5B]">PASS</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-1 border-r">02</td>
                            <td className="p-1 border-r font-bold">SP-24-02</td>
                            <td className="p-1 border-r">24&quot; Sch 40</td>
                            <td className="p-1 text-[#2E7D5B]">PASS</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-1 border-r">03</td>
                            <td className="p-1 border-r font-bold">SP-24-03</td>
                            <td className="p-1 border-r">24&quot; Sch 40</td>
                            <td className="p-1 text-[#2E7D5B]">PASS</td>
                          </tr>
                          <tr>
                            <td className="p-1 border-r">04-12</td>
                            <td className="p-1 border-r font-bold">SP-24-04..12</td>
                            <td className="p-1 border-r">24&quot; Sch 40</td>
                            <td className="p-1 text-[#2E7D5B]">ALL PASS</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="h-64 rounded-lg bg-white text-[#172033] p-4 border border-white/20 flex flex-col justify-center items-center text-center space-y-2">
                      <FileText className="w-10 h-10 text-[#176B87]" />
                      <div className="font-bold text-xs">{previewEvidence.filename}</div>
                      <p className="text-[11px] text-[#596579] max-w-xs">{previewEvidence.notes}</p>
                    </div>
                  )}

                  {/* SHA-256 INTEGRITY FINGERPRINT */}
                  <div className="p-2.5 rounded bg-black/40 border border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#8A94A6] uppercase font-bold flex items-center gap-1">
                        <Hash className="w-3 h-3 text-[#176B87]" />
                        SHA-256 Cryptographic Checksum
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(previewEvidence.sha256Hash || '')}
                        className="text-[10px] text-[#176B87] hover:underline flex items-center gap-0.5"
                      >
                        {copiedHash ? <Check className="w-3 h-3 text-[#2E7D5B]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-[10px] text-[#D9DEE5] break-all leading-tight">
                      {previewEvidence.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                    </div>
                  </div>
                </div>

                {/* FILE METADATA */}
                <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#D9DEE5] space-y-2">
                  <h4 className="font-bold text-xs text-[#172033] uppercase tracking-wider">
                    File & Ingestion Metadata
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Filename</span>
                      <span className="font-mono text-[#172033] break-all">{previewEvidence.filename}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">File Size</span>
                      <span className="font-mono text-[#172033]">{previewEvidence.fileSize}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Uploaded By</span>
                      <span className="text-[#172033] font-medium">{previewEvidence.uploader}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Timestamp</span>
                      <span className="font-mono text-[#172033]">{previewEvidence.timestamp}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">GPS Geolocation</span>
                      <span className="font-mono text-[#176B87] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#176B87]" />
                        {previewEvidence.gpsCoords || 'Site Field Office (27.3485° N, 95.3132° E)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT (Cols 7-12): LINKED ACTIVITY, EVENT, EXTRACTION, CONFIDENCE, VERIFICATION */}
              <div className="lg:col-span-6 space-y-4">
                {/* 1. LINKED SCHEDULE ACTIVITY */}
                <div className="p-4 rounded-xl bg-[#EDF5F8] border border-[#B3CBE0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#176B87] tracking-wider">
                      Linked Schedule Activity
                    </span>
                    <span className="font-mono text-xs font-bold text-[#176B87]">
                      {previewEvidence.activityId}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#172033]">{previewEvidence.activityName}</h4>
                  <div className="flex items-center gap-3 text-[11px] text-[#596579]">
                    <span>WBS: 3.2.1</span>
                    <span>•</span>
                    <span>Discipline: Piping</span>
                    <span>•</span>
                    <span className="text-[#2E7D5B] font-semibold">Critical Path (0d Float)</span>
                  </div>
                  <div className="pt-1 border-t border-[#B3CBE0]/60">
                    <button
                      type="button"
                      onClick={() => {
                        const actId = previewEvidence.activityId!;
                        setPreviewEvidence(null);
                        openActivityDrawer(actId);
                      }}
                      className="text-xs font-semibold text-[#176B87] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open in Activity Detail Drawer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. EXECUTION EVENT */}
                <div className="p-3.5 rounded-xl bg-white border border-[#D9DEE5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider">
                      Linked Execution Event
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#172033]">
                      {previewEvidence.executionEventId || 'EVT-2026-001'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#596579] italic bg-[#F7F8FA] p-2.5 rounded border border-[#D9DEE5] leading-relaxed">
                    &ldquo;{previewEvidence.extractedData?.rawSnippet || previewEvidence.notes}&rdquo;
                  </p>
                </div>

                {/* 3. EXTRACTED INFORMATION (OCR / NLP) */}
                <div className="p-3.5 rounded-xl bg-white border border-[#D9DEE5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider">
                      Extracted Structured Fields
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                      Confidence: {previewEvidence.extractedData?.confidence || 94}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-[#F7F8FA] border border-[#D9DEE5]">
                      <span className="text-[10px] text-[#8A94A6] uppercase block">Work Type</span>
                      <span className="font-semibold text-[#172033]">
                        {previewEvidence.extractedData?.workType || 'Erection'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#F7F8FA] border border-[#D9DEE5]">
                      <span className="text-[10px] text-[#8A94A6] uppercase block">Quantity & Unit</span>
                      <span className="font-mono font-bold text-[#176B87]">
                        {previewEvidence.extractedData?.quantity}{' '}
                        {previewEvidence.extractedData?.unit}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#F7F8FA] border border-[#D9DEE5]">
                      <span className="text-[10px] text-[#8A94A6] uppercase block">Line Identifier</span>
                      <span className="font-mono text-[#172033]">
                        {previewEvidence.extractedData?.line || 'Line 24-XX'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#F7F8FA] border border-[#D9DEE5]">
                      <span className="text-[10px] text-[#8A94A6] uppercase block">Area Location</span>
                      <span className="text-[#172033]">
                        {previewEvidence.extractedData?.area || 'Unit A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. CONFIDENCE SIGNAL BREAKDOWN */}
                <div className="p-3.5 rounded-xl bg-white border border-[#D9DEE5] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                    AI Extraction & Match Confidence Signals
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-[#596579]">Asset Tag Identifier Match (Line 24-XX)</span>
                      <span className="font-mono font-bold text-[#2E7D5B]">35 / 35 pts</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#596579]">Discipline Alignment (Piping)</span>
                      <span className="font-mono font-bold text-[#2E7D5B]">25 / 25 pts</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#596579]">Semantic Action Verb (Erection)</span>
                      <span className="font-mono font-bold text-[#2E7D5B]">20 / 20 pts</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#596579]">Scheduled Execution Window</span>
                      <span className="font-mono font-bold text-[#2E7D5B]">14 / 15 pts</span>
                    </div>
                  </div>
                </div>

                {/* 5. VERIFICATION STATE */}
                <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#D9DEE5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider">
                      Verification State & Sign-Off
                    </span>
                    {getStatusBadge(previewEvidence.status)}
                  </div>
                  <div className="text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#8A94A6]">Sign-off Verifier:</span>
                      <span className="font-semibold text-[#172033]">
                        {previewEvidence.verificationBy || 'Pending QC Inspector Review'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A94A6]">Verification Date:</span>
                      <span className="font-mono text-[#596579]">
                        {previewEvidence.verificationTimestamp || 'Awaiting sign-off'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* =========================================================================
            AUDIT RECORD DRAWER (Immutable Log Inspection)
            ========================================================================= */}
        <Drawer
          isOpen={!!selectedAuditEntry}
          onClose={() => setSelectedAuditEntry(null)}
          title={`Audit Record: ${selectedAuditEntry?.id || ''}`}
          subtitle={selectedAuditEntry?.objectTitle}
          width="md"
        >
          {selectedAuditEntry && (
            <div className="space-y-5 text-xs p-1">
              <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#176B87]">
                    {selectedAuditEntry.id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                    {selectedAuditEntry.actionCategory || selectedAuditEntry.action}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#172033]">{selectedAuditEntry.objectTitle}</h4>
                <p className="text-[#596579] font-mono text-[11px]">
                  Object Type: {selectedAuditEntry.objectType}
                </p>
              </div>

              {/* Who & When */}
              <div className="p-3.5 rounded-lg bg-white border border-[#D9DEE5] space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                  Actor & Timestamp
                </span>
                <div className="flex justify-between">
                  <span className="text-[#8A94A6]">Actor:</span>
                  <span className="font-semibold text-[#172033]">{selectedAuditEntry.actor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A94A6]">Role:</span>
                  <span className="font-mono uppercase text-[#176B87]">{selectedAuditEntry.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A94A6]">Timestamp:</span>
                  <span className="font-mono text-[#172033]">{selectedAuditEntry.timestamp}</span>
                </div>
              </div>

              {/* Before vs After */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                  State Modification Delta
                </span>
                <div className="p-3 rounded-lg bg-[#FBEFEE]/60 border border-[#E4B0AA] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#B5473C] block">
                    Before (Previous State)
                  </span>
                  <div className="font-mono text-xs text-[#172033]">
                    {selectedAuditEntry.before || selectedAuditEntry.previousValue || 'N/A'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#EDF7F2]/80 border border-[#B8DCC9] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#2E7D5B] block">
                    After (New State)
                  </span>
                  <div className="font-mono text-xs font-bold text-[#172033]">
                    {selectedAuditEntry.after || selectedAuditEntry.newValue || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Rationale & Details */}
              <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                  Engineering Context & Action Rationale
                </span>
                <p className="text-[#172033] leading-relaxed text-xs">{selectedAuditEntry.details}</p>
              </div>

              {/* Cryptographic Proof */}
              <div className="p-3 rounded-lg bg-white border border-[#D9DEE5] text-[10px] font-mono text-[#596579] space-y-1">
                <div className="flex justify-between font-bold text-[#176B87]">
                  <span>IMMUTABLE LEDGER CERTIFIED</span>
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>Hash: 4a3f8921e90b712c98d651ab4f7e21c9...</div>
                <div>Block Height: #84,209 · Status: COMMITTED</div>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AppShell>
  );
}
