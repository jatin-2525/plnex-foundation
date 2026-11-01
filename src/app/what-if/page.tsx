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
import { StatusBadge } from '../../components/shared/StatusBadge';
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
  const [isCustomName, setIsCustomName] = useState<boolean>(false);
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

  // Sync optionalDateChange and auto-update scenarioName/description if not custom edited
  useEffect(() => {
    if (selectedActivity) {
      const calculatedDate = addDaysToDateString(selectedActivity.plannedFinish, delayDays);
      setOptionalDateChange(calculatedDate);

      if (!isCustomName) {
        const sign = delayDays >= 0 ? `+${delayDays}` : `${delayDays}`;
        setScenarioName(`${selectedActivity.name} (${sign}d)`);
        setScenarioDescription(
          `Testing simulated impact of ${sign} days perturbation on ${selectedActivity.name} (${selectedActivity.id}) and downstream handoffs.`
        );
      }
    }
  }, [selectedActivityId, delayDays, selectedActivity, isCustomName]);

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
      title: 'Scenario Saved to Session',
      description: `Scenario "${scenarioName}" stored in session memory for comparison.`,
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
    setIsCustomName(false);
    setScenarioName('Baseline Schedule Rev 3.2 (P6 XML) (No Delay)');
    setScenarioDescription('Baseline schedule state with 0 days variance applied.');
    setSimulateError(false);
    setErrorMessage('');
    const res = executeWhatIfSimulation('Baseline Schedule Rev 3.2 (P6 XML)', 'CIV-11-001', 0);
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
    setIsCustomName(true);
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
      description: `Scenario "${name}" removed from session memory.`,
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
      <div className="space-y-6 pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            STATIC BANNER: MANDATORY SIMULATION ISOLATION GUARANTEE
            "SIMULATION — DOES NOT CHANGE THE LIVE SCHEDULE"
            No animation. No moving graphics. No 3D.
            ========================================================================= */}
        <div className="bg-amber-50 border-2 border-amber-600 rounded-lg p-4 sm:p-4 shadow-xs text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-600 text-white shrink-0">
              SIMULATION
            </span>
            <h2 className="text-sm sm:text-base font-bold tracking-wide text-amber-950 uppercase">
              SIMULATION — DOES NOT CHANGE THE LIVE SCHEDULE
            </h2>
          </div>
          <p className="text-xs text-amber-900 mt-2 leading-relaxed max-w-3xl mx-auto">
            Calculations performed here are isolated scenario projections. This tool <strong>NEVER</strong> modifies the baseline schedule, live project records, or verified actual progress.
          </p>
        </div>

        {/* =========================================================================
            HEADER: Isolated What-If Simulator Workspace
            ========================================================================= */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D8E2EA]/60">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#EAF0F5] text-[#526779] border border-[#D8E2EA]">
                  <Lock className="w-3 h-3 text-[#526779]" />
                  Master Schedule Baseline Locked
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#EAF0F5] text-[#0F6B68] border border-[#D8E2EA]">
                  Predictive CPM Engine
                </span>
              </div>

              <h1 className="text-[28px] sm:text-3xl font-bold text-[#142C3F] tracking-tight">
                What-if Simulator
              </h1>
              <p className="text-sm text-[#526779] mt-1 max-w-3xl">
                Test hypothetical schedule variations and downstream Critical Path impacts without modifying actual project progress, risks, or schedule records.
              </p>
            </div>

            {/* THE 4 CANONICAL ACTIONS */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 1. Run What-If Simulation */}
              <button
                type="button"
                onClick={handleRunScenario}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0F6B68] hover:bg-[#135A72] border border-[#0F6B68] rounded-lg transition-colors shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run What-If Simulation</span>
              </button>

              {/* 2. Save Scenario */}
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(true)}
                disabled={!simulationResult}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#142C3F] bg-white border border-[#D8E2EA] hover:bg-[#EAF0F5] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5 text-[#526779]" />
                <span>Save Scenario</span>
              </button>

              {/* 3. Compare Scenarios */}
              <button
                type="button"
                onClick={handleOpenCompare}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#142C3F] bg-white border border-[#D8E2EA] hover:bg-[#EAF0F5] rounded-lg transition-colors shadow-xs"
              >
                <GitCompare className="w-3.5 h-3.5 text-[#0F6B68]" />
                <span>Compare Scenarios</span>
              </button>

              {/* 4. Reset to Baseline */}
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#526779] bg-white border border-[#D8E2EA] hover:bg-[#EAF0F5] rounded-lg transition-colors shadow-xs"
                title="Reset all inputs to baseline"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#526779]" />
                <span>Reset to Baseline</span>
              </button>
            </div>
          </div>

          {/* Quick Tab Switcher */}
          <div className="mt-4 flex items-center justify-between flex-wrap gap-2 pt-2">
            <div className="flex items-center bg-[#F3F6FA] border border-[#D8E2EA] rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  activeTab === 'simulator'
                    ? 'bg-[#0F6B68] text-white font-semibold'
                    : 'text-[#526779] hover:text-[#142C3F]'
                }`}
              >
                Scenario Canvas
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'saved'
                    ? 'bg-[#0F6B68] text-white font-semibold'
                    : 'text-[#526779] hover:text-[#142C3F]'
                }`}
              >
                <span>Session Scenarios</span>
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-[#D8E2EA] text-[#142C3F] font-mono">
                  {savedScenarios.length}
                </span>
              </button>
            </div>

            <div className="text-[11px] text-[#526779] font-mono">
              Active Project: {activeProject?.name || 'Duliajan Unit A'}
            </div>
          </div>
        </div>

        {/* ERROR STATE DISPLAY (if triggered) */}
        {simulateError && (
          <ErrorState
            title="Scenario simulation could not be computed."
            message={errorMessage || 'The CPM network calculation failed due to invalid predecessor logic. Check activity dependencies and retry the simulation.'}
            code="ERR_PLNEX_SIM_TOPOLOGY"
            onRetry={() => {
              setSimulateError(false);
              handleRunScenario();
            }}
            retryLabel="Retry Simulation"
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
              {/* Card 1: Selected Activity Baseline Finish */}
              <div className="bg-white border-2 border-[#D8E2EA] rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-semibold text-[#526779] tracking-wider truncate max-w-[140px]" title="Selected Activity Baseline Finish">
                    Activity Baseline Finish
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#EAF0F5] text-[#142C3F] border border-[#D8E2EA]">
                    {selectedActivity.id}
                  </span>
                </div>
                <div className="text-[28px] sm:text-3xl font-bold font-mono text-[#142C3F] leading-none">
                  {formatShortDate(selectedActivity.plannedFinish)}
                </div>
                <div className="mt-2 pt-2 border-t border-[#D8E2EA]/60 text-xs text-[#526779] flex items-center justify-between">
                  <span>Activity baseline date:</span>
                  <span className="font-mono font-medium text-[#142C3F]">
                    {formatFriendlyDate(selectedActivity.plannedFinish)}
                  </span>
                </div>
              </div>

              {/* Card 2: Scenario */}
              <div className="bg-white border-2 border-[#D8E2EA] rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-semibold text-[#0F6B68] tracking-wider">
                    Scenario
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#EAF0F5] text-[#0F6B68] border border-[#D8E2EA]">
                      Simulation Input
                    </span>
                    <WhyButton
                      onClick={() => openWhyExplanation(`delay:${selectedActivityId}`)}
                      title="Why simulate this delay duration?"
                    />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-[#0F6B68] truncate leading-none" title={scenarioDisplay}>
                  {scenarioDisplay}
                </div>
                <div className="mt-2 pt-2 border-t border-[#D8E2EA]/60 text-xs text-[#526779] flex items-center justify-between">
                  <span>Hypothetical shift:</span>
                  <span className="font-mono font-semibold text-[#0F6B68]">
                    {delayDays >= 0 ? `+${delayDays} days` : `${delayDays} days`}
                  </span>
                </div>
              </div>

              {/* Card 3: Activity Projected Finish */}
              <div className="bg-white border-2 border-[#E4B0AA] rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-semibold text-[#A24335] tracking-wider">
                    Activity Projected Finish
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#FCE8E4] text-[#A24335] border border-[#E4B0AA]">
                      Simulated Date
                    </span>
                    <WhyButton
                      onClick={() => openWhyExplanation('impact:what-if')}
                      title="Why does the simulated finish date shift?"
                    />
                  </div>
                </div>
                <div className="text-[28px] sm:text-3xl font-bold font-mono text-[#A24335] leading-none">
                  {formatShortDate(projectedFinishDate)}
                </div>
                <div className="mt-2 pt-2 border-t border-[#E4B0AA]/60 text-xs text-[#526779] flex items-center justify-between">
                  <span>Selected activity simulated finish:</span>
                  <span className="font-mono font-medium text-[#142C3F]">
                    {formatFriendlyDate(projectedFinishDate)}
                  </span>
                </div>
              </div>

              {/* Card 4: Impact on Project COD */}
              {(() => {
                const projectSlip = simulationResult?.differenceDays ?? 0;
                const isCriticalSlip = projectSlip > 0;
                const isAccelerated = projectSlip < 0;

                const borderClass = isCriticalSlip
                  ? 'border-[#E4B0AA]'
                  : isAccelerated
                  ? 'border-[#A8DEC7]'
                  : 'border-[#F4E0A0]';
                const textClass = isCriticalSlip
                  ? 'text-[#A24335]'
                  : isAccelerated
                  ? 'text-[#176B53]'
                  : 'text-[#845006]';
                const badgeBg = isCriticalSlip
                  ? 'bg-[#FCE8E4] text-[#A24335] border-[#E4B0AA]'
                  : isAccelerated
                  ? 'bg-[#EBF7F2] text-[#176B53] border-[#A8DEC7]'
                  : 'bg-[#FEF9E7] text-[#845006] border-[#F4E0A0]';
                const badgeLabel = isCriticalSlip
                  ? 'Critical Path Slip'
                  : isAccelerated
                  ? 'Schedule Accelerated'
                  : 'Float Absorbed';
                const subtext = isCriticalSlip
                  ? `Milestone COD slips +${projectSlip} days`
                  : isAccelerated
                  ? `Milestone COD advances ${Math.abs(projectSlip)} days`
                  : 'Milestone COD unaffected (0 days)';

                return (
                  <div className={`bg-white border-2 ${borderClass} rounded-lg p-4 shadow-xs`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[11px] uppercase font-semibold ${textClass} tracking-wider`}>
                        Project COD (15 Dec 2026) Impact
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase ${badgeBg} border`}>
                          {badgeLabel}
                        </span>
                        <WhyButton
                          onClick={() => openWhyExplanation('impact:what-if')}
                          title="Why does this impact occur?"
                        />
                      </div>
                    </div>
                    <div className={`text-[28px] sm:text-3xl font-bold font-mono ${textClass} leading-none`}>
                      {projectSlip > 0 ? `+${projectSlip} days` : projectSlip < 0 ? `${projectSlip} days` : '0 days'}
                    </div>
                    <div className={`mt-2 pt-2 border-t ${borderClass}/60 text-xs text-[#526779] flex items-center justify-between`}>
                      <span>Completion impact:</span>
                      <span className={`font-mono font-semibold ${textClass}`}>
                        {subtext}
                      </span>
                    </div>
                  </div>
                );
              })()}
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
              <div className="bg-[#F3F6FA] border-2 border-[#D8E2EA] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Actual Section Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#D8E2EA]">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#526779]" />
                      <h2 className="text-sm font-bold text-[#142C3F] uppercase tracking-wider">
                        ACTUAL PROJECT STATE
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded text-[11px] font-bold uppercase bg-white border border-[#D8E2EA] text-[#526779]">
                      Live Schedule (Read-Only)
                    </span>
                  </div>

                  <p className="text-xs text-[#526779] leading-relaxed">
                    The live schedule records approved baseline dates, actual field completions, and official contractual milestones. Values in this panel are permanently protected and cannot be changed here.
                  </p>

                  {/* Master Schedule Source Details Section */}
                  <div className="pt-3 border-t border-[#D8E2EA] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#142C3F]">
                          {selectedActivity.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase bg-[#EAF0F5] text-[#526779] border border-[#D8E2EA]">
                          {selectedActivity.discipline}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-[#FCE8E4] text-[#A24335] border border-[#E4B0AA]">
                        Critical Path (0d Float)
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-[#142C3F]">{selectedActivity.name}</h3>
                      <p className="text-xs text-[#526779] mt-0.5">
                        {selectedActivity.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-[#526779] block">
                          Current Planned Start
                        </span>
                        <span className="font-mono text-[#142C3F] font-medium">
                          {formatFriendlyDate(selectedActivity.plannedStart)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-[#526779] block">
                          Current Planned Finish
                        </span>
                        <span className="font-mono font-medium text-[#142C3F]">
                          {formatFriendlyDate(selectedActivity.plannedFinish)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-[#526779] block">
                          Area / WBS Location
                        </span>
                        <span className="text-[#526779] truncate block">
                          {selectedActivity.area} ({selectedActivity.wbs})
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-[#526779] block">
                          Assigned Lead Engineer
                        </span>
                        <span className="text-[#526779] truncate block">
                          {selectedActivity.assignedEngineer}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contractual Milestones Baseline Section */}
                  <div className="pt-3 border-t border-[#D8E2EA] space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#526779] block">
                      Approved Key Milestones (Baseline V3)
                    </span>
                    <div className="divide-y divide-[#D8E2EA] border border-[#D8E2EA] rounded bg-white text-xs">
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-[#142C3F]">Mechanical Completion</span>
                        <span className="font-mono font-medium text-[#142C3F]">15 Nov 2026</span>
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-[#142C3F]">Commercial Operation Date (COD)</span>
                        <span className="font-mono font-semibold text-[#142C3F]">15 Dec 2026</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Isolation Guarantee */}
                <div className="mt-4 pt-3 border-t border-[#D8E2EA] flex items-center gap-2 text-xs text-[#526779]">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                  <span>Master schedule locked · Field records protected against simulation writes.</span>
                </div>
              </div>

              {/* ===================================================================
                  COLUMN 2: SIMULATION (Isolated Scenario Sandbox)
                  =================================================================== */}
              <div className="bg-white border-2 border-amber-500/70 rounded-lg p-4 sm:p-6 md:p-6 shadow-xs flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Simulation Section Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#D8E2EA]">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-700" />
                      <h2 className="text-sm font-bold text-[#142C3F] uppercase tracking-wider">
                        SIMULATION
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                      Isolated Sandbox
                    </span>
                  </div>

                  <p className="text-xs text-[#526779] leading-relaxed">
                    Adjust hypothetical duration shifts and examine projected cascading impacts. Changes made in this panel stay strictly within the sandbox.
                  </p>

                  {/* Scenario Presets & Title */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#142C3F] uppercase tracking-wider">
                        Scenario Title *
                      </label>
                      <span className="text-[11px] text-[#7B8798]">Experimental run label</span>
                    </div>

                    <input
                      type="text"
                      value={scenarioName}
                      onChange={(e) => {
                        setScenarioName(e.target.value);
                        setIsCustomName(true);
                      }}
                      placeholder="e.g. Foundation Block A Curing Hold (+4d)"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D8E2EA] rounded-lg text-[#142C3F] font-medium outline-hidden focus:border-[#0F6B68] focus:ring-1 focus:ring-[#0F6B68]"
                    />

                    {/* Quick Presets */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="text-[#7B8798]">Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomName(true);
                          setScenarioName('Foundation Block A Curing Hold (+4d)');
                          setSelectedActivityId('CIV-11-001');
                          setDelayDays(4);
                        }}
                        className="px-3 py-0.5 rounded bg-[#EAF0F5] hover:bg-[#D4E8F0] text-[#0F6B68] text-[10px] font-bold transition-colors border border-[#D8E2EA]"
                      >
                        Foundation +4d
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomName(true);
                          setScenarioName('Monsoon Surge on HP Header (+7d)');
                          setSelectedActivityId('PIP-24-001');
                          setDelayDays(7);
                        }}
                        className="px-3 py-0.5 rounded bg-[#EAF0F5] hover:bg-[#D8E2EA] text-[#142C3F] text-[10px] font-medium transition-colors"
                      >
                        Monsoon Surge (+7d)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomName(true);
                          setScenarioName('Double-Shift Welding Acceleration (-3d)');
                          setSelectedActivityId('PIP-24-002');
                          setDelayDays(-3);
                        }}
                        className="px-3 py-0.5 rounded bg-[#E4F4EC] hover:bg-[#D5EEDB] text-[#2E7D5B] text-[10px] font-bold transition-colors"
                      >
                        Welding Acceleration (-3d)
                      </button>
                    </div>
                  </div>

                  {/* Target Activity Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#142C3F] uppercase tracking-wider block">
                      Target Activity to Vary *
                    </label>
                    <select
                      value={selectedActivityId}
                      onChange={(e) => setSelectedActivityId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D8E2EA] rounded-lg font-medium text-[#142C3F] outline-hidden focus:border-[#0F6B68] shadow-xs"
                    >
                      {SIMULATION_ACTIVITIES.map((act) => (
                        <option key={act.id} value={act.id}>
                          {act.id} — {act.name} ({act.discipline})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Schedule Shift Stepper & Slider */}
                  <div className="p-4 rounded-lg bg-[#F3F6FA] border border-[#D8E2EA] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#142C3F]">Hypothetical Schedule Shift</span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${
                          delayDays > 0
                            ? 'bg-[#FCE8E4] text-[#A24335] border border-[#E4B0AA]'
                            : delayDays < 0
                            ? 'bg-[#E4F4EC] text-[#2E7D5B] border border-[#B8DCC9]'
                            : 'bg-white text-[#526779] border border-[#D8E2EA]'
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
                        className="w-full accent-[#0F6B68] cursor-pointer"
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
                              ? 'bg-[#0F6B68] text-white shadow-xs'
                              : 'bg-white border border-[#D8E2EA] text-[#526779] hover:bg-[#EAF0F5]'
                          }`}
                        >
                          {d > 0 ? `+${d}d` : `${d}d`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Date Change Override */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#142C3F] uppercase tracking-wider block">
                      Optional Projected Date Override
                    </label>
                    <input
                      type="date"
                      value={optionalDateChange}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D8E2EA] rounded-lg text-[#142C3F] font-mono font-medium outline-hidden focus:border-[#0F6B68]"
                    />
                  </div>
                </div>

                {/* Run CTA Button */}
                <div className="mt-4 pt-3 border-t border-[#D8E2EA]">
                  <button
                    type="button"
                    onClick={handleRunScenario}
                    className="w-full py-2 px-4 bg-[#0F6B68] hover:bg-[#135A72] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run What-If Simulation</span>
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
                {(() => {
                  const downstreamAll = simulationResult.affectedActivities.filter((a) => a.activityId !== selectedActivityId);
                  const shiftedList = downstreamAll.filter((a) => Math.abs(a.shiftDays) > 0);
                  const absorbedList = downstreamAll.filter((a) => a.shiftDays === 0);

                  return (
                    <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 sm:p-6 shadow-xs space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#D8E2EA]/60">
                        <div>
                          <h3 className="text-sm font-bold text-[#142C3F] uppercase tracking-wider">
                            Affected activities
                          </h3>
                          <p className="text-xs text-[#526779] mt-0.5">
                            Downstream handoffs and work packages evaluated for simulated {delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`} perturbation on {selectedActivityId}.
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-[#F3F6FA] border border-[#D8E2EA] text-[#142C3F]">
                          {shiftedList.length} Shifted · {absorbedList.length} Float-Absorbed
                        </span>
                      </div>

                      {/* Explicit Badges of Affected Activities */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {downstreamAll.map((act) => {
                          const hasShift = Math.abs(act.shiftDays) > 0;
                          return (
                            <span
                              key={act.activityId}
                              className={`px-3 py-1 rounded-md text-xs font-medium border inline-flex items-center gap-2 ${
                                hasShift
                                  ? 'bg-[#FCE8E4]/50 text-[#142C3F] border-[#E4B0AA]'
                                  : 'bg-[#F3F6FA] text-[#526779] border-[#D8E2EA]'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  hasShift ? 'bg-[#A24335]' : 'bg-[#7B8798]'
                                }`}
                              />
                              <strong className="font-mono text-[#0F6B68]">{act.activityId}</strong>
                              <span>{act.name}</span>
                              <span
                                className={`font-mono text-[11px] font-bold ${
                                  hasShift ? 'text-[#A24335]' : 'text-[#526779]'
                                }`}
                              >
                                {act.shiftDays > 0
                                  ? `(+${act.shiftDays}d)`
                                  : act.shiftDays < 0
                                  ? `(${act.shiftDays}d)`
                                  : '(0d · Absorbed)'}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Downstream Dependency Chain Visualization (Static 2D Gantt/Timeline nodes) */}
                <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 sm:p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#0F6B68]" />
                      <h3 className="text-xs font-bold text-[#142C3F] uppercase tracking-wider">
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
                                  ? 'bg-[#EAF0F5] border-[#0F6B68] shadow-xs'
                                  : node.shiftDays > 0
                                  ? 'bg-[#FCE8E4]/50 border-[#E4B0AA]'
                                  : 'bg-[#F3F6FA] border-[#D8E2EA]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono font-bold text-[11px] text-[#0F6B68]">
                                  {node.id}
                                </span>
                                {isSource ? (
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#0F6B68] text-white">
                                    Trigger
                                  </span>
                                ) : node.shiftDays > 0 ? (
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#FCE8E4] text-[#A24335] border border-[#E4B0AA]">
                                    +{node.shiftDays}d Slip
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#E4F4EC] text-[#2E7D5B] border border-[#B8DCC9]">
                                    On Target
                                  </span>
                                )}
                              </div>

                              <p className="font-semibold text-[#142C3F] text-[11px] truncate mb-2">
                                {node.name}
                              </p>

                              <div className="space-y-0.5 text-[10px] font-mono pt-2 border-t border-[#D8E2EA]/60">
                                <div className="flex justify-between text-[#7B8798]">
                                  <span>Current:</span>
                                  <span>{formatFriendlyDate(node.currentFinish)}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                  <span className="text-[#0F6B68]">Simulated:</span>
                                  <span className={node.shiftDays > 0 ? 'text-[#A24335]' : 'text-[#142C3F]'}>
                                    {formatFriendlyDate(node.simulatedFinish)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {!isLast && (
                              <div className="flex flex-col items-center justify-center shrink-0 text-[#7B8798]">
                                <span className="text-[9px] font-mono font-bold text-[#526779]">FS +0d</span>
                                <ArrowRight className="w-4 h-4 text-[#0F6B68]" />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Affected Activities Table */}
                <div className="bg-white border border-[#D8E2EA] rounded-lg shadow-xs overflow-hidden">
                  <div className="px-4 sm:px-6 py-4 border-b border-[#D8E2EA] bg-[#F3F6FA] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#142C3F] uppercase tracking-wider">
                        Affected Activities Schedule
                      </h3>
                      <p className="text-xs text-[#526779] mt-0.5">
                        Downstream schedule shifts derived from Critical Path predecessor-successor graph.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-[#526779]">
                      Total: {simulationResult.affectedActivities.length} activities
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left border-collapse text-sm">
                      <thead className="sticky top-0 z-10 bg-[#F3F6FA]">
                        <tr className="bg-[#F3F6FA] border-b border-[#D8E2EA] text-[11px] sm:text-xs uppercase font-semibold text-[#526779] tracking-wider h-11">
                          <th className="py-3 px-4">Activity</th>
                          <th className="py-3 px-4">Discipline / Area</th>
                          <th className="py-3 px-4">Current Date</th>
                          <th className="py-3 px-4">Simulated Date</th>
                          <th className="py-3 px-4">Shift</th>
                          <th className="py-3 px-4">CPM Impact</th>
                          <th className="py-3 px-4 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D8E2EA]/60">
                        {simulationResult.affectedActivities.map((act) => (
                          <tr
                            key={act.activityId}
                            onClick={() => setSelectedActivityDetail(act)}
                            className="h-11 sm:h-12 hover:bg-[#EAF0F5]/60 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#0F6B68]">
                                  {act.activityId}
                                </span>
                                <span className="font-semibold text-[#142C3F] max-w-xs truncate">
                                  {act.name}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="text-[#526779]">
                                {act.discipline} · {act.area}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-mono text-[#526779]">
                              {formatFriendlyDate(act.currentDate)}
                            </td>

                            <td className="py-3 px-4 font-mono font-bold text-[#142C3F]">
                              {formatFriendlyDate(act.simulatedDate)}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                  act.shiftDays > 0
                                    ? 'bg-[#FCE8E4] text-[#A24335] border border-[#E4B0AA]'
                                    : act.shiftDays < 0
                                    ? 'bg-[#E4F4EC] text-[#2E7D5B] border border-[#B8DCC9]'
                                    : 'bg-[#EAF0F5] text-[#526779]'
                                }`}
                              >
                                {act.shiftDays > 0 ? `+${act.shiftDays} days` : `${act.shiftDays} days`}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  act.pathImpact === 'Critical Path Slip'
                                    ? 'bg-[#FCE8E4] text-[#A24335] border border-[#E4B0AA]'
                                    : act.pathImpact === 'Float Buffer Consumed'
                                    ? 'bg-[#FFF1D3] text-[#8C5311] border border-[#F0D4A6]'
                                    : 'bg-[#E4F4EC] text-[#2E7D5B] border border-[#B8DCC9]'
                                }`}
                              >
                                {act.pathImpact}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <span className="text-xs font-semibold text-[#0F6B68] group-hover:underline">
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
                <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#D8E2EA]/60 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#0F6B68]" />
                      <h3 className="text-sm font-bold text-[#142C3F] uppercase tracking-wider">
                        Downstream Milestone & Critical Path Impact
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {simulationResult.milestones.map((ms) => (
                      <div
                        key={ms.id}
                        className="p-4 rounded-lg border bg-[#F3F6FA] border-[#D8E2EA] text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-[#0F6B68]">
                            {ms.id}
                          </span>
                          <StatusBadge
                            status={ms.status === 'Critical Slip' ? 'Delayed' : 'On Track'}
                            size="xs"
                          />
                        </div>

                        <h5 className="font-semibold text-[#142C3F] text-xs line-clamp-1">{ms.name}</h5>

                        <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#D8E2EA]/60 text-[11px] font-mono">
                          <div>
                            <span className="text-[10px] text-[#526779] uppercase font-semibold block">Baseline</span>
                            <span>{formatFriendlyDate(ms.currentDate)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#526779] uppercase font-semibold block">Simulated</span>
                            <span className={ms.shiftDays > 0 ? 'text-[#A24335] font-bold' : 'text-[#142C3F]'}>
                              {formatFriendlyDate(ms.simulatedDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Engineering Mitigation Suggestions */}
                  {simulationResult.impactSummary.mitigationSuggestions.length > 0 && (
                    <div className="p-4 rounded-lg bg-[#F0F4F8] border border-[#D8E2EA] text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-[#142C3F]">
                        <ShieldCheck className="w-4 h-4 text-[#0F6B68]" />
                        <span>Recommended Engineering Mitigation Strategies</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[#526779] text-xs">
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
            <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 sm:p-6 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#142C3F]">Session Scenarios (Temporary)</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EAF0F5] text-[#526779] border border-[#D8E2EA]">
                    In-Memory Only
                  </span>
                </div>
                <p className="text-xs text-[#526779] mt-0.5">
                  Stored what-if simulations available during current session for comparative analysis. Scenarios are held in browser memory and reset when session closes.
                </p>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F6B68] hover:bg-[#135A72] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Current Scenario</span>
              </button>
            </div>

            {savedScenarios.length === 0 ? (
              <EmptyState
                icon={Sliders}
                title="No saved scenarios in current session"
                description="Save simulations from the Scenario Sandbox to compare baseline variants and contingency options during your session."
                action={{
                  label: 'Switch to Simulator',
                  onClick: () => setActiveTab('simulator'),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {savedScenarios.map((sc) => (
                <div
                  key={sc.id}
                  className="bg-white border border-[#D8E2EA] rounded-lg p-4 sm:p-6 shadow-xs hover:border-[#0F6B68] transition-colors flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#0F6B68]">{sc.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          sc.delayDays > 0
                            ? 'bg-[#FCE8E4] text-[#A24335]'
                            : 'bg-[#E4F4EC] text-[#2E7D5B]'
                        }`}
                      >
                        {sc.delayDays > 0 ? `+${sc.delayDays}d Delay` : `${sc.delayDays}d Crash`}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[#142C3F]">{sc.name}</h3>
                    <p className="text-xs text-[#526779] line-clamp-2 leading-relaxed">
                      {sc.description}
                    </p>

                    <div className="pt-2 border-t border-[#D8E2EA]/60 text-xs space-y-1">
                      <div className="flex justify-between text-[#7B8798]">
                        <span>Source Activity:</span>
                        <span className="font-mono font-bold text-[#142C3F]">{sc.sourceActivityId}</span>
                      </div>
                      <div className="flex justify-between text-[#7B8798]">
                        <span>Created By:</span>
                        <span className="text-[#142C3F] truncate max-w-[150px]">{sc.createdBy}</span>
                      </div>
                      <div className="flex justify-between text-[#7B8798]">
                        <span>Timestamp:</span>
                        <span className="text-[#526779] font-mono">{sc.createdAt}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {sc.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-[#EAF0F5] text-[#526779] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#D8E2EA]/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleLoadScenario(sc)}
                      className="flex-1 py-1.5 px-3 bg-white hover:bg-[#EAF0F5] text-[#0F6B68] border border-[#D8E2EA] text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-[#0F6B68]" />
                      <span>Load Scenario</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedScenarioForComparison(sc);
                        setIsCompareModalOpen(true);
                      }}
                      className="p-2 border border-[#D8E2EA] hover:bg-[#EAF0F5] rounded-lg text-[#526779] hover:text-[#142C3F] transition-colors"
                      title="Compare with baseline"
                    >
                      <GitCompare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteScenario(sc.id, sc.name)}
                      className="p-2 border border-[#D8E2EA] hover:bg-[#FCE8E4] rounded-lg text-[#526779] hover:text-[#A24335] transition-colors"
                      title="Delete saved scenario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* =========================================================================
            MODAL: SAVE SCENARIO
            ========================================================================= */}
        <Modal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          title="Save Simulation Scenario to Current Session"
          subtitle="Save parameters to current browser session memory for side-by-side comparison. Note: Session scenarios reset when session closes."
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#526779] hover:text-[#142C3F] rounded-lg border border-[#D8E2EA] hover:bg-[#F3F6FA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScenario}
                className="px-4 py-2 bg-[#0F6B68] hover:bg-[#135A72] text-white text-xs font-bold rounded-lg shadow-xs border border-[#0F6B68] transition-colors"
              >
                Save to Session
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#142C3F] block mb-1">Scenario Title *</label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => {
                  setScenarioName(e.target.value);
                  setIsCustomName(true);
                }}
                className="w-full px-3 py-2 bg-white border border-[#D8E2EA] rounded-lg text-[#142C3F] outline-hidden focus:border-[#0F6B68]"
              />
            </div>
            <div>
              <label className="font-bold text-[#142C3F] block mb-1">Description / Assumptions</label>
              <textarea
                rows={3}
                value={scenarioDescription}
                onChange={(e) => {
                  setScenarioDescription(e.target.value);
                  setIsCustomName(true);
                }}
                className="w-full px-3 py-2 bg-white border border-[#D8E2EA] rounded-lg text-[#142C3F] outline-hidden focus:border-[#0F6B68] resize-none"
              />
            </div>
            <div className="p-3 bg-[#F3F6FA] rounded-lg border border-[#D8E2EA] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#7B8798]">Source Activity:</span>
                <span className="font-mono font-bold text-[#142C3F]">{selectedActivityId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7B8798]">Delay Days:</span>
                <span className="font-mono font-bold text-[#0F6B68]">
                  {delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7B8798]">Simulated Finish:</span>
                <span className="font-mono font-bold text-[#142C3F]">
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
          subtitle="Compare baseline schedule vs active simulation vs saved session scenarios side-by-side."
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="px-4 py-2 bg-white text-[#142C3F] border border-[#D8E2EA] hover:bg-[#F3F6FA] text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                Close Comparison
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[#F3F6FA]">
                  <tr className="bg-[#F3F6FA] border-b border-[#D8E2EA] text-[11px] sm:text-xs uppercase font-semibold text-[#526779] h-11">
                    <th className="py-3 px-4">Metric / Dimension</th>
                    <th className="py-3 px-4 bg-[#E4F4EC]/40 text-[#2E7D5B]">
                      Baseline (Rev 3.2 (P6 XML))
                    </th>
                    <th className="py-3 px-4 bg-[#EAF0F5]/60 text-[#0F6B68]">
                      Active Simulation
                    </th>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <th key={sc.id} className="py-3 px-4 text-[#142C3F]">
                        {sc.name.slice(0, 20)}...
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E2EA]/60">
                  <tr className="h-11 sm:h-12">
                    <td className="py-3 px-4 font-bold text-[#142C3F]">Scenario Status</td>
                    <td className="py-3 px-4 font-semibold text-[#2E7D5B]">Active Baseline</td>
                    <td className="py-3 px-4 font-bold text-[#0F6B68]">Current Sandbox</td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-3 px-4 text-[#526779]">
                        Session ({sc.id})
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-[#142C3F]">Source Activity</td>
                    <td className="py-2 px-4 font-mono text-[#526779]">None (0d delta)</td>
                    <td className="py-2 px-4 font-mono font-bold text-[#0F6B68]">{selectedActivityId}</td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-2 px-4 font-mono text-[#526779]">
                        {sc.sourceActivityId}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-[#142C3F]">Applied Delay</td>
                    <td className="py-2 px-4 font-mono text-[#2E7D5B]">0 Days</td>
                    <td className="py-2 px-4 font-mono font-bold text-[#0F6B68]">
                      {delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`}
                    </td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-2 px-4 font-mono text-[#526779]">
                        {sc.delayDays >= 0 ? `+${sc.delayDays}d` : `${sc.delayDays}d`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-[#142C3F]">Target Completion</td>
                    <td className="py-2 px-4 font-mono font-bold text-[#142C3F]">15 Dec 2026</td>
                    <td className="py-2 px-4 font-mono font-bold text-[#A24335]">
                      {formatFriendlyDate(simulationResult?.simulatedProjectFinish || '2026-12-15')}
                    </td>
                    {savedScenarios.slice(0, 2).map((sc) => {
                      const simCOD = addDaysToDateString('2026-12-15', sc.delayDays > 0 ? sc.delayDays : 0);
                      return (
                        <td key={sc.id} className="py-2 px-4 font-mono font-bold text-[#526779]">
                          {formatFriendlyDate(simCOD)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-[#142C3F]">Net Variance</td>
                    <td className="py-2 px-4 font-mono text-[#2E7D5B]">0d</td>
                    <td className="py-2 px-4 font-mono font-bold text-[#A24335]">
                      {simulationResult?.differenceDays ? `+${simulationResult.differenceDays}d` : '0d'}
                    </td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-2 px-4 font-mono text-[#526779]">
                        {sc.delayDays > 0 ? `+${sc.delayDays}d` : `${sc.delayDays}d`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-[#142C3F]">Critical Path Status</td>
                    <td className="py-2 px-4 text-[#2E7D5B]">Stable (Float Intact)</td>
                    <td className="py-2 px-4 font-bold text-[#A24335]">
                      {simulationResult?.criticalPathPenetrated ? 'Penetrated' : 'Buffered'}
                    </td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-2 px-4 text-[#526779]">
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
            <div className="space-y-6 text-xs p-1">
              <div className="p-3 rounded-lg bg-[#F3F6FA] border border-[#D8E2EA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#0F6B68]">
                    {selectedActivityDetail.activityId}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedActivityDetail.pathImpact === 'Critical Path Slip'
                        ? 'bg-[#FCE8E4] text-[#A24335] border border-[#E4B0AA]'
                        : 'bg-[#FFF1D3] text-[#8C5311] border border-[#F0D4A6]'
                    }`}
                  >
                    {selectedActivityDetail.pathImpact}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#142C3F]">{selectedActivityDetail.name}</h4>
                <p className="text-[#526779]">
                  {selectedActivityDetail.discipline} · {selectedActivityDetail.area} (WBS {selectedActivityDetail.wbs})
                </p>
              </div>

              {/* Schedule Shift Comparison */}
              <div className="space-y-2">
                <h5 className="font-bold text-[#142C3F] uppercase tracking-wider text-[11px]">
                  Finish Date Comparison
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white border border-[#D8E2EA]">
                    <span className="text-[10px] uppercase font-semibold text-[#526779] block">
                      Current Planned Finish
                    </span>
                    <span className="font-mono text-sm font-semibold text-[#142C3F]">
                      {formatFriendlyDate(selectedActivityDetail.currentDate)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-[#D8E2EA]">
                    <span className="text-[10px] uppercase font-bold text-[#0F6B68] block">
                      Simulated Finish
                    </span>
                    <span className="font-mono text-sm font-bold text-[#A24335]">
                      {formatFriendlyDate(selectedActivityDetail.simulatedDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CPM Driving Reason */}
              <div className="p-4 rounded-lg bg-[#EAF0F5] border border-[#D8E2EA] space-y-2">
                <span className="font-bold text-[#0F6B68] uppercase tracking-wider text-[10px] block">
                  Driving Dependency Relationship
                </span>
                <p className="text-[#142C3F] font-medium leading-relaxed">
                  {selectedActivityDetail.predecessorReason}
                </p>
                <div className="pt-2 border-t border-[#D8E2EA] flex items-center justify-between text-[11px]">
                  <span className="text-[#526779]">Constraint:</span>
                  <span className="font-mono font-bold text-[#0F6B68]">
                    {selectedActivityDetail.dependencyType}
                  </span>
                </div>
              </div>

              {/* Float Breakdown */}
              <div className="p-3 rounded-lg bg-white border border-[#D8E2EA] space-y-2">
                <span className="font-bold text-[#142C3F] uppercase tracking-wider text-[10px] block">
                  Float & Buffer Absorption
                </span>
                <div className="flex justify-between text-xs">
                  <span className="text-[#526779]">Total Float Available:</span>
                  <span className="font-mono font-semibold text-[#142C3F]">
                    {selectedActivityDetail.floatAvailable} days
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#526779]">Float Consumed by Scenario:</span>
                  <span className="font-mono font-semibold text-[#A24335]">
                    {selectedActivityDetail.floatConsumed} days
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-[#D8E2EA]">
                  <span className="font-bold text-[#142C3F]">Net Critical Path Slip:</span>
                  <span className="font-mono font-bold text-[#A24335]">
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
