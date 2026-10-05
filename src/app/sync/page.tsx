'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useOffline } from '../../context/OfflineContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { Modal } from '../../components/shared/Modal';
import { Drawer } from '../../components/shared/Drawer';
import {
  INITIAL_SYNC_QUEUE_ITEMS,
  ConnectionStatus,
  SyncItemType,
  SyncItemStatus,
  SyncQueueItem,
} from '../../lib/domain/syncEngine';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  FileCheck,
  Eye,
  RotateCcw,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  Lock,
  ArrowRight,
  Database,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  Zap,
  HelpCircle,
  HardHat,
  Sliders,
  Sparkles,
  ServerCrash,
} from 'lucide-react';

export default function OfflineSyncCenterPage() {
  const { activeProject, userSession } = useApp();
  const { addToast } = useToast();
  const {
    connectionMode,
    setConnectionMode,
    effectiveStatus,
    isOffline,
    isSyncing,
    syncQueue,
    metrics,
    lastSuccessfulSyncTime,
    syncNow,
    retryFailed,
    resolveConflict,
    testMode,
    setTestMode,
    triggerTestScenario,
  } = useOffline();

  // Filters State
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Modals & Drawers
  const [conflictItem, setConflictItem] = useState<SyncQueueItem | null>(null);
  const [conflictResolutionChoice, setConflictResolutionChoice] = useState<
    'local' | 'server' | 'custom'
  >('local');
  const [customQuantity, setCustomQuantity] = useState<number>(8);
  const [customNotes, setCustomNotes] = useState<string>(
    'Reconciled on site: 8 welds completed, 5 passed visual inspection, 3 scheduled for re-grind.'
  );

  const [inspectItem, setInspectItem] = useState<SyncQueueItem | null>(null);
  const [testScenarioResult, setTestScenarioResult] = useState<string | null>(null);

  // Filtered Queue Items
  const filteredItems = useMemo(() => {
    return syncQueue.filter((item) => {
      // Type filter
      if (typeFilter !== 'ALL' && item.type !== typeFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesType = item.type.toLowerCase().includes(q);
        const matchesError = item.error?.toLowerCase().includes(q) || false;
        if (!matchesId && !matchesTitle && !matchesType && !matchesError) {
          return false;
        }
      }
      return true;
    });
  }, [syncQueue, typeFilter, statusFilter, searchQuery]);

  // Primary Action: SYNC NOW
  const handleSyncNow = async () => {
    if (effectiveStatus === 'OFFLINE') {
      addToast({
        type: 'warning',
        title: 'Device is Currently Offline',
        description: 'Cannot transmit payloads while offline. Switch connection mode to Online or Automatic to sync.',
      });
      return;
    }

    addToast({
      type: 'info',
      title: 'Payload Transmission Started',
      description: 'Transmitting queued field updates to cloud master ledger...',
    });

    const res = await syncNow();
    if (res.success) {
      addToast({
        type: 'success',
        title: 'Sync Complete: Server Confirmed',
        description: res.message,
      });
    } else {
      addToast({
        type: 'error',
        title: 'Sync Incomplete',
        description: res.message,
      });
    }
  };

  // Primary Action: RETRY FAILED
  const handleRetryFailed = async () => {
    if (metrics.failedCount === 0) {
      addToast({
        type: 'info',
        title: 'Zero Failed Items',
        description: 'All network transmissions are currently healthy.',
      });
      return;
    }

    addToast({
      type: 'info',
      title: 'Failed Payloads Re-queued',
      description: `Re-attempting transmission for ${metrics.failedCount} items...`,
    });

    await retryFailed();
  };

  // Conflict Resolution Action
  const handleOpenConflictModal = (item: SyncQueueItem) => {
    setConflictItem(item);
    setConflictResolutionChoice('local');
    if (item.conflictData) {
      setCustomQuantity(item.conflictData.localVersion.quantity);
      setCustomNotes(item.conflictData.localVersion.notes);
    }
  };

  const handleResolveConflictChoice = async (choice: 'local' | 'server' | 'custom') => {
    if (!conflictItem) return;

    await resolveConflict(conflictItem.id, choice, {
      quantity: customQuantity,
      notes: customNotes,
    });

    addToast({
      type: 'success',
      title: 'Conflict Reconciled & Confirmed',
      description: `Reconciled ${conflictItem.id} using choice "${choice}". Server baseline updated.`,
    });

    setConflictItem(null);
  };

  // Type badge styling helper
  const getTypeBadge = (type: SyncItemType) => {
    switch (type) {
      case 'Field Update':
        return {
          icon: HardHat,
          label: 'Field Update',
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
      case 'DPR':
        return {
          icon: FileCheck,
          label: 'DPR',
          bg: 'bg-[#EDF7F2]',
          border: 'border-[#B8DCC9]',
          text: 'text-[#2E7D5B]',
        };
      case 'Evidence':
        return {
          icon: ShieldCheck,
          label: 'Evidence',
          bg: 'bg-[#F0F2F5]',
          border: 'border-[#D9DEE5]',
          text: 'text-[#172033]',
        };
      case 'Execution Event':
      default:
        return {
          icon: Zap,
          label: 'Execution Event',
          bg: 'bg-[#FEF7EE]',
          border: 'border-[#ECD1A4]',
          text: 'text-[#9A5B13]',
        };
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status: SyncItemStatus) => {
    switch (status) {
      case 'Server Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
            <CheckCircle2 className="w-3 h-3" />
            Server Confirmed
          </span>
        );
      case 'Uploading':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Uploading
          </span>
        );
      case 'Queued':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FEF7EE] text-[#9A5B13] border border-[#ECD1A4]">
            <Clock className="w-3 h-3" />
            Queued (Local)
          </span>
        );
      case 'Local Draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#F0F2F5] text-[#596579] border border-[#D9DEE5]">
            <Database className="w-3 h-3" />
            Local Draft
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
            <AlertCircle className="w-3 h-3" />
            Failed Transmission
          </span>
        );
      case 'Conflict':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
            <AlertTriangle className="w-3 h-3" />
            Conflict
          </span>
        );
      default:
        return null;
    }
  };

  const breadcrumbs = [
    { label: 'Site Execution' },
    { label: 'Offline / Sync Center', current: true },
  ];

  return (
    <StateWrapper>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            HEADER & TOP CONNECTION STATUS:
            ONLINE | OFFLINE | SYNCING
            Purpose: Make offline field operation transparent and trustworthy.
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]/60">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <UploadCloud className="w-3.5 h-3.5" />
                  Field Resilience Engine
                </span>

                {/* TOP CONNECTION STATUS BADGE: ONLINE / OFFLINE / SYNCING (Priority 2 Requirement 1) */}
                {effectiveStatus === 'ONLINE' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                    <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" />
                    ONLINE · Connection Active ({connectionMode.toLowerCase()})
                  </span>
                ) : effectiveStatus === 'OFFLINE' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                    <span className="w-2 h-2 rounded-full bg-[#D98B32]" />
                    OFFLINE · Local IndexedDB Active ({connectionMode.toLowerCase()})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    SYNCING · Transmitting Payloads...
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                Offline / Sync Center
              </h1>
              <p className="text-xs text-[#596579] mt-0.5 max-w-3xl">
                Transparent and resilient synchronization queue for remote pipeline corridors. Work continues uninterrupted without cellular coverage—all site observations are buffered locally in an offline-first transactional queue with automatic conflict detection.
              </p>
            </div>

            {/* Connection Mode Controls (Priority 2 Requirement 1) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#8A94A6]">
                Connection Mode:
              </span>
              <div className="flex items-center bg-[#F0F2F5] p-1 rounded-lg border border-[#D9DEE5] text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setConnectionMode('AUTOMATIC');
                    addToast({
                      type: 'info',
                      title: 'Connection Mode: Automatic',
                      description: 'Adapting dynamically to browser network connectivity.',
                    });
                  }}
                  className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                    connectionMode === 'AUTOMATIC'
                      ? 'bg-white text-[#176B87] shadow-xs'
                      : 'text-[#596579] hover:text-[#172033]'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Automatic</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setConnectionMode('ONLINE');
                    addToast({
                      type: 'success',
                      title: 'Connection Mode: Online',
                      description: 'Intentionally operating in Online mode.',
                    });
                  }}
                  className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                    connectionMode === 'ONLINE'
                      ? 'bg-white text-[#2E7D5B] shadow-xs'
                      : 'text-[#596579] hover:text-[#172033]'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Online</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setConnectionMode('OFFLINE');
                    addToast({
                      type: 'warning',
                      title: 'Connection Mode: Offline',
                      description: 'Intentionally operating in Offline field mode. Queue buffers locally.',
                    });
                  }}
                  className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                    connectionMode === 'OFFLINE'
                      ? 'bg-white text-[#D98B32] shadow-xs'
                      : 'text-[#596579] hover:text-[#172033]'
                  }`}
                >
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </button>
              </div>
            </div>
          </div>

          {/* LAST SUCCESSFUL SYNC TIME NOTICE */}
          <div className="pt-3 flex items-center justify-between text-xs text-[#596579] font-mono flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#176B87]" />
              <span>Last Successful Server Sync:</span>
              <strong className="text-[#172033]">
                {lastSuccessfulSyncTime || '18 Sep 2026, 17:30 IST'}
              </strong>
            </div>

            <div className="flex items-center gap-3">
              <span>Device Storage: <strong>IndexedDB (14.2 MB used)</strong></span>
              <span>•</span>
              <span className="text-[#176B87] font-bold">Offline-First Transactional Queue</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            EDUCATIONAL TRUST & INTEGRITY CALLOUT:
            "Queued != Server confirmed"
            "Do not make normal offline operation look like a system failure."
            ========================================================================= */}
        <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#D9DEE5] flex items-start gap-3.5 text-xs">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#D9DEE5] flex items-center justify-center text-[#176B87] shrink-0 font-bold">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#172033]">
                Trust & Transparency Notice: Queued &ne; Server Confirmed
              </h3>
              <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-[#EDF5F8] text-[#176B87]">
                Local Safe Buffer
              </span>
            </div>
            <p className="text-[#596579] leading-relaxed">
              Updates in <strong>Queued</strong> status are securely encrypted and safely persisted in your device&apos;s local browser storage, but are <strong>not yet committed</strong> to the master project schedule. Only records marked <strong>Server Confirmed</strong> have been acknowledged by the cloud audit ledger. Working offline is completely standard on site—it is never an error condition.
            </p>
          </div>
        </div>

        {/* =========================================================================
            MAIN SUMMARY METRICS:
            - Pending uploads
            - Syncing
            - Synced today
            - Failed
            - Conflicts
            ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Pending */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Queued' ? 'ALL' : 'Queued')}
            className={`p-4 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
              statusFilter === 'Queued'
                ? 'ring-2 ring-[#9A5B13] border-[#9A5B13]'
                : 'hover:border-[#ECD1A4]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-[#8A94A6]">Pending</span>
              <Clock className="w-3.5 h-3.5 text-[#9A5B13]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#9A5B13]">
              {metrics.pendingUploads}
            </div>
            <span className="text-[11px] text-[#596579] mt-0.5 block">Queued in local buffer</span>
          </div>

          {/* 2. Uploading */}
          <div className="p-4 rounded-xl border bg-white shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-[#8A94A6]">Uploading</span>
              <RefreshCw className={`w-3.5 h-3.5 text-[#176B87] ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div className="text-2xl font-bold font-mono text-[#176B87]">
              {metrics.syncingCount}
            </div>
            <span className="text-[11px] text-[#596579] mt-0.5 block">Active transmission</span>
          </div>

          {/* 3. Confirmed */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Server Confirmed' ? 'ALL' : 'Server Confirmed')}
            className={`p-4 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
              statusFilter === 'Server Confirmed'
                ? 'ring-2 ring-[#2E7D5B] border-[#2E7D5B]'
                : 'hover:border-[#B8DCC9]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-[#8A94A6]">Confirmed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5B]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#2E7D5B]">
              {metrics.syncedToday}
            </div>
            <span className="text-[11px] text-[#596579] mt-0.5 block">Server confirmed records</span>
          </div>

          {/* 4. Failed */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Failed' ? 'ALL' : 'Failed')}
            className={`p-4 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
              statusFilter === 'Failed'
                ? 'ring-2 ring-[#B5473C] border-[#B5473C]'
                : 'hover:border-[#E4B0AA]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-[#8A94A6]">Failed</span>
              <AlertCircle className="w-3.5 h-3.5 text-[#B5473C]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#B5473C]">
              {metrics.failedCount}
            </div>
            <span className="text-[11px] text-[#596579] mt-0.5 block">Requires retry</span>
          </div>

          {/* 5. Conflicts */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Conflict' ? 'ALL' : 'Conflict')}
            className={`p-4 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
              statusFilter === 'Conflict'
                ? 'ring-2 ring-[#B5473C] border-[#B5473C]'
                : 'hover:border-[#E4B0AA]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-[#8A94A6]">Conflicts</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#B5473C]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#B5473C]">
              {metrics.conflictCount}
            </div>
            <span className="text-[11px] text-[#596579] mt-0.5 block">Discrepancy resolution</span>
          </div>
        </div>

        {/* =========================================================================
            PRIMARY ACTIONS TOOLBAR:
            - Sync Now
            - Retry Failed
            - Resolve Conflicts
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                Synchronization Queue Management
              </h2>
              <p className="text-xs text-[#596579] mt-0.5">
                Execute cloud sync, re-attempt timed out uploads, or reconcile version divergences.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* PRIMARY ACTION 1: SYNC NOW */}
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing || effectiveStatus === 'OFFLINE'}
                className="px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>

              {/* PRIMARY ACTION 2: RETRY FAILED */}
              <button
                type="button"
                onClick={handleRetryFailed}
                disabled={metrics.failedCount === 0}
                className="px-3.5 py-2 bg-white hover:bg-[#F0F2F5] text-[#172033] border border-[#D9DEE5] text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#596579]" />
                <span>Retry Failed ({metrics.failedCount})</span>
              </button>

              {/* PRIMARY ACTION 3: RESOLVE CONFLICTS */}
              {metrics.conflictCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const firstConflict = syncQueue.find((i: SyncQueueItem) => i.status === 'Conflict');
                    if (firstConflict) handleOpenConflictModal(firstConflict);
                  }}
                  className="px-3.5 py-2 bg-[#FBEFEE] hover:bg-[#FBEFEE]/80 text-[#B5473C] border border-[#E4B0AA] text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#B5473C]" />
                  <span>Resolve Conflicts ({metrics.conflictCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* FILTERS & SEARCH */}
          <div className="pt-3 border-t border-[#D9DEE5]/60 flex items-center justify-between flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-xs font-medium text-[#172033] outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="Field Update">Field Update</option>
                <option value="DPR">DPR</option>
                <option value="Photo">Photo</option>
                <option value="Evidence">Evidence</option>
                <option value="Execution Event">Execution Event</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-xs font-medium text-[#172033] outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Queued">Queued Only</option>
                <option value="Uploading">Uploading Only</option>
                <option value="Server Confirmed">Server Confirmed</option>
                <option value="Failed">Failed Only</option>
                <option value="Conflict">Conflict Only</option>
                <option value="Local Draft">Local Draft Only</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setTypeFilter('ALL');
                  setStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-[#596579] hover:text-[#172033] flex items-center gap-1 font-medium transition-colors ml-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-[#8A94A6] absolute left-3 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search item ID, title, or error..."
                className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87]"
              />
            </div>
          </div>
        </div>

        {/* =========================================================================
            QUEUE TABLE
            Columns:
            - Sync Item ID
            - Type
            - Local Created At
            - Status
            - Retry Count
            - Last Attempt
            - Error
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider">
                  <th className="py-3 px-4">Sync Item ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Payload Scope / Title</th>
                  <th className="py-3 px-4">Local Created At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Retry Count</th>
                  <th className="py-3 px-4">Last Attempt</th>
                  <th className="py-3 px-4">Error / Transmission Note</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EBF0]">
                {filteredItems.map((item) => {
                  const typeBadge = getTypeBadge(item.type);
                  const TypeIcon = typeBadge.icon;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setInspectItem(item)}
                      className="hover:bg-[#F0F2F5]/60 transition-colors cursor-pointer group"
                    >
                      {/* Sync Item ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#176B87]">
                        <span className="px-2 py-0.5 rounded bg-[#EDF5F8] border border-[#B3CBE0]">
                          {item.id}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${typeBadge.bg} ${typeBadge.border} ${typeBadge.text}`}
                        >
                          <TypeIcon className="w-3 h-3" />
                          <span>{typeBadge.label}</span>
                        </span>
                      </td>

                      {/* Payload Title */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-[#172033] truncate">{item.title}</div>
                        {item.payload.activityId && (
                          <span className="text-[10px] font-mono text-[#596579]">
                            Activity: {item.payload.activityId}
                          </span>
                        )}
                      </td>

                      {/* Local Created At */}
                      <td className="py-3.5 px-4 font-mono text-[#596579] whitespace-nowrap">
                        {item.localCreatedAt}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>

                      {/* Retry Count */}
                      <td className="py-3.5 px-4 font-mono text-[#596579]">
                        {item.retryCount > 0 ? (
                          <span className="text-[#B5473C] font-bold">{item.retryCount} / 3</span>
                        ) : (
                          <span>0</span>
                        )}
                      </td>

                      {/* Last Attempt */}
                      <td className="py-3.5 px-4 font-mono text-[#596579] whitespace-nowrap">
                        {item.lastAttempt || 'None'}
                      </td>

                      {/* Error */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {item.error ? (
                          <p className="text-[11px] text-[#B5473C] font-mono line-clamp-2 leading-tight">
                            {item.error}
                          </p>
                        ) : (
                          <span className="text-[#8A94A6] text-[11px]">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Resolve Conflict Button */}
                          {item.status === 'Conflict' && (
                            <button
                              type="button"
                              onClick={() => handleOpenConflictModal(item)}
                              className="px-2.5 py-1 rounded bg-[#B5473C] hover:bg-[#9B3C32] text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1"
                              title="Resolve Version Conflict"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>Resolve</span>
                            </button>
                          )}

                          {/* Retry Item Button */}
                          {item.status === 'Failed' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await retryFailed();
                                addToast({
                                  type: 'info',
                                  title: 'Item Re-queued',
                                  description: `Re-queued ${item.id} for sync.`,
                                });
                              }}
                              className="px-2.5 py-1 rounded bg-[#176B87] hover:bg-[#135A72] text-white text-[11px] font-bold shadow-xs transition-colors"
                              title="Retry Transmission"
                            >
                              Retry
                            </button>
                          )}

                          {/* Inspect Item */}
                          <button
                            type="button"
                            onClick={() => setInspectItem(item)}
                            className="p-1 rounded border border-[#D9DEE5] hover:bg-[#F0F2F5] text-[#596579] transition-colors"
                            title="Inspect Payload"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

        {/* =========================================================================
            ADMIN & DEVELOPER TEST SANDBOX (Priority 2 Requirements 9 & 10)
            Hidden for standard Site Engineers/Managers unless user is Admin or testMode is explicitly active
            ========================================================================= */}
        {(userSession?.role === 'admin' || testMode.isEnabled) && (
          <div className="bg-white border-2 border-[#176B87]/30 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9DEE5]/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EDF5F8] text-[#176B87] flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#172033]">
                    Admin / Developer Synchronization Test Sandbox
                  </h3>
                  <p className="text-xs text-[#596579]">
                    Simulate network anomalies, forced server rejections, and version divergence (Priority 2 Verification).
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0] text-[10px] font-mono font-bold uppercase">
                Admin Testing Mode
              </span>
            </div>

            {/* Test Simulation Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="p-3 rounded-lg border border-[#D9DEE5] bg-[#F7F8FA] flex items-center justify-between cursor-pointer hover:bg-white transition-colors">
                <div>
                  <span className="font-bold text-[#172033] block">Simulate Server Failure on Sync</span>
                  <span className="text-[11px] text-[#596579]">Returns HTTP 500 remote cluster rejection; items remain Failed.</span>
                </div>
                <input
                  type="checkbox"
                  checked={testMode.simulateServerFailure}
                  onChange={(e) =>
                    setTestMode((prev) => ({
                      ...prev,
                      simulateServerFailure: e.target.checked,
                      simulateConflict: e.target.checked ? false : prev.simulateConflict,
                    }))
                  }
                  className="w-4 h-4 rounded text-[#B5473C]"
                />
              </label>

              <label className="p-3 rounded-lg border border-[#D9DEE5] bg-[#F7F8FA] flex items-center justify-between cursor-pointer hover:bg-white transition-colors">
                <div>
                  <span className="font-bold text-[#172033] block">Simulate Version Conflict on Sync</span>
                  <span className="text-[11px] text-[#596579]">Injects diverging QA quantity to trigger Conflict resolution modal.</span>
                </div>
                <input
                  type="checkbox"
                  checked={testMode.simulateConflict}
                  onChange={(e) =>
                    setTestMode((prev) => ({
                      ...prev,
                      simulateConflict: e.target.checked,
                      simulateServerFailure: e.target.checked ? false : prev.simulateServerFailure,
                    }))
                  }
                  className="w-4 h-4 rounded text-[#D98B32]"
                />
              </label>
            </div>

            {/* 6 Automated Acceptance Test Runner Buttons */}
            <div className="pt-2 border-t border-[#D9DEE5]/60 space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                One-Click Acceptance Tests (Requirement 10 Verification):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerTestScenario('online_capture');
                    setTestScenarioResult(res);
                    addToast({ type: 'success', title: 'Scenario 1', description: res });
                  }}
                  className="p-2 bg-white border border-[#D9DEE5] rounded-lg hover:border-[#176B87] hover:bg-[#EDF5F8] text-left text-xs transition-colors"
                >
                  <span className="font-bold block text-[#172033] text-[11px]">1. Online Capture</span>
                  <span className="text-[10px] text-[#596579] block truncate">Immediate confirmation</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerTestScenario('offline_capture');
                    setTestScenarioResult(res);
                    addToast({ type: 'warning', title: 'Scenario 2', description: res });
                  }}
                  className="p-2 bg-white border border-[#D9DEE5] rounded-lg hover:border-[#D98B32] hover:bg-[#FDF6ED] text-left text-xs transition-colors"
                >
                  <span className="font-bold block text-[#172033] text-[11px]">2. Offline Capture</span>
                  <span className="text-[10px] text-[#596579] block truncate">Saves locally</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerTestScenario('offline_multi');
                    setTestScenarioResult(res);
                    addToast({ type: 'warning', title: 'Scenario 3', description: res });
                  }}
                  className="p-2 bg-white border border-[#D9DEE5] rounded-lg hover:border-[#D98B32] hover:bg-[#FDF6ED] text-left text-xs transition-colors"
                >
                  <span className="font-bold block text-[#172033] text-[11px]">3. Multi Offline</span>
                  <span className="text-[10px] text-[#596579] block truncate">Queues multiple</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerTestScenario('return_online_sync');
                    setTestScenarioResult(res);
                    addToast({ type: 'success', title: 'Scenario 4', description: res });
                  }}
                  className="p-2 bg-white border border-[#D9DEE5] rounded-lg hover:border-[#2E7D5B] hover:bg-[#EDF7F2] text-left text-xs transition-colors"
                >
                  <span className="font-bold block text-[#172033] text-[11px]">4. Return & Sync</span>
                  <span className="text-[10px] text-[#596579] block truncate">Queue synchronizes</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerTestScenario('server_failure');
                    setTestScenarioResult(res);
                    addToast({ type: 'error', title: 'Scenario 5', description: res });
                  }}
                  className="p-2 bg-white border border-[#D9DEE5] rounded-lg hover:border-[#B5473C] hover:bg-[#FBEFEE] text-left text-xs transition-colors"
                >
                  <span className="font-bold block text-[#172033] text-[11px]">5. Server Failure</span>
                  <span className="text-[10px] text-[#596579] block truncate">Item remains Failed</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerTestScenario('conflict');
                    setTestScenarioResult(res);
                    addToast({ type: 'error', title: 'Scenario 6', description: res });
                  }}
                  className="p-2 bg-white border border-[#D9DEE5] rounded-lg hover:border-[#B5473C] hover:bg-[#FBEFEE] text-left text-xs transition-colors"
                >
                  <span className="font-bold block text-[#172033] text-[11px]">6. Conflict UI</span>
                  <span className="text-[10px] text-[#596579] block truncate">Triggers divergence</span>
                </button>
              </div>

              {testScenarioResult && (
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-xs font-mono text-[#172033]">
                  <strong>Execution Log:</strong> {testScenarioResult}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: CONFLICT RESOLUTION UI
            Requirements:
            - Local Version
            - Server Version
            - Difference
            - Choose Version
            - Merge / Resolve
            ========================================================================= */}
        <Modal
          isOpen={!!conflictItem}
          onClose={() => setConflictItem(null)}
          title={`Conflict Resolution: ${conflictItem?.id || ''}`}
          subtitle={conflictItem?.title}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-[#596579] font-mono text-[11px] hidden sm:inline">
                Schedule Baseline: V3 · Rev 3.2
              </span>
              <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setConflictItem(null)}
                  className="px-3.5 py-2 font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveConflictChoice('server')}
                  className="px-3.5 py-2 font-semibold text-[#172033] bg-white hover:bg-[#F0F2F5] border border-[#D9DEE5] rounded-lg shadow-2xs"
                >
                  Keep Server
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveConflictChoice('local')}
                  className="px-3.5 py-2 font-bold text-[#176B87] bg-[#EDF5F8] hover:bg-[#DCEBF1] border border-[#B3CBE0] rounded-lg shadow-2xs"
                >
                  Keep Local
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveConflictChoice('custom')}
                  className="px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white font-bold rounded-lg shadow-xs"
                >
                  Merge
                </button>
              </div>
            </div>
          }
        >
          {conflictItem && conflictItem.conflictData && (
            <div className="space-y-5 text-xs">
              {/* DIFFERENCE BOX */}
              <div className="p-3.5 rounded-lg bg-[#FEF7EE] border border-[#ECD1A4] text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#9A5B13]">
                  <AlertTriangle className="w-4 h-4 text-[#9A5B13]" />
                  <span>Version Divergence Detected</span>
                </div>
                <p className="text-[#172033] leading-relaxed">
                  {conflictItem.conflictData.differenceSummary}
                </p>
                <p className="text-[11px] text-[#9A5B13] font-medium pt-1 border-t border-[#ECD1A4]/60">
                  Do not silently overwrite. Review the changed fields below and choose to Keep Local, Keep Server, or Merge.
                </p>
              </div>

              {/* CHANGED FIELDS MATRIX (Priority 2 Requirement 7) */}
              <div className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                  Changed Fields & Discrepancy Matrix
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-[#D9DEE5]/60 font-mono text-[11px]">
                    <span className="text-[#596579] font-medium">Quantity</span>
                    <span className="font-bold text-[#176B87]">
                      Local: {conflictItem.conflictData.localVersion.quantity} {conflictItem.conflictData.localVersion.unit}
                    </span>
                    <span className="font-bold text-[#2E7D5B]">
                      Server: {conflictItem.conflictData.serverVersion.quantity} {conflictItem.conflictData.serverVersion.unit}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-[#D9DEE5]/60 font-mono text-[11px]">
                    <span className="text-[#596579] font-medium">Progress %</span>
                    <span className="font-bold text-[#176B87]">
                      Local: {conflictItem.conflictData.localVersion.progressPercent}%
                    </span>
                    <span className="font-bold text-[#2E7D5B]">
                      Server: {conflictItem.conflictData.serverVersion.progressPercent}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1 text-[11px]">
                    <span className="text-[#596579] font-medium font-mono">Logged By</span>
                    <span className="text-[#172033] font-medium truncate">
                      {conflictItem.conflictData.localVersion.engineer}
                    </span>
                    <span className="text-[#172033] font-medium truncate">
                      {conflictItem.conflictData.serverVersion.engineer}
                    </span>
                  </div>
                </div>
              </div>

              {/* SIDE-BY-SIDE: LOCAL VERSION vs SERVER VERSION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. LOCAL VERSION */}
                <div
                  onClick={() => setConflictResolutionChoice('local')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 ${
                    conflictResolutionChoice === 'local'
                      ? 'border-[#176B87] ring-2 ring-[#176B87] bg-[#EDF5F8]/40'
                      : 'border-[#D9DEE5] bg-white hover:border-[#B3CBE0]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#176B87]">
                      Local Field Draft
                    </span>
                    <input
                      type="radio"
                      name="conflictChoice"
                      checked={conflictResolutionChoice === 'local'}
                      onChange={() => setConflictResolutionChoice('local')}
                      className="accent-[#176B87]"
                    />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#8A94A6]">
                      <span>Captured By:</span>
                      <span className="font-semibold text-[#172033]">
                        {conflictItem.conflictData.localVersion.engineer}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#8A94A6]">
                      <span>Timestamp:</span>
                      <span className="font-mono text-[#172033]">
                        {conflictItem.conflictData.localVersion.timestamp}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#8A94A6]">
                      <span>Reported Quantity:</span>
                      <span className="font-mono font-bold text-[#176B87]">
                        {conflictItem.conflictData.localVersion.quantity}{' '}
                        {conflictItem.conflictData.localVersion.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#8A94A6]">
                      <span>Progress:</span>
                      <span className="font-mono font-bold text-[#2E7D5B]">
                        {conflictItem.conflictData.localVersion.progressPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-white border border-[#D9DEE5] text-[11px] text-[#596579]">
                    &ldquo;{conflictItem.conflictData.localVersion.notes}&rdquo;
                  </div>
                </div>

                {/* 2. SERVER VERSION */}
                <div
                  onClick={() => setConflictResolutionChoice('server')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 ${
                    conflictResolutionChoice === 'server'
                      ? 'border-[#176B87] ring-2 ring-[#176B87] bg-[#EDF5F8]/40'
                      : 'border-[#D9DEE5] bg-white hover:border-[#B3CBE0]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#596579]">
                      Server Quality Baseline
                    </span>
                    <input
                      type="radio"
                      name="conflictChoice"
                      checked={conflictResolutionChoice === 'server'}
                      onChange={() => setConflictResolutionChoice('server')}
                      className="accent-[#176B87]"
                    />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#8A94A6]">
                      <span>Updated By:</span>
                      <span className="font-semibold text-[#172033]">
                        {conflictItem.conflictData.serverVersion.engineer}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#8A94A6]">
                      <span>Timestamp:</span>
                      <span className="font-mono text-[#172033]">
                        {conflictItem.conflictData.serverVersion.timestamp}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#8A94A6]">
                      <span>Reported Quantity:</span>
                      <span className="font-mono font-bold text-[#172033]">
                        {conflictItem.conflictData.serverVersion.quantity}{' '}
                        {conflictItem.conflictData.serverVersion.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#8A94A6]">
                      <span>Progress:</span>
                      <span className="font-mono font-bold text-[#596579]">
                        {conflictItem.conflictData.serverVersion.progressPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-white border border-[#D9DEE5] text-[11px] text-[#596579]">
                    &ldquo;{conflictItem.conflictData.serverVersion.notes}&rdquo;
                  </div>
                </div>
              </div>

              {/* CHOOSE VERSION / CUSTOM RECONCILE OPTION */}
              <div
                onClick={() => setConflictResolutionChoice('custom')}
                className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 ${
                  conflictResolutionChoice === 'custom'
                    ? 'border-[#176B87] ring-2 ring-[#176B87] bg-[#EDF5F8]/40'
                    : 'border-[#D9DEE5] bg-white hover:border-[#B3CBE0]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="conflictChoice"
                      checked={conflictResolutionChoice === 'custom'}
                      onChange={() => setConflictResolutionChoice('custom')}
                      className="accent-[#176B87]"
                    />
                    <span className="font-bold text-xs text-[#172033]">
                      Reconcile / Custom Merge Option
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8A94A6] uppercase font-bold">
                    Engineering Discretion
                  </span>
                </div>

                {conflictResolutionChoice === 'custom' && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#8A94A6] block mb-1">
                          Reconciled Quantity (Welds)
                        </label>
                        <input
                          type="number"
                          value={customQuantity}
                          onChange={(e) => setCustomQuantity(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-1.5 bg-white border border-[#D9DEE5] rounded-lg font-mono text-xs text-[#172033] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#8A94A6] block mb-1">
                          Calculated Progress %
                        </label>
                        <input
                          type="text"
                          disabled
                          value={`${Math.round((customQuantity / 24) * 100)}%`}
                          className="w-full px-3 py-1.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg font-mono text-xs text-[#596579]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#8A94A6] block mb-1">
                        Merged Engineering Notes
                      </label>
                      <textarea
                        rows={2}
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-xs text-[#172033] outline-none resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* =========================================================================
            DRAWER: INSPECT SYNC PAYLOAD
            ========================================================================= */}
        <Drawer
          isOpen={!!inspectItem}
          onClose={() => setInspectItem(null)}
          title={`Sync Payload: ${inspectItem?.id || ''}`}
          subtitle={inspectItem?.title}
          width="md"
        >
          {inspectItem && (
            <div className="space-y-5 text-xs p-1">
              <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#176B87]">
                    {inspectItem.id}
                  </span>
                  {getStatusBadge(inspectItem.status)}
                </div>
                <h4 className="font-bold text-sm text-[#172033]">{inspectItem.title}</h4>
                <div className="flex items-center gap-2 text-[11px] text-[#596579]">
                  <span>Type: <strong>{inspectItem.type}</strong></span>
                  <span>•</span>
                  <span>Created: {inspectItem.localCreatedAt}</span>
                </div>
              </div>

              {/* PAYLOAD DETAILS */}
              <div className="p-3.5 rounded-lg bg-white border border-[#D9DEE5] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                  Buffered Local Payload
                </span>
                <div className="space-y-1.5 text-xs font-mono">
                  {inspectItem.payload.activityId && (
                    <div className="flex justify-between">
                      <span className="text-[#8A94A6]">Activity:</span>
                      <span className="font-bold text-[#172033]">{inspectItem.payload.activityId}</span>
                    </div>
                  )}
                  {inspectItem.payload.quantity && (
                    <div className="flex justify-between">
                      <span className="text-[#8A94A6]">Quantity:</span>
                      <span className="font-bold text-[#176B87]">
                        {inspectItem.payload.quantity} {inspectItem.payload.unit}
                      </span>
                    </div>
                  )}
                  {inspectItem.payload.filename && (
                    <div className="flex justify-between">
                      <span className="text-[#8A94A6]">File:</span>
                      <span className="text-[#172033] truncate max-w-[200px]">{inspectItem.payload.filename}</span>
                    </div>
                  )}
                  {inspectItem.payload.sha256 && (
                    <div className="pt-1 border-t border-[#D9DEE5] text-[10px]">
                      <span className="text-[#8A94A6] block">SHA-256 Digest:</span>
                      <span className="text-[#596579] break-all">{inspectItem.payload.sha256}</span>
                    </div>
                  )}
                </div>

                {inspectItem.payload.notes && (
                  <div className="p-2.5 rounded bg-[#F7F8FA] border border-[#D9DEE5] text-[11px] text-[#596579] mt-2">
                    {inspectItem.payload.notes}
                  </div>
                )}
              </div>

              {/* TRANSMISSION TELEMETRY */}
              <div className="p-3.5 rounded-lg bg-white border border-[#D9DEE5] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                  Transmission Telemetry
                </span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#8A94A6]">Retry Counter:</span>
                    <span className="font-mono font-bold text-[#172033]">{inspectItem.retryCount} / 3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A94A6]">Last Upload Attempt:</span>
                    <span className="font-mono text-[#596579]">{inspectItem.lastAttempt || 'None'}</span>
                  </div>
                </div>

                {inspectItem.error && (
                  <div className="p-2.5 rounded bg-[#FBEFEE] border border-[#E4B0AA] text-[11px] text-[#B5473C] mt-2">
                    <strong>Error:</strong> {inspectItem.error}
                  </div>
                )}
              </div>

              {/* ACTION TRIGGER */}
              {inspectItem.status === 'Conflict' && (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenConflictModal(inspectItem);
                    setInspectItem(null);
                  }}
                  className="w-full py-2.5 bg-[#B5473C] hover:bg-[#9B3C32] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Launch Conflict Resolution Studio</span>
                </button>
              )}
            </div>
          )}
        </Drawer>
      </div>
    </StateWrapper>
  );
}
