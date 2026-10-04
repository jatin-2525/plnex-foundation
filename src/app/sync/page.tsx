'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { AppShell } from '../../components/shell/AppShell';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
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
} from 'lucide-react';

export default function OfflineSyncCenterPage() {
  const { activeProject } = useApp();
  const { addToast } = useToast();

  // Connection State: ONLINE | OFFLINE | SYNCING
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('ONLINE');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSuccessfulSyncTime, setLastSuccessfulSyncTime] = useState<string | null>(
    '18 Sep 2026, 13:45:10'
  );
  const [lastSyncRelative, setLastSyncRelative] = useState<string>('30 minutes ago');

  // Sync Queue State
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>(INITIAL_SYNC_QUEUE_ITEMS);

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

  // Sync Summary Calculations
  const metrics = useMemo(() => {
    const pendingUploads = queueItems.filter(
      (i) => i.status === 'Queued' || i.status === 'Local Draft'
    ).length;
    const syncingCount = queueItems.filter((i) => i.status === 'Uploading').length;
    const syncedToday = queueItems.filter((i) => i.status === 'Server Confirmed').length;
    const failedCount = queueItems.filter((i) => i.status === 'Failed').length;
    const conflictCount = queueItems.filter((i) => i.status === 'Conflict').length;

    return {
      pendingUploads,
      syncingCount,
      syncedToday: syncedToday + 16, // total confirmed on site today
      failedCount,
      conflictCount,
    };
  }, [queueItems]);

  // Filtered Queue Items
  const filteredItems = useMemo(() => {
    return queueItems.filter((item) => {
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
  }, [queueItems, typeFilter, statusFilter, searchQuery]);

  // Primary Action: SYNC NOW
  const handleSyncNow = () => {
    if (connectionStatus === 'OFFLINE') {
      addToast({
        type: 'warning',
        title: 'Device is Currently Offline',
        description: 'Cannot transmit payloads while offline. Switch connection mode to Online to sync.',
      });
      return;
    }

    const queuedCount = queueItems.filter((i) => i.status === 'Queued').length;
    if (queuedCount === 0) {
      addToast({
        type: 'info',
        title: 'All Queued Payloads Already Transmitted',
        description: 'Zero items pending sync in the offline queue.',
      });
      return;
    }

    setConnectionStatus('SYNCING');
    setIsSyncing(true);

    // Step 1: Mark queued items as Uploading
    setQueueItems((prev) =>
      prev.map((i) => (i.status === 'Queued' ? { ...i, status: 'Uploading' } : i))
    );

    addToast({
      type: 'info',
      title: 'Payload Transmission Started',
      description: `Transmitting ${queuedCount} queued field updates to cloud master ledger...`,
    });

    // Step 2: Finalize upload after network roundtrip
    setTimeout(() => {
      const nowFormatted = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const dateStr = `18 Sep 2026, ${nowFormatted}`;

      setQueueItems((prev) =>
        prev.map((i) =>
          i.status === 'Uploading'
            ? {
                ...i,
                status: 'Server Confirmed',
                lastAttempt: dateStr,
                error: null,
              }
            : i
        )
      );

      setLastSuccessfulSyncTime(dateStr);
      setLastSyncRelative('Just now');
      setIsSyncing(false);
      setConnectionStatus('ONLINE');

      addToast({
        type: 'success',
        title: 'Sync Complete: Server Confirmed',
        description: `${queuedCount} field records written to schedule audit ledger. Master Twin updated.`,
      });
    }, 1100);
  };

  // Primary Action: RETRY FAILED
  const handleRetryFailed = () => {
    const failedItems = queueItems.filter((i) => i.status === 'Failed');
    if (failedItems.length === 0) {
      addToast({
        type: 'info',
        title: 'Zero Failed Items',
        description: 'All network transmissions are currently healthy.',
      });
      return;
    }

    setQueueItems((prev) =>
      prev.map((i) =>
        i.status === 'Failed'
          ? {
              ...i,
              status: 'Queued',
              retryCount: 0,
              error: null,
            }
          : i
      )
    );

    addToast({
      type: 'info',
      title: 'Failed Payloads Re-queued',
      description: `Reset retry counter for ${failedItems.length} items. Ready for immediate transmission.`,
    });

    if (connectionStatus === 'ONLINE') {
      setTimeout(() => {
        handleSyncNow();
      }, 200);
    }
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

  const handleResolveConflict = () => {
    if (!conflictItem) return;

    let resolvedQuantity = conflictItem.payload.quantity || 8;
    let resolvedNotes = conflictItem.payload.notes || '';

    if (conflictResolutionChoice === 'local' && conflictItem.conflictData) {
      resolvedQuantity = conflictItem.conflictData.localVersion.quantity;
      resolvedNotes = conflictItem.conflictData.localVersion.notes;
    } else if (conflictResolutionChoice === 'server' && conflictItem.conflictData) {
      resolvedQuantity = conflictItem.conflictData.serverVersion.quantity;
      resolvedNotes = conflictItem.conflictData.serverVersion.notes;
    } else if (conflictResolutionChoice === 'custom') {
      resolvedQuantity = customQuantity;
      resolvedNotes = customNotes;
    }

    const nowFormatted = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setQueueItems((prev) =>
      prev.map((i) =>
        i.id === conflictItem.id
          ? {
              ...i,
              status: 'Server Confirmed',
              error: null,
              title: `${i.title.split('(')[0]} (${resolvedQuantity} welds reconciled)`,
              payload: {
                ...i.payload,
                quantity: resolvedQuantity,
                notes: resolvedNotes,
              },
              lastAttempt: `18 Sep 2026, ${nowFormatted}`,
            }
          : i
      )
    );

    addToast({
      type: 'success',
      title: 'Conflict Reconciled & Confirmed',
      description: `Reconciled ${conflictItem.id} with ${resolvedQuantity} welds. Server baseline updated.`,
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] animate-pulse">
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
    <AppShell>
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

                {/* TOP CONNECTION STATUS BADGE: ONLINE / OFFLINE / SYNCING */}
                {connectionStatus === 'ONLINE' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                    <span className="w-2 h-2 rounded-full bg-[#2E7D5B] animate-pulse" />
                    ONLINE · 4G LTE Field Link (48ms)
                  </span>
                ) : connectionStatus === 'OFFLINE' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#F0F2F5] text-[#596579] border border-[#D9DEE5]">
                    <WifiOff className="w-3.5 h-3.5 text-[#8A94A6]" />
                    OFFLINE · Local IndexedDB Cache Active
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
                Transparent and resilient synchronization queue for remote pipeline corridors. Work continues uninterrupted without cellular coverage—all site observations are safely buffered with zero data loss.
              </p>
            </div>

            {/* Connection Mode Simulator Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#8A94A6] hidden sm:inline">
                Simulate Link:
              </span>
              <div className="flex items-center bg-[#F0F2F5] p-1 rounded-lg border border-[#D9DEE5] text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setConnectionStatus('ONLINE');
                    addToast({
                      type: 'success',
                      title: 'Field Link Active (Online)',
                      description: 'Cellular connection active. Background sync enabled.',
                    });
                  }}
                  className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                    connectionStatus === 'ONLINE'
                      ? 'bg-white text-[#2E7D5B] shadow-xs'
                      : 'text-[#596579] hover:text-[#172033]'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Online</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setConnectionStatus('OFFLINE');
                    addToast({
                      type: 'info',
                      title: 'Switched to Offline Mode',
                      description: 'Normal offline operation. All field observations will buffer safely.',
                    });
                  }}
                  className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                    connectionStatus === 'OFFLINE'
                      ? 'bg-white text-[#596579] shadow-xs'
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
              {lastSuccessfulSyncTime ? (
                <strong className="text-[#172033]">
                  {lastSuccessfulSyncTime} ({lastSyncRelative})
                </strong>
              ) : (
                <span className="text-[#8A94A6] italic">Pending Initial Sync</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span>Device Storage: <strong>IndexedDB (14.2 MB used)</strong></span>
              <span>•</span>
              <span className="text-[#2E7D5B] font-bold">Zero Data Loss Architecture</span>
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
          {/* 1. Pending Uploads */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Queued' ? 'ALL' : 'Queued')}
            className={`p-4 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
              statusFilter === 'Queued'
                ? 'ring-2 ring-[#9A5B13] border-[#9A5B13]'
                : 'hover:border-[#ECD1A4]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-[#8A94A6]">Pending Uploads</span>
              <Clock className="w-3.5 h-3.5 text-[#9A5B13]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#9A5B13]">
              {metrics.pendingUploads}
            </div>
            <span className="text-[11px] text-[#596579] mt-0.5 block">Queued in local buffer</span>
          </div>

          {/* 2. Syncing */}
          <div className="p-4 rounded-xl border bg-white shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-[#8A94A6]">Syncing</span>
              <RefreshCw className={`w-3.5 h-3.5 text-[#176B87] ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div className="text-2xl font-bold font-mono text-[#176B87]">
              {isSyncing ? '1 Active' : '0 Idle'}
            </div>
            <span className="text-[11px] text-[#596579] mt-0.5 block">Active transmission</span>
          </div>

          {/* 3. Synced Today */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Server Confirmed' ? 'ALL' : 'Server Confirmed')}
            className={`p-4 rounded-xl border bg-white shadow-xs cursor-pointer transition-all ${
              statusFilter === 'Server Confirmed'
                ? 'ring-2 ring-[#2E7D5B] border-[#2E7D5B]'
                : 'hover:border-[#B8DCC9]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-[#8A94A6]">Synced Today</span>
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
            - Resolve Conflict
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
                disabled={isSyncing || connectionStatus === 'OFFLINE'}
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

              {/* PRIMARY ACTION 3: RESOLVE CONFLICT */}
              {metrics.conflictCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const firstConflict = queueItems.find((i) => i.status === 'Conflict');
                    if (firstConflict) handleOpenConflictModal(firstConflict);
                  }}
                  className="px-3.5 py-2 bg-[#FBEFEE] hover:bg-[#FBEFEE]/80 text-[#B5473C] border border-[#E4B0AA] text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#B5473C]" />
                  <span>Resolve Conflict (1)</span>
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
            <table className="w-full text-left border-collapse text-xs">
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
                              onClick={() => {
                                setQueueItems((prev) =>
                                  prev.map((i) =>
                                    i.id === item.id ? { ...i, status: 'Queued', retryCount: 0 } : i
                                  )
                                );
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
              <span className="text-[#596579] font-mono text-[11px]">
                Schedule Baseline: Rev 3.2
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConflictItem(null)}
                  className="px-4 py-2 font-semibold text-[#596579] hover:text-[#172033]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResolveConflict}
                  className="px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white font-bold rounded-lg shadow-xs"
                >
                  Merge / Resolve Version
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
    </AppShell>
  );
}
