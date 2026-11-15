'use client';

import React, { useState } from 'react';
import { usePreferences } from '../../context/PreferencesContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Sliders,
  Sun,
  Moon,
  Laptop,
  Search,
  RotateCcw,
  Check,
  LayoutDashboard,
  HardHat,
  Settings,
  ShieldAlert,
  Calendar,
  Layers,
  Eye,
  EyeOff,
  Bell,
  Sparkles,
} from 'lucide-react';

export function SettingsModal() {
  const {
    manager,
    engineer,
    shared,
    updateManager,
    updateEngineer,
    updateShared,
    resetToDefaults,
    isSettingsOpen,
    settingsTab,
    closeSettings,
    setSettingsTab,
  } = usePreferences();

  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isSettingsOpen) return null;

  const triggerSaveNotice = (msg: string) => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
    addToast({
      type: 'info',
      title: 'Preferences Updated',
      description: msg,
    });
  };

  const handleReset = () => {
    resetToDefaults();
    setTheme('system');
    triggerSaveNotice('Settings reset to system defaults.');
  };

  const CARD_OPTIONS = [
    { id: 'kpi-summary', label: 'Overall Project Health & Earned Value' },
    { id: 'urgent-actions', label: 'What Needs My Attention (Urgent / High)' },
    { id: 's-curve', label: 'Project S-Curve Performance Envelope' },
    { id: 'milestones', label: 'Critical Path Milestones Schedule' },
  ];

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeSettings}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#1A2B25] dark:text-[#F2F4E9]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-between gap-3 bg-[#F6F7F3] dark:bg-[#101815]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#006B61]/10 dark:bg-[#72C6AD]/15 text-[#006B61] dark:text-[#72C6AD] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 id="settings-title" className="text-base font-bold font-heading">
                Display & Workflow Preferences
              </h2>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5]">
                Customize your workspace layout, S-curve defaults, and touch controls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedFeedback && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#176B53] dark:text-[#72C6AD] bg-[#E4F1E9] dark:bg-[#0E2C26] px-2 py-0.5 rounded border border-[#BCE7D2] dark:border-[#1C5247] animate-in fade-in">
                <Check className="w-3 h-3" />
                <span>Saved locally</span>
              </span>
            )}
            <button
              onClick={closeSettings}
              className="p-1.5 text-[#52665D] hover:text-[#1A2B25] dark:text-[#B5C1B5] dark:hover:text-[#F2F4E9] rounded-md hover:bg-[#EAF0E9] dark:hover:bg-[#243832] transition-colors"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prototype Scope Note */}
        <div className="px-4 py-2 bg-[#F8EFDA] dark:bg-[#2E2211] border-b border-[#E5C185] dark:border-[#543A15] flex items-center justify-between text-[11px] text-[#825700] dark:text-[#E09A3A]">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>
              Preferences are stored locally in this browser for prototype demonstration.
            </span>
          </div>
          <span className="font-mono text-[10px] shrink-0 font-medium">Session-Local</span>
        </div>

        {/* Search & Tabs Toolbar */}
        <div className="p-3 border-b border-[#D9E2DA] dark:border-[#3A5146] flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between bg-white dark:bg-[#17221D]">
          {/* Tabs */}
          <div className="flex rounded-lg border border-[#D9E2DA] dark:border-[#3A5146] p-0.5 bg-[#F6F7F3] dark:bg-[#243832]">
            <button
              type="button"
              onClick={() => setSettingsTab('manager')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                settingsTab === 'manager'
                  ? 'bg-[#006B61] text-white shadow-xs'
                  : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Manager</span>
            </button>
            <button
              type="button"
              onClick={() => setSettingsTab('engineer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                settingsTab === 'engineer'
                  ? 'bg-[#006B61] text-white shadow-xs'
                  : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Engineer</span>
            </button>
            <button
              type="button"
              onClick={() => setSettingsTab('shared')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                settingsTab === 'shared'
                  ? 'bg-[#006B61] text-white shadow-xs'
                  : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>General & Theme</span>
            </button>
          </div>

          {/* Quick Search inside settings */}
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#52665D] dark:text-[#B5C1B5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-md outline-none text-[#1A2B25] dark:text-[#F2F4E9] placeholder-[#7B8798] focus:border-[#006B61] dark:focus:border-[#72C6AD]"
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* ========================================================= */}
          {/* MANAGER SETTINGS */}
          {/* ========================================================= */}
          {settingsTab === 'manager' && (
            <div className="space-y-5">
              {matchesSearch('Default Project and Dashboard View') && (
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9] font-heading">
                    Default Project & Dashboard View
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#52665D] dark:text-[#B5C1B5] block mb-1">
                        Primary Default Project
                      </label>
                      <select
                        value={manager.defaultProject}
                        onChange={(e) => {
                          updateManager({ defaultProject: e.target.value });
                          triggerSaveNotice(`Default project set to ${e.target.value}`);
                        }}
                        className="w-full px-3 py-2 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs font-medium text-[#1A2B25] dark:text-[#F2F4E9] focus:border-[#006B61]"
                      >
                        <option value="PRJ-OIL-2026-01">OIL-DUL-01: Duliajan Gas Processing</option>
                        <option value="PRJ-OIL-2026-02">OIL-NUM-02: Numaligarh Booster Station</option>
                        <option value="PRJ-OIL-2026-03">OIL-DIG-03: Digboi Refinery Tie-in</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#52665D] dark:text-[#B5C1B5] block mb-1">
                        Default Landing View
                      </label>
                      <select
                        value={manager.defaultDashboardView}
                        onChange={(e) => {
                          updateManager({ defaultDashboardView: e.target.value as any });
                          triggerSaveNotice(`Landing view set to ${e.target.value}`);
                        }}
                        className="w-full px-3 py-2 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs font-medium text-[#1A2B25] dark:text-[#F2F4E9] focus:border-[#006B61]"
                      >
                        <option value="health">Project Health & Earned Value</option>
                        <option value="milestones">Milestones & Critical Path</option>
                        <option value="critical-path">Zero-Float Driving Chain</option>
                        <option value="variance">Discipline Variance Ledger</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {matchesSearch('Pin and Reorder Dashboard Cards') && (
                <div className="space-y-2 pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146]">
                  <h3 className="font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9] font-heading">
                    Visible & Pinned Dashboard Cards
                  </h3>
                  <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                    Toggle card visibility on the executive dashboard to keep your view focused.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {CARD_OPTIONS.map((c) => {
                      const isPinned = manager.pinnedCards.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            const next = isPinned
                              ? manager.pinnedCards.filter((id) => id !== c.id)
                              : [...manager.pinnedCards, c.id];
                            updateManager({ pinnedCards: next });
                            triggerSaveNotice(`Card visibility updated.`);
                          }}
                          className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                            isPinned
                              ? 'bg-[#E4F1E9]/60 dark:bg-[#0E2C26]/60 border-[#BCE7D2] dark:border-[#1C5247]'
                              : 'bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146] opacity-60'
                          }`}
                        >
                          <span className="font-medium text-xs text-[#1A2B25] dark:text-[#F2F4E9]">
                            {c.label}
                          </span>
                          {isPinned ? (
                            <Eye className="w-4 h-4 text-[#176B53] dark:text-[#72C6AD]" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-[#52665D] dark:text-[#B5C1B5]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchesSearch('Preferred S-Curve Range & Series') && (
                <div className="space-y-2 pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146]">
                  <h3 className="font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9] font-heading">
                    S-Curve Chart Defaults
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#52665D] dark:text-[#B5C1B5] block mb-1">
                        Default Time Range Zoom
                      </label>
                      <div className="flex rounded-md border border-[#D9E2DA] dark:border-[#3A5146] p-0.5 bg-[#F6F7F3] dark:bg-[#243832]">
                        {(['1m', '3m', '6m', 'all'] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              updateManager({ sCurveRange: r });
                              triggerSaveNotice(`S-Curve range set to ${r.toUpperCase()}`);
                            }}
                            className={`flex-1 py-1 rounded text-xs font-mono font-bold uppercase transition-colors ${
                              manager.sCurveRange === r
                                ? 'bg-[#006B61] text-white shadow-2xs'
                                : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
                            }`}
                          >
                            {r === 'all' ? 'All' : r.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#52665D] dark:text-[#B5C1B5] block mb-1">
                        Review Queue Default Filter
                      </label>
                      <select
                        value={manager.reviewQueueFilterDefault}
                        onChange={(e) => {
                          updateManager({ reviewQueueFilterDefault: e.target.value as any });
                          triggerSaveNotice(`Review queue filter set to ${e.target.value}`);
                        }}
                        className="w-full px-3 py-2 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs font-medium text-[#1A2B25] dark:text-[#F2F4E9] focus:border-[#006B61]"
                      >
                        <option value="all">All Action Items</option>
                        <option value="high-confidence">High Confidence (≥90%)</option>
                        <option value="pending">Needs Review (70% - 89%)</option>
                        <option value="unmatched">Unmatched / Conflicts</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* ENGINEER SETTINGS */}
          {/* ========================================================= */}
          {settingsTab === 'engineer' && (
            <div className="space-y-5">
              {matchesSearch('Field Defaults and Work Package') && (
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9] font-heading">
                    Field Defaults & Workfront
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#52665D] dark:text-[#B5C1B5] block mb-1">
                        Default Assigned Activity
                      </label>
                      <select
                        value={engineer.defaultWorkPackage}
                        onChange={(e) => {
                          updateEngineer({ defaultWorkPackage: e.target.value });
                          triggerSaveNotice(`Default activity set to ${e.target.value}`);
                        }}
                        className="w-full px-3 py-2 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs font-mono font-medium text-[#1A2B25] dark:text-[#F2F4E9] focus:border-[#006B61]"
                      >
                        <option value="PIP-24-001">PIP-24-001 (Erect Line 24-XX Header)</option>
                        <option value="PIP-24-002">PIP-24-002 (Weld Line 24-XX Joints)</option>
                        <option value="CIV-11-001">CIV-11-001 (Compressor Foundation)</option>
                        <option value="ELE-11-032">ELE-11-032 (Substation Cable Tray)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#52665D] dark:text-[#B5C1B5] block mb-1">
                        Default Quantity Measurement Unit
                      </label>
                      <select
                        value={engineer.defaultUnit}
                        onChange={(e) => {
                          updateEngineer({ defaultUnit: e.target.value });
                          triggerSaveNotice(`Preferred unit set to ${e.target.value}`);
                        }}
                        className="w-full px-3 py-2 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs font-medium text-[#1A2B25] dark:text-[#F2F4E9] focus:border-[#006B61]"
                      >
                        <option value="spools">Spools (Piping)</option>
                        <option value="joints">Joints / Welds</option>
                        <option value="m³">Cubic Meters (m³ Concrete)</option>
                        <option value="meters">Linear Meters (Cables/Trays)</option>
                        <option value="tons">Metric Tons (Structural Steel)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {matchesSearch('Touch Ergonomics & Glove Mode') && (
                <div className="space-y-2 pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146]">
                  <h3 className="font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9] font-heading">
                    Touch Ergonomics (Field Mode)
                  </h3>
                  <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                    Enlarge button targets for tablet and mobile field use with gloves.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateEngineer({ touchTargetScale: 'standard' });
                        triggerSaveNotice('Standard 44px touch targets enabled.');
                      }}
                      className={`flex-1 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        engineer.touchTargetScale === 'standard'
                          ? 'bg-[#E4F1E9] dark:bg-[#0E2C26] border-[#006B61] dark:border-[#72C6AD] font-semibold'
                          : 'bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146]'
                      }`}
                    >
                      <div className="font-bold text-xs text-[#1A2B25] dark:text-[#F2F4E9]">
                        Standard Mobile (44px)
                      </div>
                      <div className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
                        WCAG 2.2 touch compliant
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateEngineer({ touchTargetScale: 'glove' });
                        triggerSaveNotice('Rugged 52px glove targets enabled.');
                      }}
                      className={`flex-1 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        engineer.touchTargetScale === 'glove'
                          ? 'bg-[#E4F1E9] dark:bg-[#0E2C26] border-[#006B61] dark:border-[#72C6AD] font-semibold'
                          : 'bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146]'
                      }`}
                    >
                      <div className="font-bold text-xs text-[#1A2B25] dark:text-[#F2F4E9]">
                        Glove / Rugged Mode (52px+)
                      </div>
                      <div className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
                        Enlarged steppers & quick chips
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {matchesSearch('Reminders and Date format') && (
                <div className="space-y-2 pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-[#1A2B25] dark:text-[#F2F4E9]">
                        Daily Progress Report (DPR) End-of-Shift Prompt
                      </span>
                      <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                        Show draft reminder pill when unsubmitted quantities exist at shift end.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={engineer.draftReminder}
                      onChange={(e) => {
                        updateEngineer({ draftReminder: e.target.checked });
                        triggerSaveNotice(e.target.checked ? 'Draft reminders active.' : 'Draft reminders silenced.');
                      }}
                      className="w-4 h-4 rounded text-[#006B61] focus:ring-[#006B61] cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* SHARED & THEME SETTINGS */}
          {/* ========================================================= */}
          {settingsTab === 'shared' && (
            <div className="space-y-5">
              {matchesSearch('Theme Mode Light Dark System') && (
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9] font-heading">
                    Color Theme Mode
                  </h3>
                  <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                    Select appearance mode. Light mode is the default; dark mode uses considered dark surfaces.
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTheme('light');
                        triggerSaveNotice('Light theme activated.');
                      }}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${
                        theme === 'light'
                          ? 'bg-[#006B61]/10 border-[#006B61] text-[#006B61] font-bold'
                          : 'bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5]'
                      }`}
                    >
                      <Sun className="w-5 h-5 text-[#006B61]" />
                      <span className="text-xs">Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTheme('dark');
                        triggerSaveNotice('Dark theme activated.');
                      }}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-[#72C6AD]/20 border-[#72C6AD] text-[#72C6AD] font-bold'
                          : 'bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5]'
                      }`}
                    >
                      <Moon className="w-5 h-5 text-[#72C6AD]" />
                      <span className="text-xs">Dark</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTheme('system');
                        triggerSaveNotice('Follow system theme activated.');
                      }}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${
                        theme === 'system'
                          ? 'bg-[#006B61]/10 dark:bg-[#72C6AD]/20 border-[#006B61] dark:border-[#72C6AD] text-[#006B61] dark:text-[#72C6AD] font-bold'
                          : 'bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5]'
                      }`}
                    >
                      <Laptop className="w-5 h-5 text-[#52665D] dark:text-[#B5C1B5]" />
                      <span className="text-xs">Follow System</span>
                    </button>
                  </div>
                </div>
              )}

              {matchesSearch('Display Density Comfortable Compact') && (
                <div className="space-y-2 pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146]">
                  <h3 className="font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9] font-heading">
                    Table & List Display Density
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateShared({ density: 'comfortable' });
                        triggerSaveNotice('Comfortable density applied.');
                      }}
                      className={`flex-1 p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        shared.density === 'comfortable'
                          ? 'bg-[#E4F1E9] dark:bg-[#0E2C26] border-[#006B61] dark:border-[#72C6AD] font-semibold'
                          : 'bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146]'
                      }`}
                    >
                      <span className="font-bold text-xs text-[#1A2B25] dark:text-[#F2F4E9] block">
                        Comfortable
                      </span>
                      <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                        Standard row height & spacing
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateShared({ density: 'compact' });
                        triggerSaveNotice('Compact density applied.');
                      }}
                      className={`flex-1 p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        shared.density === 'compact'
                          ? 'bg-[#E4F1E9] dark:bg-[#0E2C26] border-[#006B61] dark:border-[#72C6AD] font-semibold'
                          : 'bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146]'
                      }`}
                    >
                      <span className="font-bold text-xs text-[#1A2B25] dark:text-[#F2F4E9] block">
                        Compact (Dense Tables)
                      </span>
                      <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                        Reduced padding for data analysis
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {matchesSearch('Accessibility Focus and High Contrast') && (
                <div className="space-y-2 pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146]">
                  <h3 className="font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9] font-heading">
                    Accessibility & Vision
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="font-semibold text-xs text-[#1A2B25] dark:text-[#F2F4E9] block">
                          Always Pair Chart Glyphs with Colors
                        </span>
                        <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                          Ensures status and series are identifiable without relying on color perception.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={shared.accessibleChartLabels}
                        onChange={(e) => {
                          updateShared({ accessibleChartLabels: e.target.checked });
                          triggerSaveNotice('Accessible chart labels updated.');
                        }}
                        className="w-4 h-4 rounded text-[#006B61] focus:ring-[#006B61]"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#D9E2DA]/60 dark:border-[#3A5146]/60">
                      <div>
                        <span className="font-semibold text-xs text-[#1A2B25] dark:text-[#F2F4E9] block">
                          Enhanced Keyboard Focus Rings
                        </span>
                        <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                          Shows prominent 3px focus outline during tab navigation.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={shared.highContrastFocus}
                        onChange={(e) => {
                          updateShared({ highContrastFocus: e.target.checked });
                          triggerSaveNotice('Focus ring contrast updated.');
                        }}
                        className="w-4 h-4 rounded text-[#006B61] focus:ring-[#006B61]"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-[#D9E2DA] dark:border-[#3A5146] bg-[#F6F7F3] dark:bg-[#101815] flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#A43B36] dark:text-[#FF9E94] hover:bg-[#F6E4E1] dark:hover:bg-[#331517] rounded-md transition-colors cursor-pointer border border-transparent hover:border-[#DCABA7] dark:hover:border-[#5C2326]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to defaults</span>
          </button>

          <button
            type="button"
            onClick={closeSettings}
            className="px-4 py-1.5 bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:hover:bg-[#5CB69C] text-white dark:text-[#0B2822] rounded-lg font-bold transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
