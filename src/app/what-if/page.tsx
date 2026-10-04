'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { AppShell } from '../../components/shell/AppShell';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorState } from '../../components/shared/ErrorState';
import { ProcessingState } from '../../components/shared/ProcessingState';
import { Modal } from '../../components/shared/Modal';
import { Drawer } from '../../components/shared/Drawer';
import { ProgressBar } from '../../components/shared/ProgressBar';
import {
  SIMULATION_ACTIVITIES,
  DEFAULT_SAVED_SCENARIOS,
  SimulatorActivity,
  SimulationScenario,
  SimulationResult,
  SimulatedActivityShift,
  executeWhatIfSimulation,
  formatFriendlyDate,
  addDaysToDateString,
} from '../../lib/domain/whatIfEngine';
import {
  Sliders,
  Play,
  RotateCcw,
  Save,
  GitCompare,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  Search,
  Filter,
  Layers,
  Activity,
  Lock,
  Sparkles,
  Info,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Folder,
  ShieldCheck,
  Zap,
  BookmarkCheck,
  Trash2,
  ExternalLink,
  HelpCircle,
  BarChart3,
  Check,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function WhatIfSimulatorPage() {
  const { activeProject } = useApp();
  const { addToast } = useToast();

  // State Management
  const [selectedActivityId, setSelectedActivityId] = useState<string>('PIP-24-001');
  const [delayDays, setDelayDays] = useState<number>(7);
  const [optionalDateChange, setOptionalDateChange] = useState<string>('');
  const [scenarioName, setScenarioName] = useState<string>('Monsoon Heavy Rain Slip on HP Gas Header');
  const [scenarioDescription, setScenarioDescription] = useState<string>(
    'Testing impact of 7-day weather suspension on downstream pipeline pre-commissioning.'
  );

  // Scenarios Vault
  const [savedScenarios, setSavedScenarios] = useState<SimulationScenario[]>(DEFAULT_SAVED_SCENARIOS);
  const [activeTab, setActiveTab] = useState<'simulator' | 'saved' | 'comparison'>('simulator');

  // Simulation Execution State
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calculationStep, setCalculationStep] = useState<string>('Initializing...');
  const [calculationProgress, setCalculationProgress] = useState<number>(0);
  const [hasRunInitialSim, setHasRunInitialSim] = useState<boolean>(false);

  // Error Simulation State (to fulfill "include error state")
  const [simulateError, setSimulateError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Modals & Drawers
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [selectedScenarioForComparison, setSelectedScenarioForComparison] = useState<SimulationScenario | null>(null);
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<SimulatedActivityShift | null>(null);

  // Selected Activity Object
  const selectedActivity = useMemo(() => {
    return (
      SIMULATION_ACTIVITIES.find((a) => a.id === selectedActivityId) ||
      SIMULATION_ACTIVITIES[0]
    );
  }, [selectedActivityId]);

  // Sync optionalDateChange when activity or delayDays change
  useEffect(() => {
    if (selectedActivity) {
      const calculatedDate = addDaysToDateString(selectedActivity.plannedFinish, delayDays);
      setOptionalDateChange(calculatedDate);
    }
  }, [selectedActivityId, delayDays]);

  // Run simulation on initial mount with default scenario
  useEffect(() => {
    if (!hasRunInitialSim) {
      handleRunScenario(false);
      setHasRunInitialSim(true);
    }
  }, []);

  // Handle Date input change (bidirectional sync with delayDays)
  const handleDateChange = (newDateStr: string) => {
    setOptionalDateChange(newDateStr);
    if (selectedActivity && newDateStr) {
      const origTime = new Date(selectedActivity.plannedFinish).getTime();
      const newTime = new Date(newDateStr).getTime();
      const diff = Math.round((newTime - origTime) / (1000 * 60 * 60 * 24));
      setDelayDays(diff);
    }
  };

  // Run Simulation Handler with animated calculation state
  const handleRunScenario = (animate: boolean = true) => {
    if (simulateError) {
      setErrorMessage('Critical CPM Graph Loop Detected: Predecessor cycle discovered during topological sort.');
      return;
    }

    if (!scenarioName.trim()) {
      addToast({
        type: 'warning',
        title: 'Scenario Name Required',
        description: 'Please provide a clear title for this simulation scenario before running.',
      });
      return;
    }

    if (animate) {
      setIsCalculating(true);
      setCalculationProgress(10);
      setCalculationStep('Loading project activity network topology...');

      setTimeout(() => {
        setCalculationProgress(35);
        setCalculationStep(`Traversing forward pass from source ${selectedActivityId}...`);
      }, 150);

      setTimeout(() => {
        setCalculationProgress(70);
        setCalculationStep('Evaluating float absorption and dependency constraints (FS+0d)...');
      }, 350);

      setTimeout(() => {
        setCalculationProgress(95);
        setCalculationStep('Forecasting downstream milestone impact & commercial finish...');
      }, 500);

      setTimeout(() => {
        try {
          const res = executeWhatIfSimulation(
            scenarioName,
            selectedActivityId,
            delayDays,
            optionalDateChange
          );
          setSimulationResult(res);
          setIsCalculating(false);
          addToast({
            type: res.criticalPathPenetrated ? 'warning' : 'info',
            title: 'Simulation Computed',
            description: res.criticalPathPenetrated
              ? `Critical path penetrated: Commercial completion slips by +${res.differenceDays} days.`
              : `Scenario executed: ${res.differenceDays === 0 ? 'Float buffer absorbed, zero slip on completion.' : `Project completion shifted by ${res.differenceDays} days.`}`,
          });
        } catch (err: any) {
          setIsCalculating(false);
          setSimulateError(true);
          setErrorMessage(err.message || 'Failed to compute CPM simulation.');
        }
      }, 650);
    } else {
      try {
        const res = executeWhatIfSimulation(
          scenarioName,
          selectedActivityId,
          delayDays,
          optionalDateChange
        );
        setSimulationResult(res);
      } catch (err: any) {
        setSimulateError(true);
        setErrorMessage(err.message || 'Failed to compute CPM simulation.');
      }
    }
  };

  // Action: Create Scenario (Reset to blank/new)
  const handleCreateNewScenario = () => {
    setSelectedActivityId('PIP-24-001');
    setDelayDays(3);
    setScenarioName('New Scenario ' + (savedScenarios.length + 1));
    setScenarioDescription('Custom what-if simulation scenario');
    setSimulationResult(null);
    setSimulateError(false);
    addToast({
      type: 'info',
      title: 'New Scenario Canvas Created',
      description: 'Configure source activity and delay parameters to run your simulation.',
    });
  };

  // Action: Save Scenario
  const handleSaveScenario = () => {
    if (!simulationResult) {
      addToast({
        type: 'warning',
        title: 'Run Simulation First',
        description: 'You must run the simulation before saving the scenario to your vault.',
      });
      return;
    }

    const newSaved: SimulationScenario = {
      id: `SCN-${Date.now().toString().slice(-4)}`,
      name: scenarioName,
      sourceActivityId: selectedActivityId,
      delayDays: delayDays,
      optionalDateChange: optionalDateChange,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      createdBy: 'Site Engineer (Session)',
      description: scenarioDescription || 'Simulated what-if scenario',
      tags: [
        selectedActivity.discipline,
        simulationResult.criticalPathPenetrated ? 'Critical Path' : 'Float Absorbed',
        delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`,
      ],
    };

    setSavedScenarios([newSaved, ...savedScenarios]);
    setIsSaveModalOpen(false);
    addToast({
      type: 'success',
      title: 'Scenario Saved to Vault',
      description: `Scenario "${scenarioName}" has been safely stored for future comparison.`,
    });
  };

  // Action: Load Saved Scenario
  const handleLoadScenario = (sc: SimulationScenario) => {
    setSelectedActivityId(sc.sourceActivityId);
    setDelayDays(sc.delayDays);
    setScenarioName(sc.name);
    setScenarioDescription(sc.description || '');
    if (sc.optionalDateChange) {
      setOptionalDateChange(sc.optionalDateChange);
    }
    setActiveTab('simulator');
    setSimulateError(false);

    // Run simulation for loaded scenario
    setTimeout(() => {
      const res = executeWhatIfSimulation(sc.name, sc.sourceActivityId, sc.delayDays, sc.optionalDateChange);
      setSimulationResult(res);
      addToast({
        type: 'info',
        title: `Loaded: ${sc.name}`,
        description: `Source activity ${sc.sourceActivityId} configured with ${sc.delayDays >= 0 ? `+${sc.delayDays}` : sc.delayDays} days delay.`,
      });
    }, 50);
  };

  // Action: Delete Saved Scenario
  const handleDeleteScenario = (id: string, name: string) => {
    setSavedScenarios(savedScenarios.filter((s) => s.id !== id));
    addToast({
      type: 'info',
      title: 'Scenario Removed',
      description: `Scenario "${name}" removed from vault.`,
    });
  };

  // Action: Reset
  const handleReset = () => {
    setSelectedActivityId('PIP-24-001');
    setDelayDays(0);
    setScenarioName('Baseline Schedule Rev 3.2 (No Delay)');
    setScenarioDescription('Baseline schedule state with 0 days variance applied.');
    setSimulateError(false);
    setErrorMessage('');
    const res = executeWhatIfSimulation('Baseline Schedule Rev 3.2', 'PIP-24-001', 0);
    setSimulationResult(res);
    addToast({
      type: 'info',
      title: 'Parameters Reset to Baseline',
      description: 'Zero schedule shift applied. All activities set to original planned dates.',
    });
  };

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Schedule Execution' },
    { label: 'What-if Simulator', current: true },
  ];

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            HEADER & SANDBOX NOTICE
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]/60">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <Sliders className="w-3.5 h-3.5" />
                  Scenario Engine
                </span>

                {/* PROMINENT MANDATORY SIMULATION LABEL */}
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#EBF2F7] text-[#176B87] border border-[#B3CBE0] shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#176B87] animate-pulse" />
                  SIMULATION
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                  <Lock className="w-3 h-3 text-[#2E7D5B]" />
                  Master Schedule Baseline Locked (Read-Only)
                </span>
              </div>

              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                What-if Simulator
              </h1>
              <p className="text-xs text-[#596579] mt-0.5 max-w-3xl">
                Test predictive schedule scenarios and downstream Critical Path impact without modifying the actual project schedule.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCreateNewScenario}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F0F2F5] rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#176B87]" />
                <span>Create Scenario</span>
              </button>

              <button
                onClick={() => setIsSaveModalOpen(true)}
                disabled={!simulationResult}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F0F2F5] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5 text-[#596579]" />
                <span>Save Scenario</span>
              </button>

              <button
                onClick={() => setIsCompareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F0F2F5] rounded-lg transition-colors shadow-xs"
              >
                <GitCompare className="w-3.5 h-3.5 text-[#176B87]" />
                <span>Compare Scenario</span>
              </button>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#596579] bg-white border border-[#D9DEE5] hover:bg-[#F0F2F5] rounded-lg transition-colors"
                title="Reset all inputs to baseline"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#596579]" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* ISOLATED SANDBOX NOTICE BANNER */}
          <div className="mt-4 p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5 text-xs text-[#596579]">
              <div className="w-7 h-7 rounded-md bg-white border border-[#D9DEE5] flex items-center justify-center text-[#176B87] font-bold shrink-0">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-[#172033]">
                  Isolated Non-Destructive Sandbox:
                </span>{' '}
                Results generated here are strictly experimental simulations. They will never alter or overwrite the actual master schedule baseline (Rev 3.2 P6 XML).
              </div>
            </div>

            {/* Quick Tab Switcher */}
            <div className="flex items-center bg-white border border-[#D9DEE5] rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  activeTab === 'simulator'
                    ? 'bg-[#176B87] text-white font-semibold'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                Scenario Canvas
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'saved'
                    ? 'bg-[#176B87] text-white font-semibold'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                <span>Saved Vault</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#E8EBF0] text-[#172033] font-mono">
                  {savedScenarios.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ERROR STATE DISPLAY (if triggered) */}
        {simulateError && (
          <ErrorState
            title="Scenario Computation Error"
            message={errorMessage || 'An unexpected condition prevented the CPM forward pass from completing.'}
            code="ERR_PLNEX_SIM_TOPOLOGY"
            onRetry={() => {
              setSimulateError(false);
              handleRunScenario(true);
            }}
          />
        )}

        {/* =========================================================================
            TAB 1: SIMULATOR CANVAS
            ========================================================================= */}
        {activeTab === 'simulator' && !simulateError && (
          <div className="space-y-6">
            {/* =========================================================================
                SCENARIO BUILDER:
                - Source Activity
                - Delay / Change
                - Affected Dependency Chain
                - Inputs: select activity, delay days, optional date change, scenario name
                - Primary Action: Run Scenario
                ========================================================================= */}
            <div className="bg-white border border-[#D9DEE5] rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-[#D9DEE5] bg-[#F7F8FA] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#176B87]" />
                  <h2 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                    Scenario Builder
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#596579]">
                  <span>Status:</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-[#D9DEE5] font-semibold text-[#176B87]">
                    Ready to Simulate
                  </span>
                </div>
              </div>

              <div className="p-5 md:p-6 space-y-6">
                {/* Top Row: Scenario Name & Description */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center justify-between">
                      <span>Scenario Name *</span>
                      <span className="text-[11px] font-normal text-[#8A94A6]">Identifies this run</span>
                    </label>
                    <input
                      type="text"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      placeholder="e.g. Monsoon Heavy Rain Slip on HP Gas Header"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-medium outline-none focus:border-[#176B87] focus:ring-1 focus:ring-[#176B87]"
                    />
                    {/* Quick Preset Scenario Chips */}
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap text-[11px]">
                      <span className="text-[#8A94A6]">Quick presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setScenarioName('Monsoon Heavy Rain Slip (+7d)');
                          setSelectedActivityId('PIP-24-001');
                          setDelayDays(7);
                        }}
                        className="px-2 py-0.5 rounded bg-[#F0F2F5] hover:bg-[#E8EBF0] text-[#172033] text-[10px] font-medium transition-colors"
                      >
                        Monsoon Surge (+7d)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScenarioName('Crane Mobilization Breakdown (+4d)');
                          setSelectedActivityId('CIV-11-001');
                          setDelayDays(4);
                        }}
                        className="px-2 py-0.5 rounded bg-[#F0F2F5] hover:bg-[#E8EBF0] text-[#172033] text-[10px] font-medium transition-colors"
                      >
                        Crane Breakdown (+4d)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScenarioName('Double-Shift Welding Crash Acceleration (-3d)');
                          setSelectedActivityId('PIP-24-002');
                          setDelayDays(-3);
                        }}
                        className="px-2 py-0.5 rounded bg-[#EDF7F2] hover:bg-[#D5EEDB] text-[#2E7D5B] text-[10px] font-bold transition-colors"
                      >
                        Double-Shift Acceleration (-3d)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033] uppercase tracking-wider block">
                      Scenario Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={scenarioDescription}
                      onChange={(e) => setScenarioDescription(e.target.value)}
                      placeholder="Engineering justification or assumptions..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87] resize-none"
                    />
                  </div>
                </div>

                <div className="border-t border-[#D9DEE5]/60 pt-5">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT (Cols 1-5): SOURCE ACTIVITY SELECTOR & METADATA */}
                    <div className="lg:col-span-5 space-y-4">
                      <div>
                        <label className="text-xs font-bold text-[#172033] uppercase tracking-wider block mb-1.5">
                          1. Select Source Activity *
                        </label>
                        <select
                          value={selectedActivityId}
                          onChange={(e) => setSelectedActivityId(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs bg-white border border-[#D9DEE5] rounded-lg font-medium text-[#172033] outline-none focus:border-[#176B87] shadow-xs"
                        >
                          {SIMULATION_ACTIVITIES.map((act) => (
                            <option key={act.id} value={act.id}>
                              {act.id} — {act.name} ({act.discipline})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Source Activity Card */}
                      <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#D9DEE5] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#176B87]">
                              {selectedActivity.id}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-[#D9DEE5] text-[#596579]">
                              {selectedActivity.discipline}
                            </span>
                          </div>
                          {selectedActivity.isCritical ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                              Critical Path (0d Float)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                              Float Available ({selectedActivity.totalFloat}d Buffer)
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-[#172033]">{selectedActivity.name}</h3>
                          <p className="text-[11px] text-[#596579] mt-0.5 line-clamp-2">
                            {selectedActivity.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#D9DEE5]/80">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">
                              Planned Start
                            </span>
                            <span className="font-mono text-[#172033]">
                              {formatFriendlyDate(selectedActivity.plannedStart)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">
                              Planned Finish
                            </span>
                            <span className="font-mono font-semibold text-[#172033]">
                              {formatFriendlyDate(selectedActivity.plannedFinish)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">
                              Area / WBS
                            </span>
                            <span className="text-[#596579] truncate block">
                              {selectedActivity.area} ({selectedActivity.wbs})
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">
                              Assigned Engineer
                            </span>
                            <span className="text-[#596579] truncate block">
                              {selectedActivity.assignedEngineer}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CENTER (Cols 6-8): DELAY / CHANGE CONTROLS */}
                    <div className="lg:col-span-4 space-y-4">
                      <div>
                        <label className="text-xs font-bold text-[#172033] uppercase tracking-wider block mb-1.5">
                          2. Delay / Schedule Change *
                        </label>

                        {/* Numeric Stepper + Slider */}
                        <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#D9DEE5] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#172033]">Delay Days</span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${
                                  delayDays > 0
                                    ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                                    : delayDays < 0
                                    ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                                    : 'bg-white text-[#596579] border border-[#D9DEE5]'
                                }`}
                              >
                                {delayDays > 0 ? `+${delayDays} days delay` : delayDays < 0 ? `${delayDays} days acceleration` : '0 days (No change)'}
                              </span>
                            </div>
                          </div>

                          {/* Interactive Range Slider */}
                          <div className="space-y-1">
                            <input
                              type="range"
                              min="-14"
                              max="45"
                              value={delayDays}
                              onChange={(e) => setDelayDays(parseInt(e.target.value, 10))}
                              className="w-full accent-[#176B87] cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-[#8A94A6] font-mono">
                              <span>-14d (Crashing)</span>
                              <span>0d (Baseline)</span>
                              <span>+45d (Major Slip)</span>
                            </div>
                          </div>

                          {/* Quick Step Buttons */}
                          <div className="flex items-center gap-1 pt-1 flex-wrap">
                            {[-3, 0, 1, 3, 5, 7, 14, 21].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setDelayDays(d)}
                                className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${
                                  delayDays === d
                                    ? 'bg-[#176B87] text-white shadow-xs'
                                    : 'bg-white border border-[#D9DEE5] text-[#596579] hover:bg-[#F0F2F5]'
                                }`}
                              >
                                {d > 0 ? `+${d}d` : `${d}d`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Optional Date Change */}
                      <div>
                        <label className="text-xs font-bold text-[#172033] uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                          <span>Optional Simulated Date Override</span>
                          <span className="text-[10px] font-normal text-[#8A94A6]">Auto-syncs with days</span>
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={optionalDateChange}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-mono font-medium outline-none focus:border-[#176B87]"
                          />
                        </div>
                        <p className="text-[11px] text-[#8A94A6] mt-1">
                          Baseline Planned Finish was <span className="font-semibold text-[#172033]">{formatFriendlyDate(selectedActivity.plannedFinish)}</span>.
                        </p>
                      </div>
                    </div>

                    {/* RIGHT (Cols 9-12): RUN CTA & SIMULATION SUMMARY */}
                    <div className="lg:col-span-3 flex flex-col justify-between p-4 rounded-xl bg-[#EDF5F8] border border-[#B3CBE0] space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-[#176B87]" />
                          <h3 className="text-xs font-bold text-[#176B87] uppercase tracking-wider">
                            Execute Simulation
                          </h3>
                        </div>
                        <p className="text-xs text-[#596579] leading-relaxed">
                          Computes forward CPM network passes, recalculates total float absorption, and tests downstream key milestone dates.
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="p-3 rounded-lg bg-white/80 border border-[#B3CBE0] text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[#8A94A6]">Source Activity:</span>
                            <span className="font-mono font-bold text-[#172033]">{selectedActivity.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#8A94A6]">Simulated Delta:</span>
                            <span className="font-mono font-bold text-[#176B87]">
                              {delayDays >= 0 ? `+${delayDays} days` : `${delayDays} days`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#8A94A6]">New Finish Date:</span>
                            <span className="font-mono font-bold text-[#172033]">
                              {formatFriendlyDate(optionalDateChange)}
                            </span>
                          </div>
                        </div>

                        {/* PRIMARY ACTION: RUN SCENARIO */}
                        <button
                          type="button"
                          onClick={() => handleRunScenario(true)}
                          disabled={isCalculating}
                          className="w-full py-3 px-4 bg-[#176B87] hover:bg-[#135A72] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Run Scenario</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* =========================================================================
                    AFFECTED DEPENDENCY CHAIN PREVIEW (Before & After CPM Nodes)
                    ========================================================================= */}
                <div className="border-t border-[#D9DEE5]/60 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#176B87]" />
                      <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                        Affected Dependency Chain
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-[#8A94A6]">
                      CPM Logic: Finish-to-Start (FS +0d Lag)
                    </span>
                  </div>

                  {/* Horizontal Chain Visualizer */}
                  <div className="overflow-x-auto pb-2">
                    <div className="flex items-center gap-3 min-w-[700px]">
                      {simulationResult?.dependencyChain.map((node, idx) => {
                        const isSource = node.id === selectedActivityId;
                        const isLast = idx === simulationResult.dependencyChain.length - 1;

                        return (
                          <React.Fragment key={node.id}>
                            <div
                              className={`p-3 rounded-lg border flex-1 min-w-[190px] text-xs transition-all ${
                                isSource
                                  ? 'bg-[#EDF5F8] border-[#176B87] shadow-xs ring-1 ring-[#176B87]'
                                  : node.shiftDays > 0
                                  ? 'bg-[#FBEFEE]/40 border-[#E4B0AA]'
                                  : 'bg-[#F7F8FA] border-[#D9DEE5]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono font-bold text-[11px] text-[#176B87]">
                                  {node.id}
                                </span>
                                {isSource ? (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-[#176B87] text-white">
                                    Trigger
                                  </span>
                                ) : node.shiftDays > 0 ? (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                                    +{node.shiftDays}d Slip
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                                    On Target
                                  </span>
                                )}
                              </div>

                              <p className="font-semibold text-[#172033] text-[11px] truncate mb-2">
                                {node.name}
                              </p>

                              <div className="space-y-0.5 text-[10px] font-mono pt-1.5 border-t border-[#D9DEE5]/60">
                                <div className="flex justify-between text-[#8A94A6]">
                                  <span>Current:</span>
                                  <span>{formatFriendlyDate(node.currentFinish)}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                  <span className="text-[#176B87]">Simulated:</span>
                                  <span className={node.shiftDays > 0 ? 'text-[#B5473C]' : 'text-[#172033]'}>
                                    {formatFriendlyDate(node.simulatedFinish)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {!isLast && (
                              <div className="flex flex-col items-center justify-center shrink-0 text-[#8A94A6]">
                                <span className="text-[9px] font-mono font-bold text-[#596579]">FS +0d</span>
                                <ArrowRight className="w-4 h-4 text-[#176B87]" />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================================
                CALCULATION STATE (During Run Scenario)
                ========================================================================= */}
            {isCalculating && (
              <ProcessingState
                title="Simulating Critical Path Method Scenarios"
                currentStep={calculationStep}
                progressPercent={calculationProgress}
                notes="Traversing predecessor-successor graph. Calculating float consumption and milestone exposure in isolated sandbox."
              />
            )}

            {/* =========================================================================
                RESULTS SECTION:
                - Current Finish
                - Simulated Finish
                - Difference
                - Affected activities
                - Impact Summary
                ========================================================================= */}
            {!isCalculating && simulationResult && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* 1. TOP RESULT METRICS: Current Finish / Simulated Finish / Difference */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Current Finish */}
                  <div className="bg-white border border-[#D9DEE5] rounded-xl p-4 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block mb-1">
                      Current Finish (Baseline)
                    </span>
                    <div className="text-xl font-bold font-mono text-[#172033]">
                      {formatFriendlyDate(simulationResult.currentProjectFinish)}
                    </div>
                    <span className="text-xs text-[#596579] mt-1 block">
                      Target Commercial Operation Date (Rev 3.2)
                    </span>
                  </div>

                  {/* Simulated Finish */}
                  <div className="bg-white border border-[#D9DEE5] rounded-xl p-4 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-[#176B87] tracking-wider block mb-1">
                      Simulated Finish (Sandbox)
                    </span>
                    <div
                      className={`text-xl font-bold font-mono ${
                        simulationResult.differenceDays > 0
                          ? 'text-[#B5473C]'
                          : simulationResult.differenceDays < 0
                          ? 'text-[#2E7D5B]'
                          : 'text-[#172033]'
                      }`}
                    >
                      {formatFriendlyDate(simulationResult.simulatedProjectFinish)}
                    </div>
                    <span className="text-xs text-[#596579] mt-1 block">
                      Projected Completion under this scenario
                    </span>
                  </div>

                  {/* Difference */}
                  <div
                    className={`rounded-xl p-4 border shadow-xs ${
                      simulationResult.differenceDays > 0
                        ? 'bg-[#FBEFEE] border-[#E4B0AA]'
                        : simulationResult.differenceDays < 0
                        ? 'bg-[#EDF7F2] border-[#B8DCC9]'
                        : 'bg-white border-[#D9DEE5]'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block mb-1">
                      Difference
                    </span>
                    <div
                      className={`text-xl font-black font-mono ${
                        simulationResult.differenceDays > 0
                          ? 'text-[#B5473C]'
                          : simulationResult.differenceDays < 0
                          ? 'text-[#2E7D5B]'
                          : 'text-[#172033]'
                      }`}
                    >
                      {simulationResult.differenceDays > 0
                        ? `+${simulationResult.differenceDays} Days Slip`
                        : simulationResult.differenceDays < 0
                        ? `${simulationResult.differenceDays} Days Ahead`
                        : '0 Days (No Slip)'}
                    </div>
                    <span className="text-xs font-medium text-[#596579] mt-1 block">
                      {simulationResult.criticalPathPenetrated
                        ? 'Critical path penetrated 1:1'
                        : simulationResult.differenceDays === 0
                        ? 'Absorbed by available float buffer'
                        : 'Critical path compressed'}
                    </span>
                  </div>

                  {/* Downstream Impact Scope */}
                  <div className="bg-white border border-[#D9DEE5] rounded-xl p-4 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block mb-1">
                      Affected Activities
                    </span>
                    <div className="text-xl font-bold font-mono text-[#176B87]">
                      {simulationResult.affectedActivitiesCount} Successors
                    </div>
                    <span className="text-xs text-[#596579] mt-1 block">
                      {simulationResult.totalFloatConsumed > 0
                        ? `${simulationResult.totalFloatConsumed}d total float consumed`
                        : 'Downstream dependency impact'}
                    </span>
                  </div>
                </div>

                {/* 2. IMPACT SUMMARY: Downstream Schedule Effect */}
                <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 md:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#D9DEE5]/60 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#176B87]" />
                      <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                        Impact Summary: Downstream Schedule Effect
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                      Deterministic CPM Propagation
                    </span>
                  </div>

                  {/* Headline & Narrative */}
                  <div
                    className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
                      simulationResult.differenceDays > 0
                        ? 'bg-[#FBEFEE]/50 border-[#E4B0AA]'
                        : simulationResult.differenceDays < 0
                        ? 'bg-[#EDF7F2]/50 border-[#B8DCC9]'
                        : 'bg-[#F7F8FA] border-[#D9DEE5]'
                    }`}
                  >
                    <div className="font-bold text-sm text-[#172033]">
                      {simulationResult.impactSummary.headline}
                    </div>
                    <p className="text-[#596579]">
                      {simulationResult.impactSummary.downstreamNarrative}
                    </p>
                    <div className="pt-2 border-t border-[#D9DEE5]/60 flex items-center gap-4 text-[11px]">
                      <div>
                        <span className="font-bold text-[#172033]">Critical Path Assessment:</span>{' '}
                        <span className="text-[#596579]">{simulationResult.impactSummary.criticalPathAssessment}</span>
                      </div>
                    </div>
                  </div>

                  {/* Milestone Impact Matrix */}
                  <div>
                    <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-2.5">
                      Key Milestone Exposure
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {simulationResult.milestones.map((ms) => (
                        <div
                          key={ms.id}
                          className="p-3.5 rounded-lg border bg-[#F7F8FA] border-[#D9DEE5] text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-[#176B87]">
                              {ms.id}
                            </span>
                            <span
                              className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                                ms.status === 'Critical Slip'
                                  ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                                  : ms.status === 'Accelerated'
                                  ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                                  : 'bg-[#F0F2F5] text-[#596579] border border-[#D9DEE5]'
                              }`}
                            >
                              {ms.status}
                            </span>
                          </div>

                          <h5 className="font-semibold text-[#172033] text-xs line-clamp-1">{ms.name}</h5>

                          <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-[#D9DEE5]/60 text-[11px] font-mono">
                            <div>
                              <span className="text-[10px] text-[#8A94A6] uppercase block">Baseline</span>
                              <span>{formatFriendlyDate(ms.currentDate)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#8A94A6] uppercase block">Simulated</span>
                              <span className={ms.shiftDays > 0 ? 'text-[#B5473C] font-bold' : 'text-[#172033]'}>
                                {formatFriendlyDate(ms.simulatedDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Engineering Mitigation Strategies */}
                  {simulationResult.impactSummary.mitigationSuggestions.length > 0 && (
                    <div className="p-4 rounded-xl bg-[#F0F4F8] border border-[#D9DEE5] text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-[#172033]">
                        <ShieldCheck className="w-4 h-4 text-[#176B87]" />
                        <span>Recommended Engineering Mitigation Strategies</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[#596579] text-xs">
                        {simulationResult.impactSummary.mitigationSuggestions.map((sug, i) => (
                          <li key={i}>{sug}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 3. AFFECTED ACTIVITIES TABLE:
                    - Activity
                    - Current Date
                    - Simulated Date
                    - Shift
                */}
                <div className="bg-white border border-[#D9DEE5] rounded-xl shadow-xs overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#D9DEE5] bg-[#F7F8FA] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                        Affected Activities Schedule
                      </h3>
                      <p className="text-xs text-[#596579] mt-0.5">
                        Downstream schedule shifts derived from Critical Path predecessor-successor graph.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-[#596579]">
                      Total: {simulationResult.affectedActivities.length} activities
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider">
                          <th className="py-3 px-4">Activity</th>
                          <th className="py-3 px-4">Discipline / Area</th>
                          <th className="py-3 px-4">Current Date</th>
                          <th className="py-3 px-4">Simulated Date</th>
                          <th className="py-3 px-4">Shift</th>
                          <th className="py-3 px-4">CPM Impact</th>
                          <th className="py-3 px-4 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8EBF0]">
                        {simulationResult.affectedActivities.map((act) => (
                          <tr
                            key={act.activityId}
                            onClick={() => setSelectedActivityDetail(act)}
                            className="hover:bg-[#F0F2F5]/60 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#176B87]">
                                  {act.activityId}
                                </span>
                                <span className="font-semibold text-[#172033] max-w-xs truncate">
                                  {act.name}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="text-[#596579]">
                                {act.discipline} · {act.area}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-mono text-[#596579]">
                              {formatFriendlyDate(act.currentDate)}
                            </td>

                            <td className="py-3 px-4 font-mono font-bold text-[#172033]">
                              {formatFriendlyDate(act.simulatedDate)}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                  act.shiftDays > 0
                                    ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                                    : act.shiftDays < 0
                                    ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                                    : 'bg-[#F0F2F5] text-[#596579]'
                                }`}
                              >
                                {act.shiftDays > 0 ? `+${act.shiftDays} days` : `${act.shiftDays} days`}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  act.pathImpact === 'Critical Path Slip'
                                    ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                                    : act.pathImpact === 'Float Buffer Consumed'
                                    ? 'bg-[#FEF7EE] text-[#9A5B13] border border-[#ECD1A4]'
                                    : 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                                }`}
                              >
                                {act.pathImpact}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <span className="text-xs font-semibold text-[#176B87] group-hover:underline">
                                Inspect &rarr;
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* EMPTY STATE (When no scenario is currently run) */}
            {!isCalculating && !simulationResult && (
              <EmptyState
                icon={Sliders}
                title="No Simulation Result Computed"
                description="Select a source activity and set delay parameters above, then click 'Run Scenario' to project downstream Critical Path effects."
                action={{
                  label: 'Run Default Scenario (+7d Monsoon)',
                  icon: Play,
                  onClick: () => handleRunScenario(true),
                }}
              />
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: SAVED SCENARIOS VAULT
            ========================================================================= */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#172033]">Saved Scenarios Vault</h2>
                <p className="text-xs text-[#596579] mt-0.5">
                  Stored what-if simulations available for comparative analysis and management reviews.
                </p>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Current Scenario</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {savedScenarios.map((sc) => (
                <div
                  key={sc.id}
                  className="bg-white border border-[#D9DEE5] rounded-xl p-5 shadow-xs hover:border-[#176B87] transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#176B87]">{sc.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          sc.delayDays > 0
                            ? 'bg-[#FBEFEE] text-[#B5473C]'
                            : 'bg-[#EDF7F2] text-[#2E7D5B]'
                        }`}
                      >
                        {sc.delayDays > 0 ? `+${sc.delayDays}d Delay` : `${sc.delayDays}d Crash`}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[#172033]">{sc.name}</h3>
                    <p className="text-xs text-[#596579] line-clamp-2 leading-relaxed">
                      {sc.description}
                    </p>

                    <div className="pt-2 border-t border-[#D9DEE5]/60 text-xs space-y-1">
                      <div className="flex justify-between text-[#8A94A6]">
                        <span>Source Activity:</span>
                        <span className="font-mono font-bold text-[#172033]">{sc.sourceActivityId}</span>
                      </div>
                      <div className="flex justify-between text-[#8A94A6]">
                        <span>Created By:</span>
                        <span className="text-[#172033] truncate max-w-[150px]">{sc.createdBy}</span>
                      </div>
                      <div className="flex justify-between text-[#8A94A6]">
                        <span>Timestamp:</span>
                        <span className="text-[#596579] font-mono">{sc.createdAt}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      {sc.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-[#F0F2F5] text-[#596579] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#D9DEE5]/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleLoadScenario(sc)}
                      className="flex-1 py-1.5 px-3 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Load Scenario</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedScenarioForComparison(sc);
                        setIsCompareModalOpen(true);
                      }}
                      className="p-1.5 border border-[#D9DEE5] hover:bg-[#F0F2F5] rounded-lg text-[#596579] hover:text-[#172033] transition-colors"
                      title="Compare with baseline"
                    >
                      <GitCompare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteScenario(sc.id, sc.name)}
                      className="p-1.5 border border-[#D9DEE5] hover:bg-[#FBEFEE] rounded-lg text-[#596579] hover:text-[#B5473C] transition-colors"
                      title="Delete saved scenario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: SAVE SCENARIO
            ========================================================================= */}
        <Modal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          title="Save Simulation Scenario to Vault"
          subtitle="Save current parameters and calculated CPM impact for future comparative reviews."
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#596579] hover:text-[#172033]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScenario}
                className="px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Save to Vault
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#172033] block mb-1">Scenario Title *</label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87]"
              />
            </div>
            <div>
              <label className="font-bold text-[#172033] block mb-1">Description / Assumptions</label>
              <textarea
                rows={3}
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none focus:border-[#176B87] resize-none"
              />
            </div>
            <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#D9DEE5] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#8A94A6]">Source Activity:</span>
                <span className="font-mono font-bold text-[#172033]">{selectedActivityId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A94A6]">Delay Days:</span>
                <span className="font-mono font-bold text-[#176B87]">
                  {delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A94A6]">Simulated COD:</span>
                <span className="font-mono font-bold text-[#172033]">
                  {simulationResult?.simulatedProjectFinish || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </Modal>

        {/* =========================================================================
            MODAL: COMPARE SCENARIO
            ========================================================================= */}
        <Modal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          title="Multi-Scenario Schedule Comparison"
          subtitle="Compare baseline schedule vs active simulation vs saved vault scenarios side-by-side."
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="px-4 py-2 bg-[#172033] hover:bg-[#25324B] text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Close Comparison
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[10px] uppercase font-bold text-[#8A94A6]">
                    <th className="py-3 px-4">Metric / Dimension</th>
                    <th className="py-3 px-4 bg-[#EDF7F2]/40 text-[#2E7D5B]">
                      Baseline (Rev 3.2)
                    </th>
                    <th className="py-3 px-4 bg-[#EDF5F8]/60 text-[#176B87]">
                      Active Simulation
                    </th>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <th key={sc.id} className="py-3 px-4 text-[#172033]">
                        {sc.name.slice(0, 20)}...
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EBF0]">
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-[#172033]">Scenario Status</td>
                    <td className="py-2.5 px-4 font-semibold text-[#2E7D5B]">Active Baseline</td>
                    <td className="py-2.5 px-4 font-bold text-[#176B87]">Current Sandbox</td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-2.5 px-4 text-[#596579]">
                        Saved Vault ({sc.id})
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-[#172033]">Source Activity</td>
                    <td className="py-2.5 px-4 font-mono text-[#596579]">None (0d delta)</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#176B87]">{selectedActivityId}</td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-2.5 px-4 font-mono text-[#596579]">
                        {sc.sourceActivityId}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-[#172033]">Applied Delay</td>
                    <td className="py-2.5 px-4 font-mono text-[#2E7D5B]">0 Days</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#176B87]">
                      {delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`}
                    </td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-2.5 px-4 font-mono text-[#596579]">
                        {sc.delayDays >= 0 ? `+${sc.delayDays}d` : `${sc.delayDays}d`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-[#172033]">Project Finish (COD)</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#172033]">15 Dec 2026</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#B5473C]">
                      {formatFriendlyDate(simulationResult?.simulatedProjectFinish || '2026-12-15')}
                    </td>
                    {savedScenarios.slice(0, 2).map((sc) => {
                      const simCOD = addDaysToDateString('2026-12-15', sc.delayDays > 0 ? sc.delayDays : 0);
                      return (
                        <td key={sc.id} className="py-2.5 px-4 font-mono font-bold text-[#596579]">
                          {formatFriendlyDate(simCOD)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-[#172033]">Net Variance</td>
                    <td className="py-2.5 px-4 font-mono text-[#2E7D5B]">0d</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#B5473C]">
                      {simulationResult?.differenceDays ? `+${simulationResult.differenceDays}d` : '0d'}
                    </td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-2.5 px-4 font-mono text-[#596579]">
                        {sc.delayDays > 0 ? `+${sc.delayDays}d` : `${sc.delayDays}d`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-[#172033]">Critical Path Status</td>
                    <td className="py-2.5 px-4 text-[#2E7D5B]">Stable (Float Intact)</td>
                    <td className="py-2.5 px-4 font-bold text-[#B5473C]">
                      {simulationResult?.criticalPathPenetrated ? 'Penetrated' : 'Buffered'}
                    </td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-2.5 px-4 text-[#596579]">
                        {sc.tags.includes('Critical Path') ? 'Penetrated' : 'Buffered'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Modal>

        {/* =========================================================================
            DRAWER: AFFECTED ACTIVITY DETAIL
            ========================================================================= */}
        <Drawer
          isOpen={!!selectedActivityDetail}
          onClose={() => setSelectedActivityDetail(null)}
          title={`Activity Impact: ${selectedActivityDetail?.activityId || ''}`}
          subtitle={selectedActivityDetail?.name}
          width="md"
        >
          {selectedActivityDetail && (
            <div className="space-y-5 text-xs p-1">
              <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#176B87]">
                    {selectedActivityDetail.activityId}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedActivityDetail.pathImpact === 'Critical Path Slip'
                        ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                        : 'bg-[#FEF7EE] text-[#9A5B13] border border-[#ECD1A4]'
                    }`}
                  >
                    {selectedActivityDetail.pathImpact}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#172033]">{selectedActivityDetail.name}</h4>
                <p className="text-[#596579]">
                  {selectedActivityDetail.discipline} · {selectedActivityDetail.area} (WBS {selectedActivityDetail.wbs})
                </p>
              </div>

              {/* Schedule Shift Comparison */}
              <div className="space-y-2">
                <h5 className="font-bold text-[#172033] uppercase tracking-wider text-[11px]">
                  Finish Date Comparison
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white border border-[#D9DEE5]">
                    <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">
                      Current Planned Finish
                    </span>
                    <span className="font-mono text-sm font-semibold text-[#172033]">
                      {formatFriendlyDate(selectedActivityDetail.currentDate)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-[#D9DEE5]">
                    <span className="text-[10px] uppercase font-bold text-[#176B87] block">
                      Simulated Finish
                    </span>
                    <span className="font-mono text-sm font-bold text-[#B5473C]">
                      {formatFriendlyDate(selectedActivityDetail.simulatedDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CPM Driving Reason */}
              <div className="p-3.5 rounded-lg bg-[#EDF5F8] border border-[#B3CBE0] space-y-1.5">
                <span className="font-bold text-[#176B87] uppercase tracking-wider text-[10px] block">
                  Driving Dependency Relationship
                </span>
                <p className="text-[#172033] font-medium leading-relaxed">
                  {selectedActivityDetail.predecessorReason}
                </p>
                <div className="pt-2 border-t border-[#B3CBE0] flex items-center justify-between text-[11px]">
                  <span className="text-[#596579]">Constraint:</span>
                  <span className="font-mono font-bold text-[#176B87]">
                    {selectedActivityDetail.dependencyType}
                  </span>
                </div>
              </div>

              {/* Float Breakdown */}
              <div className="p-3 rounded-lg bg-white border border-[#D9DEE5] space-y-2">
                <span className="font-bold text-[#172033] uppercase tracking-wider text-[10px] block">
                  Float & Buffer Absorption
                </span>
                <div className="flex justify-between text-xs">
                  <span className="text-[#596579]">Total Float Available:</span>
                  <span className="font-mono font-semibold text-[#172033]">
                    {selectedActivityDetail.floatAvailable} days
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#596579]">Float Consumed by Scenario:</span>
                  <span className="font-mono font-semibold text-[#B5473C]">
                    {selectedActivityDetail.floatConsumed} days
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-[#D9DEE5]">
                  <span className="font-bold text-[#172033]">Net Critical Path Slip:</span>
                  <span className="font-mono font-bold text-[#B5473C]">
                    +{selectedActivityDetail.shiftDays} days
                  </span>
                </div>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AppShell>
  );
}
