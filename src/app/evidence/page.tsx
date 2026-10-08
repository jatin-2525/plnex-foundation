'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { Modal } from '../../components/shared/Modal';
import { Drawer } from '../../components/shared/Drawer';
import { StatusBadge } from '../../components/shared/StatusBadge';
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
  StickyNote,
  HelpCircle,
  MapPin,
  Clock,
  User,
  History,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Lock,
  Layers,
  Copy,
  Check,
  ArrowRight,
  ArrowDown,
  FolderKanban,
  Shield,
  Activity,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Database,
  Key,
  Calendar,
  ExternalLink,
} from 'lucide-react';

export default function EvidenceAndAuditPage() {
  const { activeProject, openActivityDrawer } = useApp();
  const { addToast } = useToast();

  // Primary 3 Canonical Tabs: Evidence | Audit History | Verification History
  const [activeTab, setActiveTab] = useState<'evidence' | 'audit_history' | 'verification_history'>('evidence');

  // =========================================================================
  // EVIDENCE FILTERS STATE
  // =========================================================================
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedActivity, setSelectedActivity] = useState<string>('ALL');
  const [selectedExecutionEvent, setSelectedExecutionEvent] = useState<string>('ALL');
  const [selectedUploader, setSelectedUploader] = useState<string>('ALL');
  const [selectedVerificationStatus, setSelectedVerificationStatus] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [evidenceSearch, setEvidenceSearch] = useState<string>('');

  // Expandable Technical Metadata per Evidence item
  const [expandedMetadataIds, setExpandedMetadataIds] = useState<Record<string, boolean>>({});

  const toggleExpandMetadata = (id: string) => {
    setExpandedMetadataIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // =========================================================================
  // AUDIT FILTERS STATE
  // =========================================================================
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditActorFilter, setAuditActorFilter] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // =========================================================================
  // VERIFICATION HISTORY FILTERS STATE
  // =========================================================================
  const [verificationStatusFilter, setVerificationStatusFilter] = useState<string>('ALL');
  const [verificationSearch, setVerificationSearch] = useState<string>('');

  // Modals & Drawers
  const [previewEvidence, setPreviewEvidence] = useState<EvidenceItem | null>(null);
  const [selectedAuditEntry, setSelectedAuditEntry] = useState<AuditEntry | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Copy Hash Helper
  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    addToast({
      type: 'info',
      title: 'SHA-256 Digest Copied',
      description: 'Cryptographic hash copied to clipboard.',
    });
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Reset Evidence Filters
  const handleResetEvidenceFilters = () => {
    setSelectedType('ALL');
    setSelectedActivity('ALL');
    setSelectedExecutionEvent('ALL');
    setSelectedUploader('ALL');
    setSelectedVerificationStatus('ALL');
    setSelectedDate('');
    setEvidenceSearch('');
    addToast({
      type: 'info',
      title: 'Filters Reset',
      description: 'Displaying all primary project evidence records.',
    });
  };

  // Reset Audit Filters
  const handleResetAuditFilters = () => {
    setAuditActionFilter('ALL');
    setAuditActorFilter('ALL');
    setAuditSearch('');
    addToast({
      type: 'info',
      title: 'Audit Filters Reset',
      description: 'Displaying all audit trail records.',
    });
  };

  // Reset Verification Filters
  const handleResetVerificationFilters = () => {
    setVerificationStatusFilter('ALL');
    setVerificationSearch('');
    addToast({
      type: 'info',
      title: 'Verification Filters Reset',
      description: 'Displaying all verification history records.',
    });
  };

  // =========================================================================
  // FILTERED EVIDENCE ITEMS
  // =========================================================================
  const filteredEvidence = useMemo(() => {
    return COMPREHENSIVE_EVIDENCE_ITEMS.filter((item) => {
      if (selectedType !== 'ALL' && item.type.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }
      if (selectedActivity !== 'ALL' && item.activityId !== selectedActivity) {
        return false;
      }
      if (selectedExecutionEvent !== 'ALL' && item.executionEventId !== selectedExecutionEvent) {
        return false;
      }
      if (selectedUploader !== 'ALL' && item.uploader !== selectedUploader) {
        return false;
      }
      if (selectedVerificationStatus !== 'ALL' && item.status !== selectedVerificationStatus) {
        return false;
      }
      if (selectedDate && !item.timestamp.includes(selectedDate)) {
        return false;
      }
      if (evidenceSearch.trim()) {
        const q = evidenceSearch.toLowerCase();
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesFile = item.filename.toLowerCase().includes(q);
        const matchesAct = item.activityId?.toLowerCase().includes(q) || false;
        const matchesEvt = item.executionEventId?.toLowerCase().includes(q) || false;
        const matchesSource = item.source?.toLowerCase().includes(q) || false;
        const matchesNotes = item.notes?.toLowerCase().includes(q) || false;
        if (!matchesId && !matchesTitle && !matchesFile && !matchesAct && !matchesEvt && !matchesNotes && !matchesSource) {
          return false;
        }
      }
      return true;
    });
  }, [
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
      if (auditActionFilter !== 'ALL' && entry.actionCategory !== auditActionFilter) {
        return false;
      }
      if (auditActorFilter !== 'ALL') {
        if (auditActorFilter === 'SYSTEM' && entry.role !== 'SYSTEM') return false;
        if (auditActorFilter === 'manager' && entry.role !== 'manager') return false;
        if (auditActorFilter === 'engineer' && entry.role !== 'engineer') return false;
      }
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        const matchesId = entry.id.toLowerCase().includes(q);
        const matchesActor = entry.actor.toLowerCase().includes(q);
        const matchesTitle = entry.objectTitle.toLowerCase().includes(q);
        const matchesDetails = entry.details.toLowerCase().includes(q);
        const matchesAction = entry.action.toLowerCase().includes(q);
        const matchesReason = entry.reason?.toLowerCase().includes(q) || false;
        if (!matchesId && !matchesActor && !matchesTitle && !matchesDetails && !matchesAction && !matchesReason) {
          return false;
        }
      }
      return true;
    });
  }, [auditActionFilter, auditActorFilter, auditSearch]);

  // =========================================================================
  // FILTERED VERIFICATION HISTORY ITEMS
  // =========================================================================
  const filteredVerificationHistory = useMemo(() => {
    return COMPREHENSIVE_EVIDENCE_ITEMS.filter((item) => {
      if (verificationStatusFilter !== 'ALL' && item.status !== verificationStatusFilter) {
        return false;
      }
      if (verificationSearch.trim()) {
        const q = verificationSearch.toLowerCase();
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesVerifier = item.verificationBy?.toLowerCase().includes(q) || false;
        const matchesAct = item.activityId?.toLowerCase().includes(q) || false;
        const matchesEvt = item.executionEventId?.toLowerCase().includes(q) || false;
        const matchesNotes = item.notes?.toLowerCase().includes(q) || false;
        if (!matchesId && !matchesTitle && !matchesVerifier && !matchesAct && !matchesEvt && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [verificationStatusFilter, verificationSearch]);

  // Verification Summary Counts
  const verifiedCount = useMemo(() => {
    return COMPREHENSIVE_EVIDENCE_ITEMS.filter((i) => i.status === 'Verified').length;
  }, []);

  const pendingCount = useMemo(() => {
    return COMPREHENSIVE_EVIDENCE_ITEMS.filter((i) => i.status === 'Pending QC').length;
  }, []);

  const conflictCount = useMemo(() => {
    return COMPREHENSIVE_EVIDENCE_ITEMS.filter((i) => i.status === 'Conflict').length;
  }, []);

  // Evidence Type Icon & Badge Helper
  const getEvidenceTypeBadge = (type: EvidenceType) => {
    switch (type) {
      case 'DPR':
        return { icon: FileCheck, label: 'DPR', bg: 'bg-[#EDF5F8]', border: 'border-[#B3CBE0]', text: 'text-[#176B87]' };
      case 'Photo':
        return { icon: ImageIcon, label: 'Photo', bg: 'bg-[#EDF5F8]', border: 'border-[#B3CBE0]', text: 'text-[#3B6EA8]' };
      case 'Document':
        return { icon: FileText, label: 'Document', bg: 'bg-[#F1F3F5]', border: 'border-[#D9DEE5]', text: 'text-[#172033]' };
      case 'Spreadsheet':
        return { icon: FileSpreadsheet, label: 'Spreadsheet', bg: 'bg-[#EDF7F2]', border: 'border-[#B8DCC9]', text: 'text-[#2E7D5B]' };
      case 'Field Note':
        return { icon: StickyNote, label: 'Field Note', bg: 'bg-[#FDF6ED]', border: 'border-[#F0D4A6]', text: 'text-[#8C5311]' };
      default:
        return { icon: HelpCircle, label: 'Other', bg: 'bg-[#F1F3F5]', border: 'border-[#D9DEE5]', text: 'text-[#596579]' };
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
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8C5311] bg-[#FDF6ED] border border-[#F0D4A6] px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            Pending QC
          </span>
        );
      case 'Conflict':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B5473C] bg-[#FBEFEE] border border-[#E4B0AA] px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Conflict
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#596579] bg-[#F1F3F5] border border-[#D9DEE5] px-2 py-0.5 rounded-full">
            Unreviewed
          </span>
        );
    }
  };

  const breadcrumbs = [
    { label: 'Trust' },
    { label: 'Evidence & Audit', current: true },
  ];

  return (
    <StateWrapper
      loadingMessage="Loading evidence records..."
      emptyTitle="No physical evidence found in this view"
      emptyDescription="Time-stamped photos, inspection logs, and calibration certificates linked to activities will appear here. Upload evidence files or adjust your filter selection."
    >
      <div className="space-y-6 pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            HEADER: Evidence & Audit
            Core Goal: Make every important project update traceable to evidence.
            Final Rule: Evidence should answer: "Why should I trust this update?"
            Technical details moved to collapsible sections to prevent clutter.
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]/60">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Trust & Compliance
                </span>

                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded text-[11px] font-medium bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                  <CheckCircle2 className="w-3 h-3 text-[#2E7D5B]" />
                  Verification Gate Active
                </span>

                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded text-[11px] text-[#596579] bg-[#F7F8FA] border border-[#D9DEE5]">
                  {activeProject?.code || 'OIL-DUL-01'} · V3 · Rev 3.2
                </span>
              </div>

              <h1 className="text-[28px] sm:text-3xl font-bold text-[#172033] tracking-tight">
                Evidence & Audit
              </h1>
              <p className="text-sm text-[#596579] mt-1 max-w-3xl">
                Make every important project update traceable to verified field proof, ensuring human verification and auditability across all progress reports.
              </p>
            </div>

            {/* Core Metrics */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-xs">
                <span className="text-[10px] text-[#596579] uppercase font-semibold block">Evidence Coverage</span>
                <span className="font-mono font-bold text-[#176B87] text-sm">91.4% Verified</span>
              </div>
              <div className="px-4 py-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-xs">
                <span className="text-[10px] text-[#596579] uppercase font-semibold block">Audit Records</span>
                <span className="font-mono font-bold text-[#2E7D5B] text-sm">{COMPREHENSIVE_AUDIT_LOGS.length} Logged</span>
              </div>
            </div>
          </div>

          {/* FINAL RULE BANNER: "Why should I trust this update?" */}
          <div className="pt-4">
            <div className="p-4 bg-[#EDF5F8] border border-[#B3CBE0] rounded-lg flex items-start gap-3 text-xs">
              <Shield className="w-5 h-5 text-[#176B87] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="font-semibold text-[#172033] uppercase tracking-wider text-[11px]">
                  Core Principle: &ldquo;Why should I trust this update?&rdquo;
                </h4>
                <p className="text-[#172033] leading-relaxed">
                  Every progress figure, schedule date change, and critical path variance in PLnEX is grounded in verifiable physical evidence—such as Daily Progress Reports, geolocated site photographs, and lab test certificates—signed off through human verification.
                </p>
              </div>
            </div>
          </div>

          {/* =====================================================================
              PRIMARY NAVIGATION TABS: Evidence | Audit History | Verification History
              ===================================================================== */}
          <div className="flex items-center justify-between pt-4 flex-wrap gap-3">
            <div className="flex items-center bg-[#F1F3F5] p-1 rounded-lg border border-[#D9DEE5] flex-wrap gap-1">
              {/* Tab 1: Evidence */}
              <button
                type="button"
                onClick={() => setActiveTab('evidence')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'evidence'
                    ? 'bg-white text-[#176B87] shadow-xs'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Evidence</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                    activeTab === 'evidence'
                      ? 'bg-[#EDF5F8] text-[#176B87]'
                      : 'bg-[#D9DEE5] text-[#596579]'
                  }`}
                >
                  {COMPREHENSIVE_EVIDENCE_ITEMS.length}
                </span>
              </button>

              {/* Tab 2: Audit History */}
              <button
                type="button"
                onClick={() => setActiveTab('audit_history')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'audit_history'
                    ? 'bg-white text-[#176B87] shadow-xs'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Audit History</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                    activeTab === 'audit_history'
                      ? 'bg-[#EDF5F8] text-[#176B87]'
                      : 'bg-[#D9DEE5] text-[#596579]'
                  }`}
                >
                  {COMPREHENSIVE_AUDIT_LOGS.length}
                </span>
              </button>

              {/* Tab 3: Verification History */}
              <button
                type="button"
                onClick={() => setActiveTab('verification_history')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'verification_history'
                    ? 'bg-white text-[#176B87] shadow-xs'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verification History</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                    activeTab === 'verification_history'
                      ? 'bg-[#EDF5F8] text-[#176B87]'
                      : 'bg-[#D9DEE5] text-[#596579]'
                  }`}
                >
                  {verifiedCount}
                </span>
              </button>
            </div>

            <div className="text-xs text-[#596579] font-mono flex items-center gap-2">
              <span>Verified Reporting Cutoff:</span>
              <strong className="text-[#172033]">18 Sep 2026</strong>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MANDATORY VISUAL EVIDENCE CHAIN (THE 7-STAGE PIPELINE)
            Field Report
            ↓
            Execution Event
            ↓
            Schedule Activity
            ↓
            Verification
            ↓
            Progress
            ↓
            Variance
            ↓
            Impact
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D9DEE5]/60 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#176B87]" />
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Visual Evidence Relationship Pipeline
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#596579]">
              Traceability Pipeline: Field Proof → Schedule Impact
            </span>
          </div>

          <p className="text-xs text-[#596579]">
            How physical onsite proof flows through PLnEX to update authoritative schedule progress, baseline variances, and project forecasts:
          </p>

          {/* 7-STAGE CONNECTED EVIDENCE CHAIN PIPELINE STRIP */}
          <div className="border border-[#D9DEE5] rounded-md bg-white overflow-hidden grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-[#D9DEE5] pt-1">
            {/* 1. Field Report */}
            <div className="p-3 bg-[#EDF5F8]/40 flex flex-col justify-between text-xs space-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-medium text-[#176B87] uppercase">Stage 1</span>
                  <span className="text-[9px] font-semibold uppercase bg-white/80 text-[#176B87] px-1.5 py-0.5 rounded border border-[#B3CBE0]">Evidence</span>
                </div>
                <div className="font-medium text-[#172033] text-xs mt-1 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#176B87]" />
                  <span>Field Report</span>
                </div>
              </div>
              <div className="text-[10px] text-[#596579] pt-2 border-t border-[#D9DEE5]/60">
                DPR-014, Site Photos, Lab QC Slips
              </div>
            </div>

            {/* 2. Execution Event */}
            <div className="p-3 flex flex-col justify-between text-xs space-y-2">
              <div>
                <span className="text-[10px] font-mono font-semibold text-[#596579] uppercase block">Stage 2</span>
                <div className="font-medium text-[#172033] text-xs mt-1 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#176B87]" />
                  <span>Execution Event</span>
                </div>
              </div>
              <div className="text-[10px] text-[#596579] pt-2 border-t border-[#D9DEE5]/60 font-mono">
                EVT-2026-001 (12 Spools Erected)
              </div>
            </div>

            {/* 3. Schedule Activity */}
            <div className="p-3 flex flex-col justify-between text-xs space-y-2">
              <div>
                <span className="text-[10px] font-mono font-semibold text-[#596579] uppercase block">Stage 3</span>
                <div className="font-medium text-[#172033] text-xs mt-1 flex items-center gap-2">
                  <FolderKanban className="w-3.5 h-3.5 text-[#596579]" />
                  <span>Schedule Activity</span>
                </div>
              </div>
              <div className="text-[10px] text-[#596579] pt-2 border-t border-[#D9DEE5]/60 font-mono">
                PIP-24-001 (Activity WBS 3.2.1)
              </div>
            </div>

            {/* 4. Verification */}
            <div className="p-3 bg-[#EDF7F2]/40 flex flex-col justify-between text-xs space-y-2">
              <div>
                <span className="text-[10px] font-mono font-medium text-[#2E7D5B] uppercase block">Stage 4</span>
                <div className="font-medium text-[#172033] text-xs mt-1 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D5B]" />
                  <span>Verification</span>
                </div>
              </div>
              <div className="text-[10px] text-[#2E7D5B] pt-2 border-t border-[#D9DEE5]/60 font-medium">
                Human QC Engineer Sign-Off
              </div>
            </div>

            {/* 5. Progress */}
            <div className="p-3 bg-[#EDF7F2]/40 flex flex-col justify-between text-xs space-y-2">
              <div>
                <span className="text-[10px] font-mono font-medium text-[#2E7D5B] uppercase block">Stage 5</span>
                <div className="font-medium text-[#172033] text-xs mt-1 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5B]" />
                  <span>Progress Update</span>
                </div>
              </div>
              <div className="text-[10px] text-[#2E7D5B] pt-2 border-t border-[#D9DEE5]/60 font-mono font-medium">
                Progress Update: 53% → 65%
              </div>
            </div>

            {/* 6. Variance */}
            <div className="p-3 bg-[#FDF6ED]/40 flex flex-col justify-between text-xs space-y-2">
              <div>
                <span className="text-[10px] font-mono font-medium text-[#D98B32] uppercase block">Stage 6</span>
                <div className="font-medium text-[#172033] text-xs mt-1 flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#D98B32]" />
                  <span>Variance</span>
                </div>
              </div>
              <div className="text-[10px] text-[#D98B32] pt-2 border-t border-[#D9DEE5]/60 font-mono font-medium">
                -7% Slip Cleared
              </div>
            </div>

            {/* 7. Impact */}
            <div className="p-3 bg-[#FBEFEE]/40 flex flex-col justify-between text-xs space-y-2">
              <div>
                <span className="text-[10px] font-mono font-medium text-[#B5473C] uppercase block">Stage 7</span>
                <div className="font-medium text-[#172033] text-xs mt-1 flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-[#B5473C]" />
                  <span>Impact</span>
                </div>
              </div>
              <div className="text-[10px] text-[#B5473C] pt-2 border-t border-[#D9DEE5]/60 font-medium">
                Protects Milestone COD Handover
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: EVIDENCE VAULT
            Shows important information first:
            Evidence proof visually connected to the Execution Event & Activity it supports.
            Technical audit metadata (SHA-256, storage keys) is expandable.
            ========================================================================= */}
        {activeTab === 'evidence' && (
          <div className="space-y-6">
            {/* EVIDENCE CONTROLS & FILTERS BAR */}
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                {/* 1. Type Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-[#596579]">Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-hidden focus:border-[#176B87]"
                  >
                    <option value="ALL">All Types</option>
                    <option value="DPR">DPR (Reports)</option>
                    <option value="Photo">Photos</option>
                    <option value="Document">Documents / QC</option>
                    <option value="Spreadsheet">Spreadsheets</option>
                    <option value="Field Note">Field Notes</option>
                  </select>
                </div>

                {/* 2. Activity Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-[#596579]">Activity</label>
                  <select
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-mono outline-hidden focus:border-[#176B87]"
                  >
                    <option value="ALL">All Activities</option>
                    <option value="PIP-24-001">PIP-24-001 (Erect Header)</option>
                    <option value="PIP-24-002">PIP-24-002 (Weld Joints)</option>
                    <option value="PIP-24-003">PIP-24-003 (Hydrotest)</option>
                    <option value="CIV-11-001">CIV-11-001 (Foundation)</option>
                  </select>
                </div>

                {/* 3. Execution Event Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-[#596579]">Execution Event</label>
                  <select
                    value={selectedExecutionEvent}
                    onChange={(e) => setSelectedExecutionEvent(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-mono outline-hidden focus:border-[#176B87]"
                  >
                    <option value="ALL">All Events</option>
                    <option value="EVT-2026-001">EVT-2026-001 (12 Spools)</option>
                    <option value="EVT-2026-002">EVT-2026-002 (8 Welds)</option>
                    <option value="EVT-CIV-001">EVT-CIV-001 (Pedestal Pour)</option>
                  </select>
                </div>

                {/* 4. Uploaded By Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-[#596579]">Uploaded By</label>
                  <select
                    value={selectedUploader}
                    onChange={(e) => setSelectedUploader(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-hidden focus:border-[#176B87]"
                  >
                    <option value="ALL">All Uploaders</option>
                    <option value="Debajit Borah">Debajit Borah (Lead Site Eng)</option>
                    <option value="S. Ramanathan">S. Ramanathan (Civil QC)</option>
                  </select>
                </div>

                {/* 5. Verification Status Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-[#596579]">Verification</label>
                  <select
                    value={selectedVerificationStatus}
                    onChange={(e) => setSelectedVerificationStatus(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-hidden focus:border-[#176B87]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Verified">Verified</option>
                    <option value="Pending QC">Pending QC</option>
                    <option value="Conflict">Conflict</option>
                  </select>
                </div>

                {/* 6. Date Search */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-[#596579]">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-mono outline-hidden focus:border-[#176B87]"
                  />
                </div>
              </div>

              {/* Free Text Search */}
              <div className="pt-2 border-t border-[#D9DEE5]/60 flex items-center justify-between gap-3 flex-wrap">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-[#7B8798] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={evidenceSearch}
                    onChange={(e) => setEvidenceSearch(e.target.value)}
                    placeholder="Search by Evidence ID, title, filename, source, or notes..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-hidden focus:border-[#176B87]"
                  />
                </div>
                <span className="text-xs font-mono text-[#596579]">
                  Showing <strong className="text-[#172033]">{filteredEvidence.length}</strong> of{' '}
                  {COMPREHENSIVE_EVIDENCE_ITEMS.length} evidence items
                </span>
              </div>
            </div>

            {/* =========================================================================
                CANONICAL EVIDENCE TABLE (WITH EXPANDABLE TECHNICAL METADATA)
                Columns specified by requirements:
                - Evidence ID
                - Type
                - Source
                - Activity
                - Execution Event
                - Uploaded By
                - Date
                - Verification
                - Status
                ========================================================================= */}
            <div className="bg-white border border-[#D9DEE5] rounded-lg shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
                    <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] sm:text-xs uppercase font-semibold text-[#596579] tracking-wider h-11">
                      <th className="py-3 px-4">Evidence ID</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 min-w-[160px]">Source</th>
                      <th className="py-3 px-4 min-w-[180px]">Activity</th>
                      <th className="py-3 px-4 min-w-[150px]">Execution Event</th>
                      <th className="py-3 px-4">Uploaded By</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Verification</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9DEE5]/60">
                    {filteredEvidence.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 px-4 text-center text-[#596579]">
                          <FolderKanban className="w-8 h-8 text-[#7B8798] mx-auto mb-2" />
                          <p className="font-semibold text-sm text-[#172033]">No evidence documents match your filters</p>
                          <p className="text-xs text-[#596579] mt-1 max-w-sm mx-auto">
                            No photographic records, inspection tickets, or test certificates match your active filter settings.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEvidenceSearch('');
                              setSelectedType('ALL');
                              setSelectedVerificationStatus('ALL');
                            }}
                            className="mt-3 text-xs font-semibold text-[#176B87] hover:underline cursor-pointer"
                          >
                            Reset All Filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredEvidence.map((item) => {
                      const typeBadge = getEvidenceTypeBadge(item.type);
                      const TypeIcon = typeBadge.icon;
                      const isMetaExpanded = !!expandedMetadataIds[item.id];

                      return (
                        <React.Fragment key={item.id}>
                          <tr
                            className="h-11 sm:h-12 hover:bg-[#F1F3F5]/60 transition-colors cursor-pointer group"
                            onClick={() => setPreviewEvidence(item)}
                          >
                            {/* 1. Evidence ID */}
                            <td className="py-3 px-4 font-mono font-bold text-[#176B87]">
                              <span className="px-2 py-0.5 rounded bg-[#EDF5F8] border border-[#B3CBE0]">
                                {item.id}
                              </span>
                            </td>

                            {/* 2. Type */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold uppercase border ${typeBadge.bg} ${typeBadge.border} ${typeBadge.text}`}
                              >
                                <TypeIcon className="w-3 h-3" />
                                <span>{typeBadge.label}</span>
                              </span>
                            </td>

                            {/* 3. Source */}
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-semibold text-[#172033] truncate">{item.title}</div>
                              <div className="text-[11px] text-[#596579] font-mono mt-0.5 truncate">
                                {item.source || item.filename}
                              </div>
                            </td>

                            {/* 4. Activity (Visually Connected) */}
                            <td className="py-3 px-4">
                              {item.activityId ? (
                                <div className="p-2 rounded bg-[#F7F8FA] border border-[#D9DEE5] space-y-0.5">
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
                                  <p className="text-[11px] text-[#596579] truncate max-w-[160px]">
                                    {item.activityName}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-[#7B8798] italic font-mono text-[11px]">Unlinked</span>
                              )}
                            </td>

                            {/* 5. Execution Event (Visually Connected) */}
                            <td className="py-3 px-4">
                              {item.executionEventId ? (
                                <div className="p-2 rounded bg-[#EDF5F8] border border-[#B3CBE0] space-y-0.5">
                                  <span className="font-mono text-xs font-bold text-[#176B87] block">
                                    {item.executionEventId}
                                  </span>
                                  <span className="text-[11px] text-[#596579] truncate block max-w-[130px]">
                                    {item.extractedData?.quantity} {item.extractedData?.unit}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[#7B8798] text-[11px] font-mono">None</span>
                              )}
                            </td>

                            {/* 6. Uploaded By */}
                            <td className="py-3 px-4">
                              <div className="font-medium text-[#172033]">{item.uploader}</div>
                              <div className="text-[11px] text-[#7B8798]">{item.uploaderRole}</div>
                            </td>

                            {/* 7. Date */}
                            <td className="py-3 px-4 font-mono text-[#596579] whitespace-nowrap">
                              {item.timestamp.split(' ')[0]}
                            </td>

                            {/* 8. Verification */}
                            <td className="py-3 px-4">
                              {item.verificationBy ? (
                                <div className="text-[11px]">
                                  <span className="font-semibold text-[#2E7D5B] block">Signed Off</span>
                                  <span className="text-[#596579] truncate max-w-[120px] block">
                                    {item.verificationBy.split(' ')[0]}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#D98B32]">Pending QC</span>
                              )}
                            </td>

                            {/* 9. Status */}
                            <td className="py-3 px-4">{getStatusBadge(item.status)}</td>

                            {/* Actions & Expandable Technical Metadata Toggle */}
                            <td className="py-3 px-4 text-right">
                              <div
                                className="flex items-center justify-end gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleExpandMetadata(item.id)}
                                  className="px-2 py-1 rounded border border-[#D9DEE5] hover:bg-[#F1F3F5] text-[#596579] text-[11px] font-medium transition-colors flex items-center gap-1"
                                  title="Expand/Collapse Technical Metadata"
                                >
                                  <span>Details</span>
                                  {isMetaExpanded ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setPreviewEvidence(item)}
                                  className="px-3 py-1 rounded-lg border border-[#B3CBE0] bg-white hover:bg-[#EDF5F8] text-[#176B87] font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                                  title="Open Preview Modal"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Preview</span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDABLE TECHNICAL METADATA ROW */}
                          {isMetaExpanded && (
                            <tr className="bg-[#F7F8FA]/80 border-b border-[#D9DEE5]">
                              <td colSpan={10} className="p-4">
                                <div className="p-3 bg-white rounded-lg border border-[#D9DEE5] space-y-2 text-xs">
                                  <div className="flex items-center justify-between border-b border-[#D9DEE5]/60 pb-2">
                                    <span className="font-bold uppercase tracking-wider text-[10px] text-[#176B87] flex items-center gap-2">
                                      <Lock className="w-3.5 h-3.5 text-[#176B87]" />
                                      Technical Audit Metadata & Cryptographic Integrity
                                    </span>
                                    <span className="text-[10px] font-mono text-[#596579]">
                                      Append-Only Immutable Ledger Record
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                                    <div className="space-y-0.5">
                                      <span className="text-[10px] uppercase text-[#596579] font-semibold block">
                                        SHA-256 Digest
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[#172033] truncate max-w-[200px]" title={item.sha256Hash}>
                                          {item.sha256Hash}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyHash(item.sha256Hash || '')}
                                          className="p-1 hover:bg-[#F1F3F5] rounded text-[#596579] hover:text-[#172033]"
                                          title="Copy Hash"
                                        >
                                          {copiedHash === item.sha256Hash ? (
                                            <Check className="w-3 h-3 text-[#2E7D5B]" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    <div className="space-y-0.5">
                                      <span className="text-[10px] uppercase text-[#596579] font-semibold block">
                                        GPS Geolocation
                                      </span>
                                      <span className="text-[#172033] flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-[#176B87]" />
                                        {item.gpsCoords}
                                      </span>
                                    </div>

                                    <div className="space-y-0.5">
                                      <span className="text-[10px] uppercase text-[#596579] font-semibold block">
                                        File Size & Storage
                                      </span>
                                      <span className="text-[#172033]">
                                        {item.fileSize} · Bit-for-bit Authenticated
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: AUDIT HISTORY
            Shows:
            - Who
            - What
            - When
            - Before
            - After
            - Reason
            Examples:
            Progress changed: 53 → 65
            Changed by: User
            Reason: Verified execution event
            ========================================================================= */}
        {activeTab === 'audit_history' && (
          <div className="space-y-6">
            {/* AUDIT SPOTLIGHT CANONICAL CARD */}
            <div className="p-4 rounded-lg bg-[#EDF7F2] border border-[#B8DCC9] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#B8DCC9]/60 flex-wrap gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D5B] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Canonical Audit Progression Pattern
                </span>
                <span className="text-[11px] font-mono text-[#596579]">
                  Traceable to Verified Execution Event
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white border border-[#B8DCC9]">
                  <span className="text-[10px] uppercase font-semibold text-[#596579] block mb-0.5">
                    What Changed
                  </span>
                  <div className="font-bold text-sm text-[#172033]">
                    Progress changed:
                  </div>
                  <div className="text-base font-bold font-mono text-[#2E7D5B] mt-0.5">
                    53% → 65%
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#B8DCC9]">
                  <span className="text-[10px] uppercase font-semibold text-[#596579] block mb-0.5">
                    Who (Changed by)
                  </span>
                  <div className="font-bold text-sm text-[#172033]">
                    User: Debajit Borah
                  </div>
                  <div className="text-[11px] text-[#596579] mt-0.5">
                    Lead Site Execution Engineer
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#B8DCC9]">
                  <span className="text-[10px] uppercase font-semibold text-[#596579] block mb-0.5">
                    Reason
                  </span>
                  <div className="font-bold text-xs text-[#172033]">
                    Verified execution event
                  </div>
                  <div className="text-[11px] text-[#596579] font-mono mt-0.5">
                    EVT-2026-002 bound to DPR-014 & EVD-006
                  </div>
                </div>
              </div>
            </div>

            {/* AUDIT ACTIONS FILTER & CONTROLS */}
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
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

              {/* Action Category Filter Chips */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase text-[#596579]">
                  Filter by Action Category
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    'ALL',
                    'Progress Modification',
                    'Approval',
                    'DPR Upload',
                    'Evidence Upload',
                    'Schedule Import',
                    'AI Match',
                    'Rejection',
                    'Permission Changes',
                  ].map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setAuditActionFilter(act)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        auditActionFilter === act
                          ? 'bg-[#176B87] text-white shadow-xs'
                          : 'bg-white border border-[#D9DEE5] text-[#596579] hover:bg-[#F1F3F5]'
                      }`}
                    >
                      {act === 'ALL' ? 'All Actions' : act}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar & Actor Filter */}
              <div className="pt-2 border-t border-[#D9DEE5]/60 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-1 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-[#7B8798] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder="Search who, what changed, or reason..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-hidden focus:border-[#176B87]"
                    />
                  </div>

                  <select
                    value={auditActorFilter}
                    onChange={(e) => setAuditActorFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-hidden focus:border-[#176B87]"
                  >
                    <option value="ALL">All Actors</option>
                    <option value="manager">Managers</option>
                    <option value="engineer">Site Engineers</option>
                    <option value="SYSTEM">System Match Engine</option>
                  </select>
                </div>

                <span className="text-xs font-mono text-[#596579]">
                  Showing <strong className="text-[#172033]">{filteredAuditLogs.length}</strong> records
                </span>
              </div>
            </div>

            {/* AUDIT TABLE: Who | What | When | Before | After | Reason */}
            <div className="bg-white border border-[#D9DEE5] rounded-lg shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
                    <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] sm:text-xs uppercase font-semibold text-[#596579] tracking-wider h-11">
                      <th className="py-3 px-4">Audit ID</th>
                      <th className="py-3 px-4 min-w-[140px]">Who (Changed by)</th>
                      <th className="py-3 px-4 min-w-[180px]">What (Action)</th>
                      <th className="py-3 px-4">When (Timestamp)</th>
                      <th className="py-3 px-4">Before</th>
                      <th className="py-3 px-4">After</th>
                      <th className="py-3 px-4 min-w-[160px]">Reason</th>
                      <th className="py-3 px-4 min-w-[200px]">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9DEE5]/60">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 px-4 text-center text-[#596579]">
                          <Clock className="w-8 h-8 text-[#7B8798] mx-auto mb-2" />
                          <p className="font-semibold text-sm text-[#172033]">No audit log entries found</p>
                          <p className="text-xs text-[#596579] mt-1 max-w-sm mx-auto">
                            No tamper-evident baseline modifications match the current search or filter parameters.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setAuditSearch('');
                              setAuditActionFilter('ALL');
                              setAuditActorFilter('ALL');
                            }}
                            className="mt-3 text-xs font-semibold text-[#176B87] hover:underline cursor-pointer"
                          >
                            Reset All Filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedAuditEntry(log)}
                        className="h-11 sm:h-12 hover:bg-[#F1F3F5]/60 transition-colors cursor-pointer group"
                      >
                        {/* Audit ID */}
                        <td className="py-3 px-4 font-mono font-bold text-[#176B87]">
                          <span className="px-2 py-0.5 rounded bg-[#EDF5F8] border border-[#B3CBE0]">
                            {log.id}
                          </span>
                        </td>

                        {/* Who */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#172033]">{log.actor}</div>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase mt-0.5 ${
                              log.role === 'SYSTEM'
                                ? 'bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5]'
                                : log.role === 'manager'
                                ? 'bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]'
                                : 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                            }`}
                          >
                            {log.role}
                          </span>
                        </td>

                        {/* What */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#172033]">{log.whatChanged || log.action}</div>
                          <div className="text-[11px] text-[#596579] font-mono mt-0.5">
                            {log.objectTitle}
                          </div>
                        </td>

                        {/* When */}
                        <td className="py-3 px-4 font-mono text-[#596579] whitespace-nowrap">
                          {log.timestamp}
                        </td>

                        {/* Before */}
                        <td className="py-3 px-4 max-w-[140px]">
                          <div className="p-2 rounded bg-[#FBEFEE]/60 border border-[#E4B0AA] text-[11px] font-mono text-[#B5473C] font-semibold truncate">
                            {log.before || log.previousValue || 'N/A'}
                          </div>
                        </td>

                        {/* After */}
                        <td className="py-3 px-4 max-w-[140px]">
                          <div className="p-2 rounded bg-[#EDF7F2]/80 border border-[#B8DCC9] text-[11px] font-mono text-[#2E7D5B] font-bold truncate">
                            {log.after || log.newValue || 'N/A'}
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="py-3 px-4 text-[#172033]">
                          <p className="text-[11px] font-medium leading-relaxed">
                            {log.reason || 'Verified execution event'}
                          </p>
                        </td>

                        {/* Details */}
                        <td className="py-3 px-4 text-[#596579]">
                          <p className="text-[11px] line-clamp-2 leading-relaxed">
                            {log.details}
                          </p>
                        </td>
                      </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: VERIFICATION HISTORY
            Dedicated view of all human QC sign-offs, verification decisions, and QA gates.
            ========================================================================= */}
        {activeTab === 'verification_history' && (
          <div className="space-y-6">
            {/* VERIFICATION SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border-2 border-[#B8DCC9] rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-semibold text-[#2E7D5B] tracking-wider">
                    Verified Sign-Offs
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />
                </div>
                <div className="text-[28px] font-bold font-mono text-[#2E7D5B] leading-none">
                  {verifiedCount} Items
                </div>
                <span className="text-xs text-[#596579] mt-1 block">
                  Signed off by human engineering authority
                </span>
              </div>

              <div className="bg-white border-2 border-[#F0D4A6] rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-semibold text-[#D98B32] tracking-wider">
                    Pending QC Review
                  </span>
                  <Clock className="w-4 h-4 text-[#D98B32]" />
                </div>
                <div className="text-[28px] font-bold font-mono text-[#D98B32] leading-none">
                  {pendingCount} Items
                </div>
                <span className="text-xs text-[#596579] mt-1 block">
                  Awaiting project controls inspection sign-off
                </span>
              </div>

              <div className="bg-white border-2 border-[#E4B0AA] rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-semibold text-[#B5473C] tracking-wider">
                    Disputed / Conflicts
                  </span>
                  <AlertTriangle className="w-4 h-4 text-[#B5473C]" />
                </div>
                <div className="text-[28px] font-bold font-mono text-[#B5473C] leading-none">
                  {conflictCount} Items
                </div>
                <span className="text-xs text-[#596579] mt-1 block">
                  Discrepancy flagged between field & schedule
                </span>
              </div>
            </div>

            {/* VERIFICATION FILTERS */}
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#176B87]" />
                  <h3 className="text-xs font-semibold text-[#172033] uppercase tracking-wider">
                    Verification History Filters
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleResetVerificationFilters}
                  className="text-xs text-[#596579] hover:text-[#172033] flex items-center gap-1 font-medium transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase text-[#596579]">Status:</span>
                  {['ALL', 'Verified', 'Pending QC', 'Conflict'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setVerificationStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        verificationStatusFilter === st
                          ? 'bg-[#176B87] text-white shadow-xs'
                          : 'bg-white border border-[#D9DEE5] text-[#596579] hover:bg-[#F1F3F5]'
                      }`}
                    >
                      {st === 'ALL' ? 'All Decisions' : st}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 max-w-md ml-auto">
                  <Search className="w-3.5 h-3.5 text-[#7B8798] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={verificationSearch}
                    onChange={(e) => setVerificationSearch(e.target.value)}
                    placeholder="Search verifier, activity, or execution event..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-hidden focus:border-[#176B87]"
                  />
                </div>
              </div>
            </div>

            {/* VERIFICATION DECISIONS TABLE */}
            <div className="bg-white border border-[#D9DEE5] rounded-lg shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
                    <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] sm:text-xs uppercase font-semibold text-[#596579] tracking-wider h-11">
                      <th className="py-3 px-4">Evidence Artifact</th>
                      <th className="py-3 px-4">Decision Status</th>
                      <th className="py-3 px-4 min-w-[160px]">Verified By</th>
                      <th className="py-3 px-4">Verification Date</th>
                      <th className="py-3 px-4 min-w-[180px]">Linked Activity</th>
                      <th className="py-3 px-4">Execution Event</th>
                      <th className="py-3 px-4 min-w-[200px]">Verification Notes</th>
                      <th className="py-3 px-4 text-right">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9DEE5]/60">
                    {filteredVerificationHistory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 px-4 text-center text-[#596579]">
                          <CheckCircle2 className="w-8 h-8 text-[#2E7D5B] mx-auto mb-2" />
                          <p className="font-semibold text-sm text-[#172033]">No verification records found</p>
                          <p className="text-xs text-[#596579] mt-1 max-w-sm mx-auto">
                            No human engineering sign-offs match your active search or verification filter.
                          </p>
                          <button
                            type="button"
                            onClick={() => setVerificationSearch('')}
                            className="mt-3 text-xs font-semibold text-[#176B87] hover:underline cursor-pointer"
                          >
                            Clear Search Query
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredVerificationHistory.map((item) => (
                      <tr
                        key={item.id}
                        className="h-11 sm:h-12 hover:bg-[#F1F3F5]/60 transition-colors cursor-pointer group"
                        onClick={() => setPreviewEvidence(item)}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#172033]">{item.title}</div>
                          <span className="font-mono text-[11px] text-[#176B87]">{item.id} · {item.type}</span>
                        </td>

                        <td className="py-3 px-4">
                          {getStatusBadge(item.status)}
                        </td>

                        <td className="py-3 px-4">
                          {item.verificationBy ? (
                            <div>
                              <div className="font-bold text-[#172033]">{item.verificationBy}</div>
                              <span className="text-[10px] text-[#7B8798]">Sign-Off Authority</span>
                            </div>
                          ) : (
                            <span className="text-[#D98B32] italic text-[11px]">Awaiting Sign-Off</span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono text-[#596579]">
                          {item.verificationTimestamp || 'Pending'}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#176B87] block">{item.activityId}</span>
                          <span className="text-[11px] text-[#596579] truncate block max-w-[160px]">{item.activityName}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-semibold text-[#172033] px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#D9DEE5]">
                            {item.executionEventId || 'None'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[#596579]">
                          <p className="text-[11px] line-clamp-2 leading-relaxed">
                            {item.notes}
                          </p>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewEvidence(item);
                            }}
                            className="px-3 py-1 rounded-lg border border-[#B3CBE0] bg-white hover:bg-[#EDF5F8] text-[#176B87] font-bold text-xs transition-colors shadow-2xs"
                          >
                            Inspect &rarr;
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            AUDIT INTEGRITY & TECHNICAL DETAILS (COLLAPSIBLE SECTION)
            Rule: Do not make SHA-256, Append-only, Immutable ledger, Digest the main UI.
            Place them under: Audit Integrity / Technical Details.
            ========================================================================= */}
        <details className="group bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg overflow-hidden transition-all">
          <summary className="p-4 flex items-center justify-between cursor-pointer font-bold text-xs uppercase tracking-wider text-[#176B87] hover:bg-[#F1F3F5] transition-colors">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#176B87]" />
              <span>Audit Integrity & Technical Details</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#596579] font-normal">
              <span className="hidden sm:inline">Cryptographic Verification & Append-Only Ledger Proof</span>
              <ChevronDown className="w-4 h-4 text-[#596579] transition-transform group-open:rotate-180" />
            </div>
          </summary>

          <div className="p-4 sm:p-6 border-t border-[#D9DEE5] bg-white space-y-4 text-xs text-[#596579]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Audit Integrity */}
              <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-[#172033] uppercase">
                  <Database className="w-4 h-4 text-[#176B87]" />
                  <span>Audit Integrity</span>
                </div>
                <p className="leading-relaxed">
                  All schedule progress changes, evidence associations, and verifications are preserved in an append-only, non-destructive ledger. Previous values are never overwritten or deleted, ensuring full historical traceability for forensic delay analysis and claim defense.
                </p>
                <div className="pt-2 border-t border-[#D9DEE5] flex items-center justify-between text-[11px] font-mono text-[#176B87]">
                  <span>Ledger State: Append-Only</span>
                  <span>Zero Silent Overwrites</span>
                </div>
              </div>

              {/* 2. Technical Details */}
              <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-[#172033] uppercase">
                  <Lock className="w-4 h-4 text-[#176B87]" />
                  <span>Technical Details & Checksums</span>
                </div>
                <p className="leading-relaxed">
                  Every uploaded photograph, DPR scan, and test certificate is registered with a SHA-256 cryptographic digest at the time of ingestion. This prevents file tampering and certifies that evidence reviewed today is bit-for-bit identical to the field artifact captured on site.
                </p>
                <div className="pt-2 border-t border-[#D9DEE5] flex items-center justify-between text-[11px] font-mono text-[#596579]">
                  <span>Digest: SHA-256</span>
                  <span>Signature: HMAC-Authenticated</span>
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* =========================================================================
            EVIDENCE PREVIEW MODAL
            Shows:
            - Original Evidence
            - Metadata
            - Extracted Information
            - Linked Execution Event
            - Linked Activity
            - Confidence
            - Verification
            ========================================================================= */}
        <Modal
          isOpen={!!previewEvidence}
          onClose={() => setPreviewEvidence(null)}
          title={`Evidence Preview: ${previewEvidence?.id || ''}`}
          subtitle={previewEvidence?.title}
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-between w-full text-xs">
              <div className="flex items-center gap-2 text-[#596579]">
                <ShieldCheck className="w-4 h-4 text-[#2E7D5B]" />
                <span>Verified Field Evidence Record</span>
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
              {/* LEFT (Cols 1-6): ORIGINAL EVIDENCE & METADATA */}
              <div className="lg:col-span-6 space-y-4">
                {/* 1. ORIGINAL EVIDENCE VIEWER */}
                <div className="bg-[#172033] rounded-lg p-4 text-white space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[11px]">
                    <span className="font-bold text-white uppercase tracking-wider text-[10px]">
                      Original Evidence
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#176B87] text-white">
                      {previewEvidence.type}
                    </span>
                  </div>

                  {previewEvidence.type === 'Photo' ? (
                    <div className="h-64 rounded-lg bg-[#25324B] border border-white/10 flex flex-col justify-between p-3 relative">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-white flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#176B87]" />
                          {previewEvidence.gpsCoords}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-white">
                          {previewEvidence.timestamp}
                        </span>
                      </div>

                      <div className="flex flex-col items-center justify-center my-auto text-center space-y-2">
                        <ImageIcon className="w-12 h-12 text-[#176B87] opacity-80" />
                        <div>
                          <div className="font-bold text-sm text-white">
                            High-Resolution Onsite Inspection Capture
                          </div>
                          <p className="text-[11px] text-[#7B8798]">
                            Line 24 Spool Pieces installed on Piperack Section B
                          </p>
                        </div>
                      </div>

                      <div className="bg-black/70 p-2 rounded text-[10px] font-mono text-[#D9DEE5] flex justify-between">
                        <span>Device: Field Mobile Camera</span>
                        <span>Full Resolution Verified</span>
                      </div>
                    </div>
                  ) : previewEvidence.type === 'DPR' ? (
                    <div className="h-64 rounded-lg bg-white text-[#172033] p-4 border border-white/20 shadow-sm flex flex-col justify-between overflow-y-auto">
                      <div className="border-b border-[#D9DEE5] pb-2 flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-xs uppercase tracking-wider text-[#172033]">
                            Daily Progress Report (DPR-014)
                          </h4>
                          <span className="text-[10px] text-[#596579]">
                            Oil India Limited — Duliajan Unit A
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EDF7F2] text-[#2E7D5B]">
                          Approved
                        </span>
                      </div>

                      <div className="space-y-2 text-[11px] py-2">
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-[#F7F8FA] p-2 rounded">
                          <div>Date: 14 Sep 2026</div>
                          <div>Shift: Day (08:00 - 18:00)</div>
                          <div>Site Lead: Debajit Borah</div>
                          <div>Consortium Lead: BECC Ltd.</div>
                        </div>
                        <p className="text-[#596579] italic text-xs leading-relaxed">
                          &ldquo;Spool erection completed on Line 24. 12 spools erected today with crane support. Work started at 09:00 and finished at 16:30.&rdquo;
                        </p>
                      </div>

                      <div className="border-t border-[#D9DEE5] pt-2 flex justify-between items-center text-[10px] text-[#7B8798]">
                        <span>Signed: Debajit Borah</span>
                        <span>Counter: Contractor QC</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 rounded-lg bg-white text-[#172033] p-4 border border-white/20 flex flex-col justify-center items-center text-center space-y-2">
                      <FileText className="w-10 h-10 text-[#176B87]" />
                      <div className="font-bold text-xs">{previewEvidence.filename}</div>
                      <p className="text-[11px] text-[#596579] max-w-xs">{previewEvidence.notes}</p>
                    </div>
                  )}
                </div>

                {/* 2. METADATA */}
                <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-2">
                  <h4 className="font-bold text-xs text-[#172033] uppercase tracking-wider">
                    Metadata
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#596579] block">Filename</span>
                      <span className="font-mono text-[#172033] break-all">{previewEvidence.filename}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#596579] block">File Size</span>
                      <span className="font-mono text-[#172033]">{previewEvidence.fileSize}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#596579] block">Uploaded By</span>
                      <span className="text-[#172033] font-medium">{previewEvidence.uploader}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#596579] block">Timestamp</span>
                      <span className="font-mono text-[#172033]">{previewEvidence.timestamp}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-semibold text-[#596579] block">GPS Geolocation</span>
                      <span className="font-mono text-[#176B87] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#176B87]" />
                        {previewEvidence.gpsCoords || 'Site Field Office (27.3485° N, 95.3132° E)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT (Cols 7-12): EXTRACTED INFORMATION, LINKED EVENT, LINKED ACTIVITY, CONFIDENCE, VERIFICATION */}
              <div className="lg:col-span-6 space-y-4">
                {/* 3. EXTRACTED INFORMATION */}
                <div className="p-4 rounded-lg bg-white border border-[#D9DEE5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#176B87] tracking-wider">
                      Extracted Information
                    </span>
                    <span className="text-[10px] font-mono text-[#596579]">
                      Automated Field Extraction
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-[#F7F8FA] border border-[#D9DEE5]">
                      <span className="text-[10px] text-[#596579] uppercase block">Work Type</span>
                      <span className="font-semibold text-[#172033]">
                        {previewEvidence.extractedData?.workType || 'Erection'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#F7F8FA] border border-[#D9DEE5]">
                      <span className="text-[10px] text-[#596579] uppercase block">Quantity & Unit</span>
                      <span className="font-mono font-bold text-[#176B87]">
                        {previewEvidence.extractedData?.quantity}{' '}
                        {previewEvidence.extractedData?.unit}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#F7F8FA] border border-[#D9DEE5]">
                      <span className="text-[10px] text-[#596579] uppercase block">Line Identifier</span>
                      <span className="font-mono text-[#172033]">
                        {previewEvidence.extractedData?.line || 'Line 24-XX'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#F7F8FA] border border-[#D9DEE5]">
                      <span className="text-[10px] text-[#596579] uppercase block">Area Location</span>
                      <span className="text-[#172033]">
                        {previewEvidence.extractedData?.area || 'Unit A'}
                      </span>
                    </div>
                  </div>

                  {previewEvidence.extractedData?.rawSnippet && (
                    <div className="p-2 bg-[#F7F8FA] rounded text-[11px] text-[#596579] italic border border-[#D9DEE5]">
                      &ldquo;{previewEvidence.extractedData.rawSnippet}&rdquo;
                    </div>
                  )}
                </div>

                {/* 4. LINKED EXECUTION EVENT */}
                <div className="p-4 rounded-lg bg-white border border-[#D9DEE5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-[#596579] tracking-wider">
                      Linked Execution Event
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#176B87] px-2 py-0.5 rounded bg-[#EDF5F8] border border-[#B3CBE0]">
                      {previewEvidence.executionEventId || 'EVT-2026-001'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#172033] font-medium">
                    {previewEvidence.notes || '12 spools erected today on piperack section B with 75T mobile crane.'}
                  </p>
                </div>

                {/* 5. LINKED ACTIVITY */}
                <div className="p-4 rounded-lg bg-[#EDF5F8] border border-[#B3CBE0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#176B87] tracking-wider">
                      Linked Activity
                    </span>
                    <span className="font-mono text-xs font-bold text-[#176B87]">
                      {previewEvidence.activityId}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-[#172033]">{previewEvidence.activityName}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-[#596579]">
                    <span>WBS 3.2.1</span>
                    <span>•</span>
                    <span>Piping</span>
                    <span>•</span>
                    <span className="text-[#2E7D5B] font-semibold">Critical Path</span>
                  </div>
                </div>

                {/* 6. CONFIDENCE */}
                <div className="p-4 rounded-lg bg-white border border-[#D9DEE5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-[#596579] tracking-wider">
                      Confidence
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                      {previewEvidence.extractedData?.confidence || 94}% High Confidence
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-[#596579]">
                    <div className="flex justify-between">
                      <span>Line Identifier Match (Line 24-XX)</span>
                      <span className="font-mono text-[#2E7D5B] font-bold">✓ 35/35 pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discipline Match (Piping)</span>
                      <span className="font-mono text-[#2E7D5B] font-bold">✓ 25/25 pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Work Verb Match (Erection)</span>
                      <span className="font-mono text-[#2E7D5B] font-bold">✓ 20/20 pts</span>
                    </div>
                  </div>
                </div>

                {/* 7. VERIFICATION */}
                <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-[#596579] tracking-wider">
                      Verification
                    </span>
                    {getStatusBadge(previewEvidence.status)}
                  </div>
                  <div className="text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#7B8798]">Verifier:</span>
                      <span className="font-semibold text-[#172033]">
                        {previewEvidence.verificationBy || 'Pending QC Sign-Off'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7B8798]">Verification Date:</span>
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
            AUDIT ENTRY DETAIL DRAWER
            ========================================================================= */}
        <Drawer
          isOpen={!!selectedAuditEntry}
          onClose={() => setSelectedAuditEntry(null)}
          title={`Audit Record: ${selectedAuditEntry?.id || ''}`}
          subtitle={selectedAuditEntry?.objectTitle}
          width="md"
        >
          {selectedAuditEntry && (
            <div className="space-y-6 text-xs p-1">
              <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-2">
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
              <div className="p-4 rounded-lg bg-white border border-[#D9DEE5] space-y-2 text-xs">
                <span className="text-[10px] uppercase font-semibold text-[#596579] tracking-wider block">
                  Who (Changed by) & When
                </span>
                <div className="flex justify-between">
                  <span className="text-[#7B8798]">Changed By:</span>
                  <span className="font-semibold text-[#172033]">{selectedAuditEntry.actor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7B8798]">Role:</span>
                  <span className="font-mono uppercase text-[#176B87]">{selectedAuditEntry.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7B8798]">When:</span>
                  <span className="font-mono text-[#172033]">{selectedAuditEntry.timestamp}</span>
                </div>
              </div>

              {/* Before vs After */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-semibold text-[#596579] tracking-wider block">
                  State Change (Before → After)
                </span>
                <div className="p-3 rounded-lg bg-[#FBEFEE]/60 border border-[#E4B0AA] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#B5473C] block">
                    Before
                  </span>
                  <div className="font-mono text-xs text-[#172033]">
                    {selectedAuditEntry.before || selectedAuditEntry.previousValue || 'N/A'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#EDF7F2]/80 border border-[#B8DCC9] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#2E7D5B] block">
                    After
                  </span>
                  <div className="font-mono text-xs font-bold text-[#172033]">
                    {selectedAuditEntry.after || selectedAuditEntry.newValue || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="p-4 rounded-lg bg-[#EDF5F8] border border-[#B3CBE0] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#176B87] tracking-wider block">
                  Reason for Change
                </span>
                <p className="text-[#172033] font-semibold text-xs">
                  {selectedAuditEntry.reason || 'Verified execution event'}
                </p>
              </div>

              {/* Details & Rationale */}
              <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-2">
                <span className="text-[10px] uppercase font-semibold text-[#596579] tracking-wider block">
                  Engineering Context & Details
                </span>
                <p className="text-[#172033] leading-relaxed text-xs">{selectedAuditEntry.details}</p>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </StateWrapper>
  );
}
