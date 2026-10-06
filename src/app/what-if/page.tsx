'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorState } from '../../components/shared/ErrorState';
import { Modal } from '../../components/shared/Modal';
import { Drawer } from '../../components/shared/Drawer';
import { WhyButton } from '../../components/shared/WhyButton';
import {
  SIMULATION_ACTIVITIES,
  DEFAULT_SAVED_SCENARIOS,
  SimulatorActivity,
  SimulationScenario,
  SimulationResult,
  SimulatedActivityShift,
  executeWhatIfSimulation,
  formatFriendlyDate,
  formatShortDate,
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
  Lock,
  ArrowRight,
  Layers,
  ShieldCheck,
  Zap,
  Trash2,
  BarChart3,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronRight,
  Activity,
  Info,
} from 'lucide-react';

export default function WhatIfSimulatorPage() {
  const { activeProject, openWhyExplanation } = useApp();
  const { addToast } = useToast();

  // State Management - Default to Foundation Block A (+4d delay) matching canonical prompt example
  const [selectedActivityId, setSelectedActivityId] = useState<string>('CIV-11-001');
  const [delayDays, setDelayDays] = useState<number>(4);
  const [optionalDateChange, setOptionalDateChange] = useState<string>('');
  const [scenarioName, setScenarioName] = useState<string>('Foundation Block A Curing Hold (+4d)');
  const [scenarioDescription, setScenarioDescription] = useState<string>(
    'Testing impact of 4-day curing hold on downstream Column Installation and Equipment Installation.'
  );

  // Scenarios Vault
  const [savedScenarios, setSavedScenarios] = useState<SimulationScenario[]>(DEFAULT_SAVED_SCENARIOS);
  const [activeTab, setActiveTab] = useState<'simulator' | 'saved' | 'comparison'>('simulator');

  // Simulation Execution State
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // Error State
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
  }, [selectedActivityId, delayDays, selectedActivity]);

  // Run simulation on initial mount with default scenario
  useEffect(() => {
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

  // ACTION 1: RUN SCENARIO (Instantaneous calculation, no animated graphics)
  const handleRunScenario = () => {
    if (simulateError) {
      setErrorMessage('Critical CPM Graph Loop Detected: Predecessor cycle discovered during topological sort.');
      return;
    }

    if (!scenarioName.trim()) {
      addToast({
        type: 'warning',
        title: 'Scenario Name Required',
        description: 'Please enter a descriptive name before running the simulation.',
      });
      return;
    }

    try {
      const res = executeWhatIfSimulation(
        scenarioName,
        selectedActivityId,
        delayDays,
        optionalDateChange
      );
      setSimulationResult(res);
      addToast({
        type: 'info',
        title: 'Simulation Run Completed',
        description: `Scenario computed in isolated sandbox. Live schedule remains read-only.`,
      });
    } catch (err: any) {
      setSimulateError(true);
      setErrorMessage(err.message || 'Failed to compute CPM simulation.');
    }
  };

  // ACTION 2: SAVE SCENARIO
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

  // ACTION 3: COMPARE SCENARIO
  const handleOpenCompare = () => {
    setIsCompareModalOpen(true);
  };

  // ACTION 4: RESET
  const handleReset = () => {
    setSelectedActivityId('CIV-11-001');
    setDelayDays(0);
    setScenarioName('Baseline Schedule V3 · Rev 3.2 (No Delay)');
    setScenarioDescription('Baseline schedule state with 0 days variance applied.');
    setSimulateError(false);
    setErrorMessage('');
    const res = executeWhatIfSimulation('Baseline Schedule V3 · Rev 3.2', 'CIV-11-001', 0);
    setSimulationResult(res);
    addToast({
      type: 'info',
      title: 'Parameters Reset to Baseline',
      description: 'Zero schedule shift applied. All activities set to original planned dates.',
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

    try {
      const res = executeWhatIfSimulation(sc.name, sc.sourceActivityId, sc.delayDays, sc.optionalDateChange);
      setSimulationResult(res);
      addToast({
        type: 'info',
        title: `Loaded: ${sc.name}`,
        description: `Source activity ${sc.sourceActivityId} configured with ${sc.delayDays >= 0 ? `+${sc.delayDays}` : sc.delayDays} days delay.`,
      });
    } catch (err: any) {
      setSimulateError(true);
      setErrorMessage(err.message || 'Failed to compute CPM simulation.');
    }
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

  // Canonical Scenario Label e.g. "Foundation +4 days"
  const scenarioDisplay = useMemo(() => {
    const shortName = selectedActivity.name.includes('Foundation')
      ? 'Foundation'
      : selectedActivity.name.split(' ')[0];
    const sign = delayDays >= 0 ? '+' : '';
    return `${shortName} ${sign}${delayDays} days`;
  }, [selectedActivity.name, delayDays]);

  // Projected Finish Date & Impact display
  const projectedFinishDate = useMemo(() => {
    if (!selectedActivity) return '2026-10-19';
    return addDaysToDateString(selectedActivity.plannedFinish, delayDays);
  }, [selectedActivity, delayDays]);

  const impactDisplay = useMemo(() => {
    if (delayDays > 0) return `+${delayDays} days`;
    if (delayDays < 0) return `${delayDays} days`;
    return '0 days';
  }, [delayDays]);

  const breadcrumbs = [
    { label: 'Control' },
    { label: 'What-if Simulator', current: true },
  ];

  return (
    <StateWrapper>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            STATIC BANNER: MANDATORY SIMULATION ISOLATION GUARANTEE
            "SIMULATION — DOES NOT CHANGE THE LIVE SCHEDULE"
            No animation. No moving graphics. No 3D.
            ========================================================================= */}
        <div className="bg-amber-50 border-2 border-amber-600 rounded-lg p-3.5 sm:p-4 shadow-xs text-center">
          <div className="flex items-center justify-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-600 text-white shrink-0">
              SIMULATION
            </span>
            <h2 className="text-sm sm:text-base font-bold tracking-wide text-amber-950 uppercase">
              SIMULATION — DOES NOT CHANGE THE LIVE SCHEDULE
            </h2>
          </div>
          <p className="text-xs text-amber-900 mt-1.5 leading-relaxed max-w-3xl mx-auto">
            Calculations performed here are isolated scenario projections. This tool <strong>NEVER</strong> modifies the baseline schedule, live project records, or verified actual progress.
          </p>
        </div>

        {/* =========================================================================
            HEADER: Isolated What-If Simulator Workspace
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]/60">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5]">
                  <Lock className="w-3 h-3 text-[#596579]" />
                  Master Schedule Baseline Locked
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                  Predictive CPM Engine
                </span>
              </div>

              <h1 className="text-[28px] sm:text-3xl font-bold text-[#172033] tracking-tight">
                What-if Simulator
              </h1>
              <p className="text-sm text-[#596579] mt-1 max-w-3xl">
                Test hypothetical schedule variations and downstream Critical Path impacts without modifying actual project progress, risks, or schedule records.
              </p>
            </div>

            {/* THE 4 CANONICAL ACTIONS */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 1. Run Scenario */}
              <button
                type="button"
                onClick={handleRunScenario}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg transition-colors shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run Scenario</span>
              </button>

              {/* 2. Save Scenario */}
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(true)}
                disabled={!simulationResult}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F1F3F5] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5 text-[#596579]" />
                <span>Save Scenario</span>
              </button>

              {/* 3. Compare Scenario */}
              <button
                type="button"
                onClick={handleOpenCompare}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F1F3F5] rounded-lg transition-colors shadow-xs"
              >
                <GitCompare className="w-3.5 h-3.5 text-[#176B87]" />
                <span>Compare Scenario</span>
              </button>

              {/* 4. Reset */}
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#596579] bg-white border border-[#D9DEE5] hover:bg-[#F1F3F5] rounded-lg transition-colors shadow-xs"
                title="Reset all inputs to baseline"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#596579]" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Quick Tab Switcher */}
          <div className="mt-4 flex items-center justify-between flex-wrap gap-2 pt-2">
            <div className="flex items-center bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg p-0.5 text-xs">
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
                <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-[#D9DEE5] text-[#172033] font-mono">
                  {savedScenarios.length}
                </span>
              </button>
            </div>

            <div className="text-[11px] text-[#596579] font-mono">
              Active Project: {activeProject?.name || 'Duliajan Unit A'}
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
              handleRunScenario();
            }}
          />
        )}

        {/* =========================================================================
            TAB 1: SIMULATOR CANVAS
            ========================================================================= */}
        {activeTab === 'simulator' && !simulateError && (
          <div className="space-y-6">

            {/* =====================================================================
                4-METRIC KEY COMPARISON CARDS (MANDATED FORMAT)
                Current Finish: 15 Oct
                Scenario: Foundation +4 days
                Projected Finish: 19 Oct
                Impact: +4 days
                ===================================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Card 1: Current Finish */}
              <div className="bg-white border-2 border-[#D9DEE5] rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] uppercase font-semibold text-[#596579] tracking-wider">
                    Current Finish
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5]">
                    Actual Baseline
                  </span>
                </div>
                <div className="text-[28px] sm:text-3xl font-bold font-mono text-[#172033] leading-none">
                  {formatShortDate(selectedActivity.plannedFinish)}
                </div>
                <div className="mt-2 pt-2 border-t border-[#D9DEE5]/60 text-xs text-[#596579] flex items-center justify-between">
                  <span>Current baseline date:</span>
                  <span className="font-mono font-medium text-[#172033]">
                    {formatFriendlyDate(selectedActivity.plannedFinish)}
                  </span>
                </div>
              </div>

              {/* Card 2: Scenario */}
              <div className="bg-white border-2 border-[#B3CBE0] rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] uppercase font-semibold text-[#176B87] tracking-wider">
                    Scenario
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                      Simulation Input
                    </span>
                    <WhyButton
                      onClick={() => openWhyExplanation(`delay:${selectedActivityId}`)}
                      title="Why simulate this delay duration?"
                    />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-[#176B87] truncate leading-none" title={scenarioDisplay}>
                  {scenarioDisplay}
                </div>
                <div className="mt-2 pt-2 border-t border-[#B3CBE0]/60 text-xs text-[#596579] flex items-center justify-between">
                  <span>Hypothetical shift:</span>
                  <span className="font-mono font-semibold text-[#176B87]">
                    {delayDays >= 0 ? `+${delayDays} days` : `${delayDays} days`}
                  </span>
                </div>
              </div>

              {/* Card 3: Projected Finish */}
              <div className="bg-white border-2 border-[#E4B0AA] rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] uppercase font-semibold text-[#B5473C] tracking-wider">
                    Projected Finish
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                      Simulated Date
                    </span>
                    <WhyButton
                      onClick={() => openWhyExplanation('impact:what-if')}
                      title="Why does the simulated finish date shift?"
                    />
                  </div>
                </div>
                <div className="text-[28px] sm:text-3xl font-bold font-mono text-[#B5473C] leading-none">
                  {formatShortDate(projectedFinishDate)}
                </div>
                <div className="mt-2 pt-2 border-t border-[#E4B0AA]/60 text-xs text-[#596579] flex items-center justify-between">
                  <span>Simulated finish:</span>
                  <span className="font-mono font-medium text-[#172033]">
                    {formatFriendlyDate(projectedFinishDate)}
                  </span>
                </div>
              </div>

              {/* Card 4: Impact */}
              <div className="bg-white border-2 border-[#E4B0AA] rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] uppercase font-semibold text-[#B5473C] tracking-wider">
                    Impact
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                      Critical Path
                    </span>
                    <WhyButton
                      onClick={() => openWhyExplanation('impact:what-if')}
                      title="Why is the simulated impact +4 days?"
                    />
                  </div>
                </div>
                <div className="text-[28px] sm:text-3xl font-bold font-mono text-[#B5473C] leading-none">
                  {impactDisplay}
                </div>
                <div className="mt-2 pt-2 border-t border-[#E4B0AA]/60 text-xs text-[#596579] flex items-center justify-between">
                  <span>Schedule slip:</span>
                  <span className="font-mono font-semibold text-[#B5473C]">
                    {impactDisplay}
                  </span>
                </div>
              </div>
            </div>

            {/* =====================================================================
                CLEAR ARCHITECTURAL SEPARATION:
                ACTUAL PROJECT STATE
                vs.
                SIMULATION
                Do not visually mix simulated values with actual values.
                ===================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* ===================================================================
                  COLUMN 1: ACTUAL PROJECT STATE (Read-Only Master Baseline)
                  =================================================================== */}
              <div className="bg-[#F7F8FA] border-2 border-[#D9DEE5] rounded-lg p-5 md:p-6 shadow-xs flex flex-col justify-between">
                <div className="space-y-5">
                  {/* Actual Section Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#D9DEE5]">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#596579]" />
                      <h2 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                        ACTUAL PROJECT STATE
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-white border border-[#D9DEE5] text-[#596579]">
                      Live Schedule (Read-Only)
                    </span>
                  </div>

                  <p className="text-xs text-[#596579] leading-relaxed">
                    The live schedule records approved baseline dates, actual field completions, and official contractual milestones. Values in this panel are permanently protected and cannot be changed here.
                  </p>

                  {/* Master Schedule Source Details Section */}
                  <div className="pt-3 border-t border-[#D9DEE5] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#172033]">
                          {selectedActivity.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5]">
                          {selectedActivity.discipline}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                        Critical Path (0d Float)
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-[#172033]">{selectedActivity.name}</h3>
                      <p className="text-xs text-[#596579] mt-0.5">
                        {selectedActivity.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-[#596579] block">
                          Current Planned Start
                        </span>
                        <span className="font-mono text-[#172033] font-medium">
                          {formatFriendlyDate(selectedActivity.plannedStart)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-[#596579] block">
                          Current Planned Finish
                        </span>
                        <span className="font-mono font-medium text-[#172033]">
                          {formatFriendlyDate(selectedActivity.plannedFinish)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-[#596579] block">
                          Area / WBS Location
                        </span>
                        <span className="text-[#596579] truncate block">
                          {selectedActivity.area} ({selectedActivity.wbs})
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-[#596579] block">
                          Assigned Lead Engineer
                        </span>
                        <span className="text-[#596579] truncate block">
                          {selectedActivity.assignedEngineer}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contractual Milestones Baseline Section */}
                  <div className="pt-3 border-t border-[#D9DEE5] space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#596579] block">
                      Approved Key Milestones (Baseline V3)
                    </span>
                    <div className="divide-y divide-[#D9DEE5] border border-[#D9DEE5] rounded bg-white text-xs">
                      <div className="flex items-center justify-between p-2.5">
                        <span className="font-medium text-[#172033]">Mechanical Completion</span>
                        <span className="font-mono font-medium text-[#172033]">15 Nov 2026</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5">
                        <span className="font-medium text-[#172033]">Commercial Operation Date (COD)</span>
                        <span className="font-mono font-semibold text-[#172033]">15 Dec 2026</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Isolation Guarantee */}
                <div className="mt-5 pt-3 border-t border-[#D9DEE5] flex items-center gap-2 text-xs text-[#596579]">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                  <span>Master schedule locked · Field records protected against simulation writes.</span>
                </div>
              </div>

              {/* ===================================================================
                  COLUMN 2: SIMULATION (Isolated Scenario Sandbox)
                  =================================================================== */}
              <div className="bg-white border-2 border-amber-500/70 rounded-lg p-5 md:p-6 shadow-xs flex flex-col justify-between">
                <div className="space-y-5">
                  {/* Simulation Section Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#D9DEE5]">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-700" />
                      <h2 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                        SIMULATION
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                      Isolated Sandbox
                    </span>
                  </div>

                  <p className="text-xs text-[#596579] leading-relaxed">
                    Adjust hypothetical duration shifts and examine projected cascading impacts. Changes made in this panel stay strictly within the sandbox.
                  </p>

                  {/* Scenario Presets & Title */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                        Scenario Title *
                      </label>
                      <span className="text-[11px] text-[#7B8798]">Experimental run label</span>
                    </div>

                    <input
                      type="text"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      placeholder="e.g. Foundation Block A Curing Hold (+4d)"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-medium outline-hidden focus:border-[#176B87] focus:ring-1 focus:ring-[#176B87]"
                    />

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="text-[#7B8798]">Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setScenarioName('Foundation Block A Curing Hold (+4d)');
                          setSelectedActivityId('CIV-11-001');
                          setDelayDays(4);
                        }}
                        className="px-2.5 py-0.5 rounded bg-[#EDF5F8] hover:bg-[#D4E8F0] text-[#176B87] text-[10px] font-bold transition-colors border border-[#B3CBE0]"
                      >
                        Foundation +4d
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScenarioName('Monsoon Surge on HP Header (+7d)');
                          setSelectedActivityId('PIP-24-001');
                          setDelayDays(7);
                        }}
                        className="px-2.5 py-0.5 rounded bg-[#F1F3F5] hover:bg-[#D9DEE5] text-[#172033] text-[10px] font-medium transition-colors"
                      >
                        Monsoon Surge (+7d)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScenarioName('Double-Shift Welding Acceleration (-3d)');
                          setSelectedActivityId('PIP-24-002');
                          setDelayDays(-3);
                        }}
                        className="px-2.5 py-0.5 rounded bg-[#EDF7F2] hover:bg-[#D5EEDB] text-[#2E7D5B] text-[10px] font-bold transition-colors"
                      >
                        Welding Acceleration (-3d)
                      </button>
                    </div>
                  </div>

                  {/* Target Activity Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033] uppercase tracking-wider block">
                      Target Activity to Vary *
                    </label>
                    <select
                      value={selectedActivityId}
                      onChange={(e) => setSelectedActivityId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D9DEE5] rounded-lg font-medium text-[#172033] outline-hidden focus:border-[#176B87] shadow-xs"
                    >
                      {SIMULATION_ACTIVITIES.map((act) => (
                        <option key={act.id} value={act.id}>
                          {act.id} — {act.name} ({act.discipline})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Schedule Shift Stepper & Slider */}
                  <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#172033]">Hypothetical Schedule Shift</span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${
                          delayDays > 0
                            ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                            : delayDays < 0
                            ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                            : 'bg-white text-[#596579] border border-[#D9DEE5]'
                        }`}
                      >
                        {delayDays > 0 ? `+${delayDays} days delay` : delayDays < 0 ? `${delayDays} days acceleration` : '0 days (Baseline)'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <input
                        type="range"
                        min="-14"
                        max="45"
                        value={delayDays}
                        onChange={(e) => setDelayDays(parseInt(e.target.value, 10))}
                        className="w-full accent-[#176B87] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#7B8798] font-mono">
                        <span>-14d (Crashing)</span>
                        <span>0d (Baseline)</span>
                        <span>+45d (Major Slip)</span>
                      </div>
                    </div>

                    {/* Quick Buttons */}
                    <div className="flex items-center gap-1 pt-1 flex-wrap">
                      {[-3, 0, 1, 3, 4, 5, 7, 14].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDelayDays(d)}
                          className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${
                            delayDays === d
                              ? 'bg-[#176B87] text-white shadow-xs'
                              : 'bg-white border border-[#D9DEE5] text-[#596579] hover:bg-[#F1F3F5]'
                          }`}
                        >
                          {d > 0 ? `+${d}d` : `${d}d`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Date Change Override */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033] uppercase tracking-wider block">
                      Optional Projected Date Override
                    </label>
                    <input
                      type="date"
                      value={optionalDateChange}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] font-mono font-medium outline-hidden focus:border-[#176B87]"
                    />
                  </div>
                </div>

                {/* Run CTA Button */}
                <div className="mt-5 pt-3 border-t border-[#D9DEE5]">
                  <button
                    type="button"
                    onClick={handleRunScenario}
                    className="w-full py-2.5 px-4 bg-[#176B87] hover:bg-[#135A72] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run Scenario</span>
                  </button>
                </div>
              </div>
            </div>

            {/* =====================================================================
                AFFECTED ACTIVITIES & DOWNSTREAM IMPACT SCHEDULE
                Includes: Affected activities heading, Downstream Chain, and Table
                ===================================================================== */}
            {simulationResult && (
              <div className="space-y-6">
                {/* 1. Affected Activities Summary Banner */}
                <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#D9DEE5]/60">
                    <div>
                      <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                        Affected activities
                      </h3>
                      <p className="text-xs text-[#596579] mt-0.5">
                        Downstream handoffs and work packages shifted by the simulated {delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`} variance on {selectedActivityId}.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#F7F8FA] border border-[#D9DEE5] text-[#172033]">
                      {simulationResult.affectedActivities.filter((a) => a.activityId !== selectedActivityId).length} Downstream Handoffs Impacted
                    </span>
                  </div>

                  {/* Explicit Badges of Affected Activities */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {simulationResult.affectedActivities
                      .filter((a) => a.activityId !== selectedActivityId)
                      .map((act) => (
                        <span
                          key={act.activityId}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#F7F8FA] text-[#172033] border border-[#D9DEE5] inline-flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B5473C]" />
                          <strong className="font-mono text-[#176B87]">{act.activityId}</strong>
                          <span>{act.name}</span>
                          <span className="font-mono text-[11px] text-[#B5473C] font-bold">
                            (+{act.shiftDays}d)
                          </span>
                        </span>
                      ))}
                  </div>
                </div>

                {/* 2. Downstream Dependency Chain Visualization (Static 2D Gantt/Timeline nodes) */}
                <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#176B87]" />
                      <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                        Downstream Critical Path Cascade
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-[#7B8798]">
                      Precedence Logic: Finish-to-Start (FS +0d Lag)
                    </span>
                  </div>

                  <div className="overflow-x-auto pb-2">
                    <div className="flex items-center gap-3 min-w-[700px]">
                      {simulationResult.dependencyChain.map((node, idx) => {
                        const isSource = node.id === selectedActivityId;
                        const isLast = idx === simulationResult.dependencyChain.length - 1;

                        return (
                          <React.Fragment key={node.id}>
                            <div
                              className={`p-3 rounded-lg border flex-1 min-w-[190px] text-xs transition-colors ${
                                isSource
                                  ? 'bg-[#EDF5F8] border-[#176B87] shadow-xs'
                                  : node.shiftDays > 0
                                  ? 'bg-[#FBEFEE]/50 border-[#E4B0AA]'
                                  : 'bg-[#F7F8FA] border-[#D9DEE5]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono font-bold text-[11px] text-[#176B87]">
                                  {node.id}
                                </span>
                                {isSource ? (
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#176B87] text-white">
                                    Trigger
                                  </span>
                                ) : node.shiftDays > 0 ? (
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                                    +{node.shiftDays}d Slip
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                                    On Target
                                  </span>
                                )}
                              </div>

                              <p className="font-semibold text-[#172033] text-[11px] truncate mb-2">
                                {node.name}
                              </p>

                              <div className="space-y-0.5 text-[10px] font-mono pt-1.5 border-t border-[#D9DEE5]/60">
                                <div className="flex justify-between text-[#7B8798]">
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
                              <div className="flex flex-col items-center justify-center shrink-0 text-[#7B8798]">
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

                {/* 3. Affected Activities Table */}
                <div className="bg-white border border-[#D9DEE5] rounded-lg shadow-xs overflow-hidden">
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
                    <table className="w-full min-w-[750px] text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] sm:text-xs uppercase font-semibold text-[#596579] tracking-wider">
                          <th className="py-3 px-4">Activity</th>
                          <th className="py-3 px-4">Discipline / Area</th>
                          <th className="py-3 px-4">Current Date</th>
                          <th className="py-3 px-4">Simulated Date</th>
                          <th className="py-3 px-4">Shift</th>
                          <th className="py-3 px-4">CPM Impact</th>
                          <th className="py-3 px-4 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D9DEE5]">
                        {simulationResult.affectedActivities.map((act) => (
                          <tr
                            key={act.activityId}
                            onClick={() => setSelectedActivityDetail(act)}
                            className="hover:bg-[#F1F3F5]/60 transition-colors cursor-pointer group"
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
                                    : 'bg-[#F1F3F5] text-[#596579]'
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
                                    ? 'bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]'
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

                {/* 4. Downstream Milestone Exposure */}
                <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 md:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#D9DEE5]/60 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#176B87]" />
                      <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                        Downstream Milestone & Critical Path Impact
                      </h3>
                    </div>
                  </div>

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
                                : 'bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5]'
                            }`}
                          >
                            {ms.status}
                          </span>
                        </div>

                        <h5 className="font-semibold text-[#172033] text-xs line-clamp-1">{ms.name}</h5>

                        <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-[#D9DEE5]/60 text-[11px] font-mono">
                          <div>
                            <span className="text-[10px] text-[#596579] uppercase font-semibold block">Baseline</span>
                            <span>{formatFriendlyDate(ms.currentDate)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#596579] uppercase font-semibold block">Simulated</span>
                            <span className={ms.shiftDays > 0 ? 'text-[#B5473C] font-bold' : 'text-[#172033]'}>
                              {formatFriendlyDate(ms.simulatedDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Engineering Mitigation Suggestions */}
                  {simulationResult.impactSummary.mitigationSuggestions.length > 0 && (
                    <div className="p-4 rounded-lg bg-[#F0F4F8] border border-[#D9DEE5] text-xs space-y-2">
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
              </div>
            )}

            {/* EMPTY STATE (When no simulation result computed) */}
            {!simulationResult && (
              <EmptyState
                icon={Sliders}
                title="No Simulation Result Computed"
                description="Select a source activity and set delay parameters above, then click 'Run Scenario' to project downstream effects."
                action={{
                  label: 'Run Default Scenario (Foundation Block A +4d)',
                  icon: Play,
                  onClick: handleRunScenario,
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
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 shadow-xs flex items-center justify-between">
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
                  className="bg-white border border-[#D9DEE5] rounded-lg p-5 shadow-xs hover:border-[#176B87] transition-colors flex flex-col justify-between space-y-4"
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
                      <div className="flex justify-between text-[#7B8798]">
                        <span>Source Activity:</span>
                        <span className="font-mono font-bold text-[#172033]">{sc.sourceActivityId}</span>
                      </div>
                      <div className="flex justify-between text-[#7B8798]">
                        <span>Created By:</span>
                        <span className="text-[#172033] truncate max-w-[150px]">{sc.createdBy}</span>
                      </div>
                      <div className="flex justify-between text-[#7B8798]">
                        <span>Timestamp:</span>
                        <span className="text-[#596579] font-mono">{sc.createdAt}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      {sc.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-[#F1F3F5] text-[#596579] font-medium"
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
                      className="p-1.5 border border-[#D9DEE5] hover:bg-[#F1F3F5] rounded-lg text-[#596579] hover:text-[#172033] transition-colors"
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
                className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-hidden focus:border-[#176B87]"
              />
            </div>
            <div>
              <label className="font-bold text-[#172033] block mb-1">Description / Assumptions</label>
              <textarea
                rows={3}
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-hidden focus:border-[#176B87] resize-none"
              />
            </div>
            <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#D9DEE5] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#7B8798]">Source Activity:</span>
                <span className="font-mono font-bold text-[#172033]">{selectedActivityId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7B8798]">Delay Days:</span>
                <span className="font-mono font-bold text-[#176B87]">
                  {delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7B8798]">Simulated Finish:</span>
                <span className="font-mono font-bold text-[#172033]">
                  {formatFriendlyDate(optionalDateChange)}
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
              <table className="w-full min-w-[650px] text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] sm:text-xs uppercase font-semibold text-[#596579]">
                    <th className="py-3 px-4">Metric / Dimension</th>
                    <th className="py-3 px-4 bg-[#EDF7F2]/40 text-[#2E7D5B]">
                      Baseline (V3 · Rev 3.2)
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
                <tbody className="divide-y divide-[#D9DEE5]">
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
                    <td className="py-2.5 px-4 font-bold text-[#172033]">Target Completion</td>
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
                        : 'bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]'
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
                    <span className="text-[10px] uppercase font-semibold text-[#596579] block">
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
    </StateWrapper>
  );
}
