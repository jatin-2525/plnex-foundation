'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useOffline } from '../../context/OfflineContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { Modal } from '../../components/shared/Modal';
import { Drawer } from '../../components/shared/Drawer';
import {
  SyncItemType,
  SyncItemStatus,
  SyncQueueItem,
  ClearSyncStatus,
  getClearStatus,
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
  ImageIcon,
  ShieldCheck,
  FileCheck,
  Eye,
  RotateCcw,
  Search,
  HardHat,
  Sliders,
  Zap,
} from 'lucide-react';

export default function OfflineSyncCenterPage() {
  const { userSession } = useApp();
  const { addToast } = useToast();
  const {
    connectionMode,
    setConnectionMode,
    effectiveStatus,
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

  // Compute 7 Clear Status counts across syncQueue
  const clearCounts = useMemo(() => {
    const counts: Record<ClearSyncStatus, number> = {
      'Saved Locally': 0,
      'Queued': 0,
      'Uploading': 0,
      'Uploaded': 0,
      'Processing': 0,
      'Confirmed': 0,
      'Needs Attention': 0,
    };
    syncQueue.forEach((item) => {
      const cs = item.clearStatus || getClearStatus(item.status);
      counts[cs] = (counts[cs] || 0) + 1;
    });
    return counts;
  }, [syncQueue]);

  // Filtered Queue Items
  const filteredItems = useMemo(() => {
    return syncQueue.filter((item) => {
      // Type filter
      if (typeFilter !== 'ALL' && item.type !== typeFilter) {
        return false;
      }
      // Status filter (supports both 7 clear status states and legacy canonical states)
      if (statusFilter !== 'ALL') {
        const itemClearStatus = item.clearStatus || getClearStatus(item.status);
        if (
          statusFilter === 'Saved Locally' && itemClearStatus !== 'Saved Locally' && item.status !== 'Local Draft'
        ) return false;
        if (
          statusFilter === 'Queued' && itemClearStatus !== 'Queued' && item.status !== 'Queued'
        ) return false;
        if (
          statusFilter === 'Uploading' && itemClearStatus !== 'Uploading' && item.status !== 'Uploading'
        ) return false;
        if (
          statusFilter === 'Uploaded' && itemClearStatus !== 'Uploaded'
        ) return false;
        if (
          statusFilter === 'Processing' && itemClearStatus !== 'Processing'
        ) return false;
        if (
          statusFilter === 'Confirmed' && itemClearStatus !== 'Confirmed' && item.status !== 'Server Confirmed'
        ) return false;
        if (
          statusFilter === 'Needs Attention' && itemClearStatus !== 'Needs Attention' && item.status !== 'Failed' && item.status !== 'Conflict'
        ) return false;
        if (
          statusFilter === 'Failed' && item.status !== 'Failed'
        ) return false;
        if (
          statusFilter === 'Conflict' && item.status !== 'Conflict'
        ) return false;
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
        title: 'No Failed Items',
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
          bg: 'bg-[#EAF0E9]',
          border: 'border-[#D9E2DA]',
          text: 'text-[#006B61]',
        };
      case 'Photo':
        return {
          icon: ImageIcon,
          label: 'Photo',
          bg: 'bg-[#EAF0E9]',
          border: 'border-[#D9E2DA]',
          text: 'text-[#2C6475]',
        };
      case 'DPR':
        return {
          icon: FileCheck,
          label: 'DPR',
          bg: 'bg-[#E4F1E9]',
          border: 'border-[#B7DAC3]',
          text: 'text-[#1F6B4E]',
        };
      case 'Evidence':
        return {
          icon: ShieldCheck,
          label: 'Evidence',
          bg: 'bg-[#EAF0E9]',
          border: 'border-[#D9E2DA]',
          text: 'text-[#1A2B25]',
        };
      case 'Execution Event':
      default:
        return {
          icon: Zap,
          label: 'Execution Event',
          bg: 'bg-[#F8EFDA]',
          border: 'border-[#E5C185]',
          text: 'text-[#825700]',
        };
    }
  };

  // Simple status indicator for the 7 clear states
  const getClearStatusIndicator = (item: SyncQueueItem) => {
    const clearState: ClearSyncStatus = item.clearStatus || getClearStatus(item.status);

    switch (clearState) {
      case 'Saved Locally':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-[11px] font-semibold bg-[#EAF0E9] text-[#52665D] border border-[#D9E2DA]">
            <span className="w-2 h-2 rounded-full bg-[#7B8798]" />
            Saved Locally
          </span>
        );
      case 'Queued':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-[11px] font-semibold bg-[#F8EFDA] text-[#B86E1B] border border-[#E5C185]">
            <span className="w-2 h-2 rounded-full bg-[#81500B]" />
            Queued
          </span>
        );
      case 'Uploading':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-[11px] font-semibold bg-[#EAF0E9] text-[#006B61] border border-[#D9E2DA]">
            <span className="w-2 h-2 rounded-full bg-[#006B61]" />
            Uploading
          </span>
        );
      case 'Uploaded':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-[11px] font-semibold bg-[#EAF0E9] text-[#2D5B94] border border-[#D9E2DA]">
            <span className="w-2 h-2 rounded-full bg-[#3B6EA8]" />
            Uploaded
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-[11px] font-semibold bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
            <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
            Processing
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-[11px] font-semibold bg-[#E4F1E9] text-[#1F6B4E] border border-[#B7DAC3]">
            <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" />
            Confirmed
          </span>
        );
      case 'Needs Attention':
      default:
        return (
          <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-[11px] font-semibold bg-[#F6E4E1] text-[#A43B36] border border-[#DCABA7]">
            <span className="w-2 h-2 rounded-full bg-[#92372F]" />
            Needs Attention
          </span>
        );
    }
  };

  const breadcrumbs = [
    { label: 'Site Execution' },
    { label: 'Offline / Sync Center', current: true },
  ];

  return (
    <StateWrapper
      loadingMessage="Loading synchronization queue..."
      emptyTitle="No synchronization records found in this view"
      emptyDescription="Records queued for two-way synchronization between field tablets and enterprise Primavera P6 will appear here. Reset your queue status filter to view all events."
    >
      <div className="space-y-6 pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            HEADER & CONNECTION STATUS
            Clean, professional header without exaggerated graphics
            ========================================================================= */}
        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9E2DA]/60">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#006B61]/10 text-[#006B61]">
                  Field Synchronization Engine
                </span>

                {/* Simple status indicator for connection state */}
                {effectiveStatus === 'ONLINE' ? (
                  <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#E4F1E9] text-[#1F6B4E] border border-[#B7DAC3]">
                    <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" />
                    Online · Connected
                  </span>
                ) : effectiveStatus === 'OFFLINE' ? (
                  <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8EFDA] text-[#825700] border border-[#E5C185]">
                    <span className="w-2 h-2 rounded-full bg-[#81500B]" />
                    Offline · Local Storage Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF0E9] text-[#006B61] border border-[#D9E2DA]">
                    <span className="w-2 h-2 rounded-full bg-[#006B61]" />
                    Syncing · Transmitting Payloads
                  </span>
                )}
              </div>

              <h1 className="text-[28px] sm:text-3xl font-bold text-[#1A2B25] tracking-tight">
                Offline / Sync Center
              </h1>
              <p className="text-sm text-[#52665D] mt-0.5 max-w-2xl">
                Reliable synchronization queue for remote construction corridors. Field captures are buffered locally and synchronized when network connectivity is established.
              </p>
            </div>

            {/* Connection Mode Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-[11px] uppercase font-semibold text-[#52665D]">
                connectionMode:
              </span>
              <div className="flex items-center bg-[#EAF0E9] p-1 rounded-lg border border-[#D9E2DA] text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setConnectionMode('AUTOMATIC');
                    addToast({
                      type: 'info',
                      title: 'Connection Mode: Automatic',
                      description: 'Adapting to device network connectivity.',
                    });
                  }}
                  className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-2 ${
                    connectionMode === 'AUTOMATIC'
                      ? 'bg-white text-[#006B61] shadow-xs font-bold'
                      : 'text-[#52665D] hover:text-[#1A2B25]'
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
                      description: 'Operating in Online mode.',
                    });
                  }}
                  className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-2 ${
                    connectionMode === 'ONLINE'
                      ? 'bg-white text-[#1F6B4E] shadow-xs font-bold'
                      : 'text-[#52665D] hover:text-[#1A2B25]'
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
                      description: 'Operating in Offline mode. Updates buffer locally.',
                    });
                  }}
                  className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-2 ${
                    connectionMode === 'OFFLINE'
                      ? 'bg-white text-[#825700] shadow-xs font-bold'
                      : 'text-[#52665D] hover:text-[#1A2B25]'
                  }`}
                >
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </button>
              </div>
            </div>
          </div>

          {/* =========================================================================
              SINGLE GLANCE STATUS STRIP:
              Shows the 7 clear states clearly with simple status indicators
              Saved Locally | Queued | Uploading | Uploaded | Processing | Confirmed | Needs Attention
              ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#52665D] font-medium flex-wrap gap-2">
              <span className="text-[10px] uppercase font-semibold text-[#52665D] tracking-wider">
                Current Queue State at a Glance:
              </span>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <Clock className="w-3 h-3 text-[#006B61]" />
                <span>Last server sync:</span>
                <span className="font-semibold text-[#1A2B25]">
                  {lastSuccessfulSyncTime || '18 Sep 2026, 17:30 IST'}
                </span>
              </div>
            </div>

            {/* 7 Clear Status States Quick-Filter Strip */}
            <div className="border border-[#D9E2DA] dark:border-[#3A5146] rounded-md bg-white dark:bg-[#17221D] overflow-hidden grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-[#D9E2DA]">
              {/* 1. Saved Locally */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Saved Locally' ? 'ALL' : 'Saved Locally')}
                className={`p-3 text-left transition-all ${
                  statusFilter === 'Saved Locally'
                    ? 'bg-[#EAF0E9]'
                    : 'hover:bg-[#F6F7F3]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#7B8798]" />
                  <span className="text-[10px] font-bold uppercase text-[#52665D] truncate">Saved Locally</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#1A2B25]">
                  {clearCounts['Saved Locally']}
                </div>
              </button>

              {/* 2. Queued */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Queued' ? 'ALL' : 'Queued')}
                className={`p-3 text-left transition-all ${
                  statusFilter === 'Queued'
                    ? 'bg-[#F8EFDA]'
                    : 'hover:bg-[#F6F7F3]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#81500B]" />
                  <span className="text-[10px] font-bold uppercase text-[#B86E1B] truncate">Queued</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#825700]">
                  {clearCounts['Queued']}
                </div>
              </button>

              {/* 3. Uploading */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Uploading' ? 'ALL' : 'Uploading')}
                className={`p-3 text-left transition-all ${
                  statusFilter === 'Uploading'
                    ? 'bg-[#EAF0E9]'
                    : 'hover:bg-[#F6F7F3]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#006B61]" />
                  <span className="text-[10px] font-bold uppercase text-[#006B61] truncate">Uploading</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#006B61]">
                  {clearCounts['Uploading']}
                </div>
              </button>

              {/* 4. Uploaded */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Uploaded' ? 'ALL' : 'Uploaded')}
                className={`p-3 text-left transition-all ${
                  statusFilter === 'Uploaded'
                    ? 'bg-[#EAF0E9]'
                    : 'hover:bg-[#F6F7F3]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#3B6EA8]" />
                  <span className="text-[10px] font-bold uppercase text-[#2D5B94] truncate">Uploaded</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#2C6475]">
                  {clearCounts['Uploaded']}
                </div>
              </button>

              {/* 5. Processing */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Processing' ? 'ALL' : 'Processing')}
                className={`p-3 text-left transition-all ${
                  statusFilter === 'Processing'
                    ? 'bg-[#EEF2FF]'
                    : 'hover:bg-[#F6F7F3]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                  <span className="text-[10px] font-bold uppercase text-[#4338CA] truncate">Processing</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#4338CA]">
                  {clearCounts['Processing']}
                </div>
              </button>

              {/* 6. Confirmed */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Confirmed' ? 'ALL' : 'Confirmed')}
                className={`p-3 text-left transition-all ${
                  statusFilter === 'Confirmed'
                    ? 'bg-[#E4F1E9]'
                    : 'hover:bg-[#F6F7F3]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" />
                  <span className="text-[10px] font-bold uppercase text-[#1F6B4E] truncate">Confirmed in Queue</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#1F6B4E]">
                  {clearCounts['Confirmed']}
                </div>
                <span className="text-[10px] text-[#52665D] block">Local Staging</span>
              </button>

              {/* 7. Needs Attention */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Needs Attention' ? 'ALL' : 'Needs Attention')}
                className={`p-3 text-left transition-all ${
                  statusFilter === 'Needs Attention'
                    ? 'bg-[#F6E4E1]'
                    : 'hover:bg-[#F6F7F3]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#92372F]" />
                  <span className="text-[10px] font-bold uppercase text-[#A43B36] truncate">Needs Attention</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#A43B36]">
                  {clearCounts['Needs Attention']}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SUMMARY METRICS ROW
            Keeps test compatibility (>Pending<, >Uploading<, >Confirmed<, >Failed<, >Conflicts<)
            Clean, solid indicators without spinning icons
            ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Pending */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Queued' ? 'ALL' : 'Queued')}
            className={`p-4 rounded-lg border bg-white shadow-xs cursor-pointer transition-colors ${
              statusFilter === 'Queued' ? 'border-[#81500B] ring-2 ring-[#81500B]/20' : 'hover:border-[#E5C185]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-semibold text-[#52665D]">Pending</span>
              <Clock className="w-3.5 h-3.5 text-[#825700]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#825700]">
              {metrics.pendingUploads}
            </div>
            <span className="text-[11px] text-[#52665D] mt-0.5 block">Buffered locally</span>
          </div>

          {/* 2. Uploading */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Uploading' ? 'ALL' : 'Uploading')}
            className={`p-4 rounded-lg border bg-white shadow-xs cursor-pointer transition-colors ${
              statusFilter === 'Uploading' ? 'border-[#006B61] ring-2 ring-[#006B61]/20' : 'hover:border-[#D9E2DA]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-semibold text-[#52665D]">Uploading</span>
              <UploadCloud className="w-3.5 h-3.5 text-[#006B61]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#006B61]">
              {metrics.syncingCount}
            </div>
            <span className="text-[11px] text-[#52665D] mt-0.5 block">Active transfer</span>
          </div>

          {/* 3. Confirmed */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Confirmed' ? 'ALL' : 'Confirmed')}
            className={`p-4 rounded-lg border bg-white shadow-xs cursor-pointer transition-colors ${
              statusFilter === 'Confirmed' ? 'border-[#2E7D5B] ring-2 ring-[#2E7D5B]/20' : 'hover:border-[#B7DAC3]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-semibold text-[#52665D]">Committed to Baseline Ledger</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1F6B4E]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#1F6B4E]">
              {metrics.syncedToday}
            </div>
            <span className="text-[11px] text-[#52665D] mt-0.5 block">19 verified ledger records</span>
          </div>

          {/* 4. Failed */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Failed' ? 'ALL' : 'Failed')}
            className={`p-4 rounded-lg border bg-white shadow-xs cursor-pointer transition-colors ${
              statusFilter === 'Failed' ? 'border-[#92372F] ring-2 ring-[#92372F]/20' : 'hover:border-[#DCABA7]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-semibold text-[#52665D]">Failed</span>
              <AlertCircle className="w-3.5 h-3.5 text-[#A43B36]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#A43B36]">
              {metrics.failedCount}
            </div>
            <span className="text-[11px] text-[#52665D] mt-0.5 block">Network timeout</span>
          </div>

          {/* 5. Conflicts */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Conflict' ? 'ALL' : 'Conflict')}
            className={`p-4 rounded-lg border bg-white shadow-xs cursor-pointer transition-colors ${
              statusFilter === 'Conflict' ? 'border-[#92372F] ring-2 ring-[#92372F]/20' : 'hover:border-[#DCABA7]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-semibold text-[#52665D]">Conflicts</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#A43B36]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#A43B36]">
              {metrics.conflictCount}
            </div>
            <span className="text-[11px] text-[#52665D] mt-0.5 block">Review required</span>
          </div>
        </div>

        {/* =========================================================================
            QUEUE MANAGEMENT TOOLBAR
            Actions: Sync Now, Retry Failed, Resolve Conflicts
            Filters: Type, Status (7 Clear States), Search
            ========================================================================= */}
        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold text-[#1A2B25] uppercase tracking-wider">
                Synchronization Queue Management
              </h2>
              <p className="text-xs text-[#52665D] mt-0.5">
                Trigger sync with central database, re-attempt failed transmissions, or resolve version discrepancies.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* PRIMARY ACTION 1: TRIGGER MANUAL SYNC */}
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing || effectiveStatus === 'OFFLINE'}
                className="px-4 py-2 bg-[#006B61] hover:bg-[#00524A] border border-[#006B61] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isSyncing ? 'Syncing...' : 'Trigger Manual Sync'}</span>
              </button>

              {/* SECONDARY ACTION 2: RETRY FAILED */}
              <button
                type="button"
                onClick={handleRetryFailed}
                disabled={metrics.failedCount === 0}
                className="px-4 py-2 bg-white hover:bg-[#EAF0E9] text-[#1A2B25] border border-[#D9E2DA] text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#52665D]" />
                <span>Retry Failed Items ({metrics.failedCount})</span>
              </button>

              {/* ACTION 3: RESOLVE CONFLICTS */}
              {metrics.conflictCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const firstConflict = syncQueue.find((i: SyncQueueItem) => i.status === 'Conflict');
                    if (firstConflict) handleOpenConflictModal(firstConflict);
                  }}
                  className="px-4 py-2 bg-[#F6E4E1] hover:bg-[#F6E4E1]/80 text-[#A43B36] border border-[#DCABA7] text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#A43B36]" />
                  <span>Resolve Conflicts ({metrics.conflictCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* FILTERS & SEARCH */}
          <div className="pt-3 border-t border-[#D9E2DA]/60 flex items-center justify-between flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#D9E2DA] rounded-lg text-xs font-medium text-[#1A2B25] outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="Field Update">Field Update</option>
                <option value="DPR">DPR</option>
                <option value="Photo">Photo</option>
                <option value="Evidence">Evidence</option>
                <option value="Execution Event">Execution Event</option>
              </select>

              {/* Status Filter (7 Clear States) */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#D9E2DA] rounded-lg text-xs font-medium text-[#1A2B25] outline-none"
              >
                <option value="ALL">All Status States</option>
                <option value="Saved Locally">Saved Locally</option>
                <option value="Queued">Queued</option>
                <option value="Uploading">Uploading</option>
                <option value="Uploaded">Uploaded</option>
                <option value="Processing">Processing</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Needs Attention">Needs Attention</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setTypeFilter('ALL');
                  setStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-[#52665D] hover:text-[#1A2B25] flex items-center gap-1 font-medium transition-colors ml-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-[#738A80] absolute left-3 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, title, or error note..."
                className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-[#D9E2DA] rounded-lg text-[#1A2B25] outline-none focus:border-[#006B61]"
              />
            </div>
          </div>
        </div>

        {/* =========================================================================
            QUEUE TABLE
            Columns:
            - Sync Item ID
            - Type
            - Payload Scope / Title
            - Local Created At
            - Status (Using Clear Status States)
            - Retry Count
            - Last Attempt
            - Error / Transmission Note
            - Actions
            ========================================================================= */}
        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-[#F6F7F3]">
                <tr className="bg-[#F6F7F3] border-b border-[#D9E2DA] text-[11px] sm:text-xs uppercase font-semibold text-[#52665D] tracking-wider h-11">
                  <th className="py-3 px-4">Sync Item ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Payload Scope / Title</th>
                  <th className="py-3 px-4">Local Created At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Retry Count</th>
                  <th className="py-3 px-4">Last Attempt</th>
                  <th className="py-3 px-4">Transmission Note</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2DA]/60">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 px-4 text-center text-[#52665D]">
                      <CheckCircle2 className="w-8 h-8 text-[#1F6B4E] mx-auto mb-2" />
                      <p className="font-semibold text-sm text-[#1A2B25]">No items in sync queue</p>
                      <p className="text-xs text-[#52665D] mt-1 max-w-sm mx-auto">
                        All offline payloads have been synchronized with the central database, or no items match your active filter.
                      </p>
                      {statusFilter !== 'ALL' && (
                        <button
                          type="button"
                          onClick={() => setStatusFilter('ALL')}
                          className="mt-3 text-xs font-semibold text-[#006B61] hover:underline cursor-pointer"
                        >
                          Reset Status Filter
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                  const typeBadge = getTypeBadge(item.type);
                  const TypeIcon = typeBadge.icon;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setInspectItem(item)}
                      className="h-11 sm:h-12 hover:bg-[#EAF0E9]/60 transition-colors cursor-pointer group"
                    >
                      {/* Sync Item ID */}
                      <td className="py-3 px-4 font-mono font-bold text-[#006B61]">
                        <span className="px-2 py-0.5 rounded bg-[#EAF0E9] border border-[#D9E2DA]">
                          {item.id}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold uppercase border ${typeBadge.bg} ${typeBadge.border} ${typeBadge.text}`}
                        >
                          <TypeIcon className="w-3 h-3" />
                          <span>{typeBadge.label}</span>
                        </span>
                      </td>

                      {/* Payload Title */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-[#1A2B25] truncate">{item.title}</div>
                        {item.payload.activityId && (
                          <span className="text-[11px] font-mono text-[#52665D]">
                            Activity: {item.payload.activityId}
                          </span>
                        )}
                      </td>

                      {/* Local Created At */}
                      <td className="py-3 px-4 font-mono text-[#52665D] whitespace-nowrap">
                        {item.localCreatedAt}
                      </td>

                      {/* Clear Status Indicator */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getClearStatusIndicator(item)}
                      </td>

                      {/* Retry Count */}
                      <td className="py-3 px-4 font-mono text-[#52665D]">
                        {item.retryCount > 0 ? (
                          <span className="text-[#A43B36] font-semibold">{item.retryCount} / 3</span>
                        ) : (
                          <span>0</span>
                        )}
                      </td>

                      {/* Last Attempt */}
                      <td className="py-3 px-4 font-mono text-[#52665D] whitespace-nowrap">
                        {item.lastAttempt || 'None'}
                      </td>

                      {/* Error or Note */}
                      <td className="py-3 px-4 max-w-xs">
                        {item.error ? (
                          <p className="text-[11px] text-[#A43B36] font-mono line-clamp-2 leading-tight">
                            {item.error}
                          </p>
                        ) : (
                          <span className="text-[#738A80] text-[11px]">Normal</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Resolve Conflict Button */}
                          {item.status === 'Conflict' && (
                            <button
                              type="button"
                              onClick={() => handleOpenConflictModal(item)}
                              className="px-3 py-1 rounded bg-[#92372F] hover:bg-[#9B3C32] text-white text-[11px] font-semibold shadow-xs transition-colors flex items-center gap-1"
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
                              className="px-3 py-1 rounded bg-[#006B61] hover:bg-[#00524A] text-white text-[11px] font-semibold shadow-xs transition-colors"
                              title="Retry Transmission"
                            >
                              Retry
                            </button>
                          )}

                          {/* Inspect Item */}
                          <button
                            type="button"
                            onClick={() => setInspectItem(item)}
                            className="p-1 rounded border border-[#D9E2DA] hover:bg-[#EAF0E9] text-[#52665D] transition-colors"
                            title="Inspect Payload"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            ADMIN & DEVELOPER TEST SANDBOX
            Hidden for standard Site Engineers unless user is Admin or testMode is active
            ========================================================================= */}
        {(userSession?.role === 'admin' || testMode.isEnabled) && (
          <div className="bg-white border border-[#006B61]/30 rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2DA]/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EAF0E9] text-[#006B61] flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1A2B25]">
                    Admin / Developer Synchronization Test Sandbox
                  </h3>
                  <p className="text-xs text-[#52665D]">
                    Simulate network anomalies, forced server rejections, and version divergence.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-[#EAF0E9] text-[#006B61] border border-[#D9E2DA] text-[10px] font-mono font-bold uppercase">
                Admin Testing Mode
              </span>
            </div>

            {/* Test Simulation Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="p-3 rounded-lg border border-[#D9E2DA] bg-[#F6F7F3] flex items-center justify-between cursor-pointer hover:bg-white transition-colors">
                <div>
                  <span className="font-semibold text-[#1A2B25] block">Simulate Server Failure on Sync</span>
                  <span className="text-[11px] text-[#52665D]">Simulates server rejection; items marked Failed.</span>
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
                  className="w-4 h-4 rounded text-[#A43B36]"
                />
              </label>

              <label className="p-3 rounded-lg border border-[#D9E2DA] bg-[#F6F7F3] flex items-center justify-between cursor-pointer hover:bg-white transition-colors">
                <div>
                  <span className="font-semibold text-[#1A2B25] block">Simulate Version Conflict on Sync</span>
                  <span className="text-[11px] text-[#52665D]">Injects diverging values to trigger Conflict resolution modal.</span>
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
                  className="w-4 h-4 rounded text-[#825700]"
                />
              </label>
            </div>

            {/* 6 Automated Acceptance Test Runner Buttons */}
            <div className="pt-2 border-t border-[#D9E2DA]/60 space-y-2">
              <span className="text-[10px] uppercase font-semibold text-[#52665D] tracking-wider block">
                Verification Scenarios:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerTestScenario('online_capture');
                    setTestScenarioResult(res);
                    addToast({ type: 'success', title: 'Scenario 1', description: res });
                  }}
                  className="p-2 bg-white border border-[#D9E2DA] rounded-lg hover:border-[#006B61] hover:bg-[#EAF0E9] text-left text-xs transition-colors"
                >
                  <span className="font-bold block text-[#1A2B25] text-[11px]">1. Online Capture</span>
                  <span className="text-[10px] text-[#52665D] block truncate">Immediate confirmation</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerTestScenario('offline_capture');
                    setTestScenarioResult(res);
                    addToast({ type: 'warning', title: 'Scenario 2', description: res });
                  }}
                  className="p-2 bg-white border border-[#D9E2DA] rounded-lg hover:border-[#81500B] hover:bg-[#F8EFDA] text-left text-xs transition-colors"
                >
                  <span className="font-bold block text-[#1A2B25] text-[11px]">2. Offline Capture</span>
                  <span className="text-[10px] text-[#52665D] block truncate">Saves locally</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerTestScenario('offline_multi');
                    setTestScenarioResult(res);
                    addToast({ type: 'warning', title: 'Scenario 3', description: res });
                  }}
                  className="p-2 bg-white border border-[#D9E2DA] rounded-lg hover:border-[#81500B] hover:bg-[#F8EFDA] text-left text-xs transition-colors"
                >
                  <span className="font-bold block text-[#1A2B25] text-[11px]">3. Multi Offline</span>
                  <span className="text-[10px] text-[#52665D] block truncate">Queues multiple</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerTestScenario('return_online_sync');
                    setTestScenarioResult(res);
                    addToast({ type: 'success', title: 'Scenario 4', description: res });
                  }}
                  className="p-2 bg-white border border-[#D9E2DA] rounded-lg hover:border-[#2E7D5B] hover:bg-[#E4F1E9] text-left text-xs transition-colors"
                >
                  <span className="font-bold block text-[#1A2B25] text-[11px]">4. Return & Sync</span>
                  <span className="text-[10px] text-[#52665D] block truncate">Queue synchronizes</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerTestScenario('server_failure');
                    setTestScenarioResult(res);
                    addToast({ type: 'error', title: 'Scenario 5', description: res });
                  }}
                  className="p-2 bg-white border border-[#D9E2DA] rounded-lg hover:border-[#92372F] hover:bg-[#F6E4E1] text-left text-xs transition-colors"
                >
                  <span className="font-bold block text-[#1A2B25] text-[11px]">5. Server Failure</span>
                  <span className="text-[10px] text-[#52665D] block truncate">Item remains Failed</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerTestScenario('conflict');
                    setTestScenarioResult(res);
                    addToast({ type: 'error', title: 'Scenario 6', description: res });
                  }}
                  className="p-2 bg-white border border-[#D9E2DA] rounded-lg hover:border-[#92372F] hover:bg-[#F6E4E1] text-left text-xs transition-colors"
                >
                  <span className="font-bold block text-[#1A2B25] text-[11px]">6. Conflict UI</span>
                  <span className="text-[10px] text-[#52665D] block truncate">Triggers divergence</span>
                </button>
              </div>

              {testScenarioResult && (
                <div className="p-3 bg-[#F6F7F3] border border-[#D9E2DA] rounded-lg text-xs font-mono text-[#1A2B25]">
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
            - Choose Version (Keep Local, Keep Server, Merge, Cancel)
            - Changed Fields
            - Do not silently overwrite
            ========================================================================= */}
        <Modal
          isOpen={!!conflictItem}
          onClose={() => setConflictItem(null)}
          title={`Conflict Resolution: ${conflictItem?.id || ''}`}
          subtitle={conflictItem?.title}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-[#52665D] font-mono text-[11px] hidden sm:inline">
                Schedule Baseline: Rev 3.2 (P6 XML)
              </span>
              <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setConflictItem(null)}
                  className="px-4 py-2 font-semibold text-[#52665D] hover:text-[#1A2B25] bg-white border border-[#D9E2DA] hover:bg-[#F6F7F3] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveConflictChoice('server')}
                  className="px-4 py-2 font-semibold text-[#1A2B25] bg-white hover:bg-[#EAF0E9] border border-[#D9E2DA] rounded-lg shadow-2xs transition-colors"
                >
                  Keep Server
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveConflictChoice('local')}
                  className="px-4 py-2 font-semibold text-[#1A2B25] bg-white hover:bg-[#EAF0E9] border border-[#D9E2DA] rounded-lg shadow-2xs transition-colors"
                >
                  Keep Local
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveConflictChoice('custom')}
                  className="px-4 py-2 bg-[#006B61] hover:bg-[#00524A] border border-[#006B61] text-white font-bold rounded-lg shadow-xs transition-colors"
                >
                  Merge Changes &amp; Resolve
                </button>
              </div>
            </div>
          }
        >
          {conflictItem && conflictItem.conflictData && (
            <div className="space-y-4 text-xs">
              {/* DIFFERENCE BOX */}
              <div className="p-4 rounded-lg bg-[#F8EFDA] border border-[#E5C185] text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-[#825700]">
                  <AlertTriangle className="w-4 h-4 text-[#825700]" />
                  <span>Version Divergence Detected</span>
                </div>
                <p className="text-[#1A2B25] leading-relaxed">
                  {conflictItem.conflictData.differenceSummary}
                </p>
                <p className="text-[11px] text-[#825700] font-medium pt-1 border-t border-[#E5C185]/60">
                  Do not silently overwrite. Review the changed fields below and choose to Keep Local, Keep Server, or Merge.
                </p>
              </div>

              {/* CHANGED FIELDS MATRIX */}
              <div className="p-4 bg-[#F6F7F3] border border-[#D9E2DA] rounded-lg space-y-2">
                <span className="text-[10px] uppercase font-semibold text-[#52665D] tracking-wider block">
                  Changed Fields & Discrepancy Matrix
                </span>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-[#D9E2DA]/60 font-mono text-[11px]">
                    <span className="text-[#52665D] font-medium">Quantity</span>
                    <span className="font-bold text-[#006B61]">
                      Local: {conflictItem.conflictData.localVersion.quantity} {conflictItem.conflictData.localVersion.unit}
                    </span>
                    <span className="font-bold text-[#1F6B4E]">
                      Server: {conflictItem.conflictData.serverVersion.quantity} {conflictItem.conflictData.serverVersion.unit}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-[#D9E2DA]/60 font-mono text-[11px]">
                    <span className="text-[#52665D] font-medium">Progress %</span>
                    <span className="font-bold text-[#006B61]">
                      Local: {conflictItem.conflictData.localVersion.progressPercent}%
                    </span>
                    <span className="font-bold text-[#1F6B4E]">
                      Server: {conflictItem.conflictData.serverVersion.progressPercent}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1 text-[11px]">
                    <span className="text-[#52665D] font-medium font-mono">Logged By</span>
                    <span className="text-[#1A2B25] font-medium truncate">
                      {conflictItem.conflictData.localVersion.engineer}
                    </span>
                    <span className="text-[#1A2B25] font-medium truncate">
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
                  className={`p-4 rounded-lg border cursor-pointer transition-all space-y-2 ${
                    conflictResolutionChoice === 'local'
                      ? 'border-[#006B61] ring-2 ring-[#006B61]/20 bg-[#EAF0E9]/40'
                      : 'border-[#D9E2DA] bg-white hover:border-[#D9E2DA]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#006B61]">
                      Local Field Draft
                    </span>
                    <input
                      type="radio"
                      name="conflictChoice"
                      checked={conflictResolutionChoice === 'local'}
                      onChange={() => setConflictResolutionChoice('local')}
                      className="accent-[#006B61]"
                    />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-[#738A80]">
                      <span>Captured By:</span>
                      <span className="font-semibold text-[#1A2B25]">
                        {conflictItem.conflictData.localVersion.engineer}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#738A80]">
                      <span>Timestamp:</span>
                      <span className="font-mono text-[#1A2B25]">
                        {conflictItem.conflictData.localVersion.timestamp}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#738A80]">
                      <span>Reported Quantity:</span>
                      <span className="font-mono font-bold text-[#006B61]">
                        {conflictItem.conflictData.localVersion.quantity}{' '}
                        {conflictItem.conflictData.localVersion.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#738A80]">
                      <span>Progress:</span>
                      <span className="font-mono font-bold text-[#1F6B4E]">
                        {conflictItem.conflictData.localVersion.progressPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded bg-white border border-[#D9E2DA] text-[11px] text-[#52665D]">
                    &ldquo;{conflictItem.conflictData.localVersion.notes}&rdquo;
                  </div>
                </div>

                {/* 2. SERVER VERSION */}
                <div
                  onClick={() => setConflictResolutionChoice('server')}
                  className={`p-4 rounded-lg border cursor-pointer transition-all space-y-2 ${
                    conflictResolutionChoice === 'server'
                      ? 'border-[#006B61] ring-2 ring-[#006B61]/20 bg-[#EAF0E9]/40'
                      : 'border-[#D9E2DA] bg-white hover:border-[#D9E2DA]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#52665D]">
                      Server Baseline
                    </span>
                    <input
                      type="radio"
                      name="conflictChoice"
                      checked={conflictResolutionChoice === 'server'}
                      onChange={() => setConflictResolutionChoice('server')}
                      className="accent-[#006B61]"
                    />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-[#738A80]">
                      <span>Updated By:</span>
                      <span className="font-semibold text-[#1A2B25]">
                        {conflictItem.conflictData.serverVersion.engineer}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#738A80]">
                      <span>Timestamp:</span>
                      <span className="font-mono text-[#1A2B25]">
                        {conflictItem.conflictData.serverVersion.timestamp}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#738A80]">
                      <span>Reported Quantity:</span>
                      <span className="font-mono font-bold text-[#1A2B25]">
                        {conflictItem.conflictData.serverVersion.quantity}{' '}
                        {conflictItem.conflictData.serverVersion.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#738A80]">
                      <span>Progress:</span>
                      <span className="font-mono font-bold text-[#52665D]">
                        {conflictItem.conflictData.serverVersion.progressPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded bg-white border border-[#D9E2DA] text-[11px] text-[#52665D]">
                    &ldquo;{conflictItem.conflictData.serverVersion.notes}&rdquo;
                  </div>
                </div>
              </div>

              {/* CHOOSE VERSION / CUSTOM RECONCILE OPTION */}
              <div
                onClick={() => setConflictResolutionChoice('custom')}
                className={`p-4 rounded-lg border cursor-pointer transition-all space-y-2 ${
                  conflictResolutionChoice === 'custom'
                    ? 'border-[#006B61] ring-2 ring-[#006B61]/20 bg-[#EAF0E9]/40'
                    : 'border-[#D9E2DA] bg-white hover:border-[#D9E2DA]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="conflictChoice"
                      checked={conflictResolutionChoice === 'custom'}
                      onChange={() => setConflictResolutionChoice('custom')}
                      className="accent-[#006B61]"
                    />
                    <span className="font-bold text-xs text-[#1A2B25]">
                      Reconcile / Custom Merge Option
                    </span>
                  </div>
                  <span className="text-[10px] text-[#52665D] uppercase font-semibold">
                    Engineering Discretion
                  </span>
                </div>

                {conflictResolutionChoice === 'custom' && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold uppercase text-[#52665D] block mb-1">
                          Reconciled Quantity (Welds)
                        </label>
                        <input
                          type="number"
                          value={customQuantity}
                          onChange={(e) => setCustomQuantity(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-1.5 bg-white border border-[#D9E2DA] rounded-lg font-mono text-xs text-[#1A2B25] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase text-[#52665D] block mb-1">
                          Calculated Progress %
                        </label>
                        <input
                          type="text"
                          disabled
                          value={`${Math.round((customQuantity / 24) * 100)}%`}
                          className="w-full px-3 py-1.5 bg-[#F6F7F3] border border-[#D9E2DA] rounded-lg font-mono text-xs text-[#52665D]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold uppercase text-[#52665D] block mb-1">
                        Merged Engineering Notes
                      </label>
                      <textarea
                        rows={2}
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#D9E2DA] rounded-lg text-xs text-[#1A2B25] outline-none resize-none"
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
            <div className="space-y-6 text-xs p-1">
              <div className="p-4 rounded-lg bg-[#F6F7F3] border border-[#D9E2DA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#006B61]">
                    {inspectItem.id}
                  </span>
                  {getClearStatusIndicator(inspectItem)}
                </div>
                <h4 className="font-bold text-sm text-[#1A2B25]">{inspectItem.title}</h4>
                <div className="flex items-center gap-2 text-[11px] text-[#52665D]">
                  <span>Type: <strong>{inspectItem.type}</strong></span>
                  <span>•</span>
                  <span>Created: {inspectItem.localCreatedAt}</span>
                </div>
              </div>

              {/* PAYLOAD DETAILS */}
              <div className="p-4 rounded-lg bg-white border border-[#D9E2DA] space-y-2">
                <span className="text-[10px] uppercase font-semibold text-[#52665D] tracking-wider block">
                  Buffered Local Payload
                </span>
                <div className="space-y-2 text-xs font-mono">
                  {inspectItem.payload.activityId && (
                    <div className="flex justify-between">
                      <span className="text-[#738A80]">Activity:</span>
                      <span className="font-bold text-[#1A2B25]">{inspectItem.payload.activityId}</span>
                    </div>
                  )}
                  {inspectItem.payload.quantity && (
                    <div className="flex justify-between">
                      <span className="text-[#738A80]">Quantity:</span>
                      <span className="font-bold text-[#006B61]">
                        {inspectItem.payload.quantity} {inspectItem.payload.unit}
                      </span>
                    </div>
                  )}
                  {inspectItem.payload.filename && (
                    <div className="flex justify-between">
                      <span className="text-[#738A80]">File:</span>
                      <span className="text-[#1A2B25] truncate max-w-[200px]">{inspectItem.payload.filename}</span>
                    </div>
                  )}
                  {inspectItem.payload.sha256 && (
                    <details className="pt-1 border-t border-[#D9E2DA] text-[10px]">
                      <summary className="text-[#006B61] cursor-pointer hover:underline font-semibold">Technical Details</summary>
                      <div className="mt-1">
                        <span className="text-[#738A80] block">Verification Hash:</span>
                        <span className="text-[#52665D] break-all font-mono">{inspectItem.payload.sha256}</span>
                      </div>
                    </details>
                  )}
                </div>

                {inspectItem.payload.notes && (
                  <div className="p-3 rounded bg-[#F6F7F3] border border-[#D9E2DA] text-[11px] text-[#52665D] mt-2">
                    {inspectItem.payload.notes}
                  </div>
                )}
              </div>

              {/* TRANSMISSION TELEMETRY */}
              <div className="p-4 rounded-lg bg-white border border-[#D9E2DA] space-y-2">
                <span className="text-[10px] uppercase font-semibold text-[#52665D] tracking-wider block">
                  Transmission Telemetry
                </span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#738A80]">Retry Counter:</span>
                    <span className="font-mono font-bold text-[#1A2B25]">{inspectItem.retryCount} / 3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#738A80]">Last Upload Attempt:</span>
                    <span className="font-mono text-[#52665D]">{inspectItem.lastAttempt || 'None'}</span>
                  </div>
                </div>

                {inspectItem.error && (
                  <div className="p-3 rounded bg-[#F6E4E1] border border-[#DCABA7] text-[11px] text-[#A43B36] mt-2">
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
                  className="w-full py-2 bg-[#92372F] hover:bg-[#9B3C32] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs"
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
