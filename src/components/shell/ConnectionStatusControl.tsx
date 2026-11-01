'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useOffline, ConnectionMode } from '../../context/OfflineContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Check,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sliders,
  AlertTriangle,
  ServerCrash,
} from 'lucide-react';

export function ConnectionStatusControl() {
  const {
    connectionMode,
    setConnectionMode,
    isBrowserOnline,
    effectiveStatus,
    isSyncing,
    metrics,
    testMode,
    setTestMode,
    triggerTestScenario,
  } = useOffline();

  const { userSession } = useApp();
  const { addToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMode = (mode: ConnectionMode) => {
    setConnectionMode(mode);
    addToast({
      type: 'info',
      title: `Connection Mode: ${mode}`,
      description:
        mode === 'AUTOMATIC'
          ? 'Application now adapts to browser network connectivity.'
          : mode === 'OFFLINE'
          ? 'Operating intentionally in Offline Mode. Updates will queue locally.'
          : 'Operating intentionally in Online Mode.',
    });
  };

  const isPrivilegedAdmin = userSession?.role === 'admin';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Compact Header Indicator Button (Priority 2 Requirement 2) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1 bg-[#F3F6FA] hover:bg-[#EAF0F5] border border-[#D8E2EA] rounded-md text-xs font-medium text-[#142C3F] transition-colors cursor-pointer"
        aria-label="Toggle Connection Status settings"
        title={`Connection Mode: ${connectionMode} • Effective: ${effectiveStatus}`}
      >
        {/* Status Dot */}
        {effectiveStatus === 'ONLINE' ? (
          <span className="w-2 h-2 rounded-full bg-[#2E7D5B] ring-2 ring-[#E4F4EC]" />
        ) : effectiveStatus === 'OFFLINE' ? (
          <span className="w-2 h-2 rounded-full bg-[#845006] ring-2 ring-[#FFF1D3]" />
        ) : (
          <RefreshCw className="w-2.5 h-2.5 text-[#0F6B68] animate-spin" />
        )}

        {/* Status Label */}
        <span className="font-semibold text-xs">
          {effectiveStatus === 'ONLINE'
            ? 'Sync: Connected · Snapshot: 18 Sep 2026 (Demo)'
            : effectiveStatus === 'OFFLINE'
            ? 'Offline Queue · Snapshot: 18 Sep 2026 (Demo)'
            : 'Syncing · Snapshot: 18 Sep 2026'}
        </span>

        {/* Mode Tag */}
        <span className="text-[10px] text-[#7B8798] hidden sm:inline">
          {connectionMode === 'AUTOMATIC' ? '(Auto)' : `(${connectionMode.toLowerCase()})`}
        </span>

        <ChevronDown className={`w-3 h-3 text-[#7B8798] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#D8E2EA] rounded-lg shadow-lg z-50 p-4 text-xs space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#D8E2EA]/60 pb-2">
            <div>
              <span className="font-bold text-sm text-[#142C3F] block">Connection Status</span>
              <span className="text-[11px] text-[#526779]">
                Network state: {isBrowserOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                effectiveStatus === 'ONLINE'
                  ? 'bg-[#E4F4EC] text-[#2E7D5B] border border-[#B8DCC9]'
                  : effectiveStatus === 'OFFLINE'
                  ? 'bg-[#FFF1D3] text-[#8C5311] border border-[#F0D4A6]'
                  : 'bg-[#EAF0F5] text-[#0F6B68] border border-[#D8E2EA]'
              }`}
            >
              {effectiveStatus}
            </span>
          </div>

          {/* 3 Modes Selector (Priority 2 Requirement 1) */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-semibold text-[#526779] tracking-wider block">
              Connection Mode
            </span>

            {/* Mode 1: Automatic */}
            <button
              type="button"
              onClick={() => handleSelectMode('AUTOMATIC')}
              className={`w-full p-3 rounded-lg border text-left flex items-start justify-between transition-colors ${
                connectionMode === 'AUTOMATIC'
                  ? 'bg-[#EAF0F5] border-[#0F6B68] text-[#142C3F]'
                  : 'bg-white border-[#D8E2EA] hover:bg-[#F3F6FA] text-[#526779]'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="p-1 rounded bg-white border border-[#D8E2EA] text-[#0F6B68] mt-0.5">
                  <Wifi className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#142C3F] flex items-center gap-2">
                    <span>Automatic</span>
                    {connectionMode === 'AUTOMATIC' && (
                      <span className="text-[10px] font-semibold text-[#0F6B68] bg-white px-1.5 py-0.5 rounded border border-[#D8E2EA]">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#526779] mt-0.5">
                    Browser & network state automatically determines behavior.
                  </p>
                </div>
              </div>
              {connectionMode === 'AUTOMATIC' && <Check className="w-4 h-4 text-[#0F6B68] shrink-0" />}
            </button>

            {/* Mode 2: Online */}
            <button
              type="button"
              onClick={() => handleSelectMode('ONLINE')}
              className={`w-full p-3 rounded-lg border text-left flex items-start justify-between transition-colors ${
                connectionMode === 'ONLINE'
                  ? 'bg-[#E4F4EC] border-[#2E7D5B] text-[#142C3F]'
                  : 'bg-white border-[#D8E2EA] hover:bg-[#F3F6FA] text-[#526779]'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="p-1 rounded bg-white border border-[#D8E2EA] text-[#2E7D5B] mt-0.5">
                  <Wifi className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#142C3F] flex items-center gap-2">
                    <span>Online</span>
                    {connectionMode === 'ONLINE' && (
                      <span className="text-[10px] font-semibold text-[#2E7D5B] bg-white px-1.5 py-0.5 rounded border border-[#B8DCC9]">
                        Forced
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#526779] mt-0.5">
                    Application intentionally operates in online mode.
                  </p>
                </div>
              </div>
              {connectionMode === 'ONLINE' && <Check className="w-4 h-4 text-[#2E7D5B] shrink-0" />}
            </button>

            {/* Mode 3: Offline */}
            <button
              type="button"
              onClick={() => handleSelectMode('OFFLINE')}
              className={`w-full p-3 rounded-lg border text-left flex items-start justify-between transition-colors ${
                connectionMode === 'OFFLINE'
                  ? 'bg-[#FFF1D3] border-[#845006] text-[#142C3F]'
                  : 'bg-white border-[#D8E2EA] hover:bg-[#F3F6FA] text-[#526779]'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="p-1 rounded bg-white border border-[#D8E2EA] text-[#8C5311] mt-0.5">
                  <WifiOff className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#142C3F] flex items-center gap-2">
                    <span>Offline</span>
                    {connectionMode === 'OFFLINE' && (
                      <span className="text-[10px] font-semibold text-[#8C5311] bg-white px-1.5 py-0.5 rounded border border-[#F0D4A6]">
                        Simulated
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#526779] mt-0.5">
                    Application intentionally operates in offline mode for field use.
                  </p>
                </div>
              </div>
              {connectionMode === 'OFFLINE' && <Check className="w-4 h-4 text-[#845006] shrink-0" />}
            </button>
          </div>

          {/* Offline Mode Notice Banner (Priority 2 Requirement 3) */}
          {effectiveStatus === 'OFFLINE' && (
            <div className="p-3 rounded-lg bg-[#FFF1D3]/60 border border-[#F0D4A6] text-[11px] text-[#8C5311] space-y-0.5">
              <span className="font-bold block uppercase tracking-wider text-[10px]">
                OFFLINE MODE
              </span>
              <p>
                Field Capture & DPR save to IndexedDB. Updates will be synchronized when online mode is restored.
              </p>
            </div>
          )}

          {/* Sync Queue Summary & Direct Navigation */}
          <div className="pt-2 border-t border-[#D8E2EA]/60 flex items-center justify-between text-[11px]">
            <span className="text-[#526779]">
              Queue:{' '}
              <strong className="text-[#142C3F] font-mono">
                {metrics.pendingUploads} pending
              </strong>{' '}
              {metrics.failedCount > 0 && (
                <span className="text-[#A24335]">({metrics.failedCount} failed)</span>
              )}
            </span>
            <Link
              href="/sync"
              onClick={() => setIsOpen(false)}
              className="text-[#0F6B68] hover:underline font-bold inline-flex items-center gap-1"
            >
              <span>Sync Center</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Privileged Admin / Developer Testing Controls (Priority 2 Requirement 9) */}
          {isPrivilegedAdmin && (
            <div className="pt-2 border-t border-[#D8E2EA]/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#526779] uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-[#0F6B68]" />
                  Admin Test Mode
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-[#526779]">
                  <input
                    type="checkbox"
                    checked={testMode.isEnabled}
                    onChange={(e) =>
                      setTestMode((prev) => ({ ...prev, isEnabled: e.target.checked }))
                    }
                    className="rounded text-[#0F6B68]"
                  />
                  <span>Enable Simulation</span>
                </label>
              </div>

              {testMode.isEnabled && (
                <div className="p-3 rounded-lg bg-[#F3F6FA] border border-[#D8E2EA] space-y-2 text-[11px]">
                  <div className="space-y-1">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[#142C3F] font-medium">Simulate Server Failure</span>
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
                        className="rounded text-[#A24335]"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[#142C3F] font-medium">Simulate Version Conflict</span>
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
                        className="rounded text-[#845006]"
                      />
                    </label>
                  </div>

                  {/* Quick Acceptance Test Runner */}
                  <div className="pt-2 border-t border-[#D8E2EA]/60">
                    <span className="text-[10px] text-[#526779] block font-semibold mb-1">
                      Quick Acceptance Scenarios:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await triggerTestScenario('online_capture');
                          addToast({ type: 'success', title: 'Test Scenario 1', description: res });
                        }}
                        className="p-1 text-[10px] bg-white border border-[#D8E2EA] rounded hover:bg-[#EAF0F5] text-left truncate"
                        title="Scenario 1: Online -> capture -> server confirms"
                      >
                        1. Online Capture
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await triggerTestScenario('offline_capture');
                          addToast({ type: 'warning', title: 'Test Scenario 2', description: res });
                        }}
                        className="p-1 text-[10px] bg-white border border-[#D8E2EA] rounded hover:bg-[#EAF0F5] text-left truncate"
                        title="Scenario 2: Offline -> capture -> local save"
                      >
                        2. Offline Capture
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await triggerTestScenario('return_online_sync');
                          addToast({ type: 'success', title: 'Test Scenario 4', description: res });
                        }}
                        className="p-1 text-[10px] bg-white border border-[#D8E2EA] rounded hover:bg-[#EAF0F5] text-left truncate"
                        title="Scenario 4: Return Online -> queue syncs"
                      >
                        3. Return & Sync
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await triggerTestScenario('server_failure');
                          addToast({ type: 'error', title: 'Test Scenario 5', description: res });
                        }}
                        className="p-1 text-[10px] bg-white border border-[#D8E2EA] rounded hover:bg-[#EAF0F5] text-left truncate"
                        title="Scenario 5: Server failure -> item remains Failed"
                      >
                        4. Test Failure
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
