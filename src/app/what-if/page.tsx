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
import { TermHelp } from '../../components/shared/TermHelp';
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

  // State Management - Default to Baseplate Grouting (+4d delay) matching canonical prompt example
  const [selectedActivityId, setSelectedActivityId] = useState<string>('CIV-11-002');
  const [delayDays, setDelayDays] = useState<number>(4);
  const [optionalDateChange, setOptionalDateChange] = useState<string>('');
  const [isCustomName, setIsCustomName] = useState<boolean>(false);
  const [scenarioName, setScenarioName] = useState<string>('Compressor Bay Baseplate Grouting Curing Hold (+4d)');
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
    setSelectedActivityId('CIV-11-002');
    setDelayDays(0);
    setIsCustomName(false);
    setScenarioName('Baseline Schedule Rev 3.2 (P6 XML) (No Delay)');
    setScenarioDescription('Baseline schedule state with 0 days variance applied.');
    setSimulateError(false);
    setErrorMessage('');
    const res = executeWhatIfSimulation('Baseline Schedule Rev 3.2 (P6 XML)', 'CIV-11-002', 0);
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
        <div className="bg-amber-50 dark:bg-[#2C2114] border-2 border-amber-600 dark:border-amber-500 rounded-lg p-4 sm:p-4 shadow-xs text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-600 text-white shrink-0">
              SIMULATION
            </span>
            <h2 className="font-heading text-sm sm:text-base font-bold tracking-wide text-amber-950 dark:text-[#F3BA63] uppercase">
              SIMULATION — DOES NOT CHANGE THE LIVE SCHEDULE
            </h2>
          </div>
          <p className="text-xs text-amber-900 dark:text-[#F2F4E9]/80 mt-2 leading-relaxed max-w-3xl mx-auto">
            Calculations performed here are isolated scenario projections. This tool <strong>NEVER</strong> modifies the baseline schedule, live project records, or verified actual progress.
          </p>
        </div>

        {/* =========================================================================
            HEADER: Isolated What-If Simulator Workspace
            ========================================================================= */}
        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9E2DA]/60 dark:border-[#3A5146]">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#EAF0E9] dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5] border border-[#D9E2DA] dark:border-[#3A5146]">
                  <Lock className="w-3 h-3 text-[#52665D] dark:text-[#B5C1B5]" />
                  Master Schedule Baseline Locked
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#EAF0E9] dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146]">
                  Predictive CPM Engine
                </span>
              </div>

              <h1 className="font-heading text-[28px] sm:text-3xl font-bold text-[#1A2B25] dark:text-[#F2F4E9] tracking-tight">
                What-if Simulator
              </h1>
              <p className="text-sm text-[#52665D] dark:text-[#B5C1B5] mt-1 max-w-3xl">
                Test hypothetical schedule variations and downstream Critical Path impacts without modifying actual project progress, risks, or schedule records.
              </p>
            </div>

            {/* THE 4 CANONICAL ACTIONS */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 1. Run What-If Simulation */}
              <button
                type="button"
                onClick={handleRunScenario}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white dark:text-[#0B2822] bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:hover:bg-[#5CB69C] border border-[#006B61] dark:border-[#72C6AD] rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run What-If Simulation</span>
              </button>

              {/* 2. Save Scenario */}
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(true)}
                disabled={!simulationResult}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#1A2B25] dark:text-[#F2F4E9] bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-[#52665D] dark:text-[#B5C1B5]" />
                <span>Save Scenario</span>
              </button>

              {/* 3. Compare Scenarios */}
              <button
                type="button"
                onClick={handleOpenCompare}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#1A2B25] dark:text-[#F2F4E9] bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                <span>Compare Scenarios</span>
              </button>

              {/* 4. Reset to Baseline */}
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#52665D] dark:text-[#B5C1B5] bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-lg transition-colors shadow-xs cursor-pointer"
                title="Reset all inputs to baseline"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#52665D] dark:text-[#B5C1B5]" />
                <span>Reset to Baseline</span>
              </button>
            </div>
          </div>

          {/* Quick Tab Switcher */}
          <div className="mt-4 flex items-center justify-between flex-wrap gap-2 pt-2">
            <div className="flex items-center bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeTab === 'simulator'
                    ? 'bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] font-semibold'
                    : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
                }`}
              >
                Scenario Canvas
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === 'saved'
                    ? 'bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] font-semibold'
                    : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
                }`}
              >
                <span>Session Scenarios</span>
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-[#D9E2DA] dark:bg-[#243832] text-[#1A2B25] dark:text-[#F2F4E9] font-mono">
                  {savedScenarios.length}
                </span>
              </button>
            </div>

            <div className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] font-mono">
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
              <div className="bg-white dark:bg-[#17221D] border-2 border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-semibold text-[#52665D] dark:text-[#B5C1B5] tracking-wider truncate max-w-[140px]" title="Selected Activity Baseline Finish">
                    Activity Baseline Finish
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#EAF0E9] dark:bg-[#243832] text-[#1A2B25] dark:text-[#F2F4E9] border border-[#D9E2DA] dark:border-[#3A5146]">
                    {selectedActivity.id}
                  </span>
                </div>
                <div className="text-[28px] sm:text-3xl font-bold font-mono text-[#1A2B25] dark:text-[#F2F4E9] leading-none">
                  {formatShortDate(selectedActivity.plannedFinish)}
                </div>
                <div className="mt-2 pt-2 border-t border-[#D9E2DA]/60 dark:border-[#3A5146] text-xs text-[#52665D] dark:text-[#B5C1B5] flex items-center justify-between">
                  <span>Activity baseline date:</span>
                  <span className="font-mono font-medium text-[#1A2B25] dark:text-[#F2F4E9]">
                    {formatFriendlyDate(selectedActivity.plannedFinish)}
                  </span>
                </div>
              </div>

              {/* Card 2: Scenario */}
              <div className="bg-white dark:bg-[#17221D] border-2 border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-semibold text-[#006B61] dark:text-[#72C6AD] tracking-wider">
                    Scenario
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#EAF0E9] dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146]">
                      Simulation Input
                    </span>
                    <WhyButton
                      onClick={() => openWhyExplanation(`delay:${selectedActivityId}`)}
                      title="Why simulate this delay duration?"
                    />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-[#006B61] dark:text-[#72C6AD] truncate leading-none" title={scenarioDisplay}>
                  {scenarioDisplay}
                </div>
                <div className="mt-2 pt-2 border-t border-[#D9E2DA]/60 dark:border-[#3A5146] text-xs text-[#52665D] dark:text-[#B5C1B5] flex items-center justify-between">
                  <span>Hypothetical shift:</span>
                  <span className="font-mono font-semibold text-[#006B61] dark:text-[#72C6AD]">
                    {delayDays >= 0 ? `+${delayDays} days` : `${delayDays} days`}
                  </span>
                </div>
              </div>

              {/* Card 3: Activity Projected Finish */}
              <div className="bg-white dark:bg-[#17221D] border-2 border-[#DCABA7] dark:border-[#5C2323] rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-semibold text-[#A43B36] dark:text-[#F18B82] tracking-wider">
                    Activity Projected Finish
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#F6E4E1] dark:bg-[#2C1819] text-[#A43B36] dark:text-[#F18B82] border border-[#DCABA7] dark:border-[#5C2323]">
                      Simulated Date
                    </span>
                    <WhyButton
                      onClick={() => openWhyExplanation('impact:what-if')}
                      title="Why does the simulated finish date shift?"
                    />
                  </div>
                </div>
                <div className="text-[28px] sm:text-3xl font-bold font-mono text-[#A43B36] dark:text-[#F18B82] leading-none">
                  {formatShortDate(projectedFinishDate)}
                </div>
                <div className="mt-2 pt-2 border-t border-[#DCABA7]/60 dark:border-[#5C2323] text-xs text-[#52665D] dark:text-[#B5C1B5] flex items-center justify-between">
                  <span>Selected activity simulated finish:</span>
                  <span className="font-mono font-medium text-[#1A2B25] dark:text-[#F2F4E9]">
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
                  ? 'border-[#DCABA7] dark:border-[#5C2323]'
                  : isAccelerated
                  ? 'border-[#A8DEC7] dark:border-[#1E4A3B]'
                  : 'border-[#F4E0A0] dark:border-[#523B19]';
                const textClass = isCriticalSlip
                  ? 'text-[#A43B36] dark:text-[#F18B82]'
                  : isAccelerated
                  ? 'text-[#176B53] dark:text-[#72C6AD]'
                  : 'text-[#825700] dark:text-[#F3BA63]';
                const badgeBg = isCriticalSlip
                  ? 'bg-[#F6E4E1] dark:bg-[#2C1819] text-[#A43B36] dark:text-[#F18B82] border-[#DCABA7] dark:border-[#5C2323]'
                  : isAccelerated
                  ? 'bg-[#EBF7F2] dark:bg-[#122A22] text-[#176B53] dark:text-[#72C6AD] border-[#A8DEC7] dark:border-[#1E4A3B]'
                  : 'bg-[#FEF9E7] dark:bg-[#2C2114] text-[#825700] dark:text-[#F3BA63] border-[#F4E0A0] dark:border-[#523B19]';
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
                  <div className={`bg-white dark:bg-[#17221D] border-2 ${borderClass} rounded-lg p-4 shadow-xs`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[11px] uppercase font-semibold ${textClass} tracking-wider flex items-center gap-1`}>
                        <span>Project COD (15 Dec 2026) Impact</span>
                        <TermHelp term="critical_path" showIcon />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase ${badgeBg} border inline-flex items-center gap-1`}>
                          <span>{badgeLabel}</span>
                          {badgeLabel === 'Float Absorbed' && <TermHelp term="float" showIcon />}
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
                    <div className={`mt-2 pt-2 border-t ${borderClass} text-xs text-[#52665D] dark:text-[#B5C1B5] flex items-center justify-between`}>
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
              <div className="bg-[#F6F7F3] dark:bg-[#243832] border-2 border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Actual Section Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#D9E2DA] dark:border-[#3A5146]">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#52665D] dark:text-[#B5C1B5]" />
                      <h2 className="font-heading text-sm font-bold text-[#1A2B25] dark:text-[#F2F4E9] uppercase tracking-wider">
                        ACTUAL PROJECT STATE
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded text-[11px] font-bold uppercase bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5]">
                      Live Schedule (Read-Only)
                    </span>
                  </div>

                  <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] leading-relaxed">
                    The live schedule records approved baseline dates, actual field completions, and official contractual milestones. Values in this panel are permanently protected and cannot be changed here.
                  </p>

                  {/* Master Schedule Source Details Section */}
                  <div className="pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">
                          {selectedActivity.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase bg-[#EAF0E9] dark:bg-[#17221D] text-[#52665D] dark:text-[#B5C1B5] border border-[#D9E2DA] dark:border-[#3A5146]">
                          {selectedActivity.discipline}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-[#F6E4E1] dark:bg-[#2C1819] text-[#A43B36] dark:text-[#F18B82] border border-[#DCABA7] dark:border-[#5C2323]">
                        Critical Path (0d Float)
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading text-sm font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">{selectedActivity.name}</h3>
                      <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
                        {selectedActivity.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-[#52665D] dark:text-[#B5C1B5] block">
                          Current Planned Start
                        </span>
                        <span className="font-mono text-[#1A2B25] dark:text-[#F2F4E9] font-medium">
                          {formatFriendlyDate(selectedActivity.plannedStart)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-[#52665D] dark:text-[#B5C1B5] block">
                          Current Planned Finish
                        </span>
                        <span className="font-mono font-medium text-[#1A2B25] dark:text-[#F2F4E9]">
                          {formatFriendlyDate(selectedActivity.plannedFinish)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-[#52665D] dark:text-[#B5C1B5] block">
                          Area / WBS Location
                        </span>
                        <span className="text-[#52665D] dark:text-[#B5C1B5] truncate block">
                          {selectedActivity.area} ({selectedActivity.wbs})
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-[#52665D] dark:text-[#B5C1B5] block">
                          Assigned Lead Engineer
                        </span>
                        <span className="text-[#52665D] dark:text-[#B5C1B5] truncate block">
                          {selectedActivity.assignedEngineer}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contractual Milestones Baseline Section */}
                  <div className="pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146] space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#52665D] dark:text-[#B5C1B5] block">
                      Approved Key Milestones (Baseline V3)
                    </span>
                    <div className="divide-y divide-[#D9E2DA] dark:divide-[#3A5146] border border-[#D9E2DA] dark:border-[#3A5146] rounded bg-white dark:bg-[#17221D] text-xs">
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-[#1A2B25] dark:text-[#F2F4E9]">Mechanical Completion</span>
                        <span className="font-mono font-medium text-[#1A2B25] dark:text-[#F2F4E9]">15 Nov 2026</span>
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <span className="font-medium text-[#1A2B25] dark:text-[#F2F4E9]">Commercial Operation Date (COD)</span>
                        <span className="font-mono font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">15 Dec 2026</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Isolation Guarantee */}
                <div className="mt-4 pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center gap-2 text-xs text-[#52665D] dark:text-[#B5C1B5]">
                  <CheckCircle2 className="w-4 h-4 text-[#176B53] dark:text-[#72C6AD] shrink-0" />
                  <span>Master schedule locked · Field records protected against simulation writes.</span>
                </div>
              </div>

              {/* ===================================================================
                  COLUMN 2: SIMULATION (Isolated Scenario Sandbox)
                  =================================================================== */}
              <div className="bg-white dark:bg-[#17221D] border-2 border-amber-500/70 dark:border-amber-600/70 rounded-lg p-4 sm:p-6 md:p-6 shadow-xs flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Simulation Section Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#D9E2DA] dark:border-[#3A5146]">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                      <h2 className="font-heading text-sm font-bold text-[#1A2B25] dark:text-[#F2F4E9] uppercase tracking-wider">
                        SIMULATION
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                      Isolated Sandbox
                    </span>
                  </div>

                  <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] leading-relaxed">
                    Adjust hypothetical duration shifts and examine projected cascading impacts. Changes made in this panel stay strictly within the sandbox.
                  </p>

                  {/* Scenario Presets & Title */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9] uppercase tracking-wider">
                        Scenario Title *
                      </label>
                      <span className="text-[11px] text-[#738A80] dark:text-[#B5C1B5]">Experimental run label</span>
                    </div>

                    <input
                      type="text"
                      value={scenarioName}
                      onChange={(e) => {
                        setScenarioName(e.target.value);
                        setIsCustomName(true);
                      }}
                      placeholder="e.g. Foundation Block A Curing Hold (+4d)"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-[#1A2B25] dark:text-[#F2F4E9] font-medium outline-hidden focus:border-[#006B61] dark:focus:border-[#72C6AD] focus:ring-1 focus:ring-[#006B61]"
                    />

                    {/* Quick Presets */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="text-[#738A80] dark:text-[#B5C1B5]">Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomName(true);
                          setScenarioName('Compressor Bay Baseplate Grouting Curing Hold (+4d)');
                          setSelectedActivityId('CIV-11-002');
                          setDelayDays(4);
                        }}
                        className="px-3 py-0.5 rounded bg-[#EAF0E9] dark:bg-[#243832] hover:bg-[#D4E8F0] dark:hover:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] text-[10px] font-bold transition-colors border border-[#D9E2DA] dark:border-[#3A5146] cursor-pointer"
                      >
                        Baseplate Grouting +4d
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomName(true);
                          setScenarioName('Monsoon Surge on HP Header (+7d)');
                          setSelectedActivityId('PIP-24-001');
                          setDelayDays(7);
                        }}
                        className="px-3 py-0.5 rounded bg-[#EAF0E9] dark:bg-[#243832] hover:bg-[#D9E2DA] dark:hover:bg-[#243832] text-[#1A2B25] dark:text-[#F2F4E9] text-[10px] font-medium transition-colors border border-[#D9E2DA] dark:border-[#3A5146] cursor-pointer"
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
                        className="px-3 py-0.5 rounded bg-[#E4F1E9] dark:bg-[#122A22] hover:bg-[#D5EEDB] dark:hover:bg-[#1E4A3B] text-[#176B53] dark:text-[#72C6AD] text-[10px] font-bold transition-colors border border-[#B7DAC3] dark:border-[#1E4A3B] cursor-pointer"
                      >
                        Welding Acceleration (-3d)
                      </button>
                    </div>
                  </div>

                  {/* Target Activity Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9] uppercase tracking-wider block">
                      Target Activity to Vary *
                    </label>
                    <select
                      value={selectedActivityId}
                      onChange={(e) => setSelectedActivityId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg font-medium text-[#1A2B25] dark:text-[#F2F4E9] outline-hidden focus:border-[#006B61] dark:focus:border-[#72C6AD] shadow-xs cursor-pointer"
                    >
                      {SIMULATION_ACTIVITIES.map((act) => (
                        <option key={act.id} value={act.id}>
                          {act.id} — {act.name} ({act.discipline})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Schedule Shift Stepper & Slider */}
                  <div className="p-4 rounded-lg bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9]">Hypothetical Schedule Shift</span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${
                          delayDays > 0
                            ? 'bg-[#F6E4E1] dark:bg-[#2C1819] text-[#A43B36] dark:text-[#F18B82] border border-[#DCABA7] dark:border-[#5C2323]'
                            : delayDays < 0
                            ? 'bg-[#E4F1E9] dark:bg-[#122A22] text-[#176B53] dark:text-[#72C6AD] border border-[#B7DAC3] dark:border-[#1E4A3B]'
                            : 'bg-white dark:bg-[#17221D] text-[#52665D] dark:text-[#B5C1B5] border border-[#D9E2DA] dark:border-[#3A5146]'
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
                        className="w-full accent-[#006B61] dark:accent-[#72C6AD] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#738A80] dark:text-[#B5C1B5] font-mono">
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
                          className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                            delayDays === d
                              ? 'bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] shadow-xs'
                              : 'bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                          }`}
                        >
                          {d > 0 ? `+${d}d` : `${d}d`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Date Change Override */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9] uppercase tracking-wider block">
                      Optional Projected Date Override
                    </label>
                    <input
                      type="date"
                      value={optionalDateChange}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-[#1A2B25] dark:text-[#F2F4E9] font-mono font-medium outline-hidden focus:border-[#006B61] dark:focus:border-[#72C6AD]"
                    />
                  </div>

                {/* Run CTA Button */}
                <div className="mt-4 pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146]">
                  <button
                    type="button"
                    onClick={handleRunScenario}
                    className="w-full py-2 px-4 bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:text-[#0B2822] dark:hover:bg-[#5CB69C] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run What-If Simulation</span>
                  </button>
                </div>
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
                    <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 shadow-xs space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#D9E2DA]/60 dark:border-[#3A5146]">
                        <div>
                          <h3 className="font-heading text-sm font-bold text-[#1A2B25] dark:text-[#F2F4E9] uppercase tracking-wider">
                            Affected activities
                          </h3>
                          <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
                            Downstream handoffs and work packages evaluated for simulated {delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`} perturbation on {selectedActivityId}.
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] text-[#1A2B25] dark:text-[#F2F4E9]">
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
                                  ? 'bg-[#F6E4E1]/50 dark:bg-[#2C1819]/50 text-[#1A2B25] dark:text-[#F2F4E9] border-[#DCABA7] dark:border-[#5C2323]'
                                  : 'bg-[#F6F7F3] dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5] border-[#D9E2DA] dark:border-[#3A5146]'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  hasShift ? 'bg-[#92372F] dark:bg-[#F18B82]' : 'bg-[#738A80] dark:bg-[#B5C1B5]'
                                }`}
                              />
                              <strong className="font-mono text-[#006B61] dark:text-[#72C6AD]">{act.activityId}</strong>
                              <span>{act.name}</span>
                              <span
                                className={`font-mono text-[11px] font-bold ${
                                  hasShift ? 'text-[#A43B36] dark:text-[#F18B82]' : 'text-[#52665D] dark:text-[#B5C1B5]'
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
                <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
                      <h3 className="font-heading text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9] uppercase tracking-wider">
                        Downstream Critical Path Cascade
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-[#738A80] dark:text-[#B5C1B5]">
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
                                  ? 'bg-[#EAF0E9] dark:bg-[#243832] border-[#006B61] dark:border-[#72C6AD] shadow-xs'
                                  : node.shiftDays > 0
                                  ? 'bg-[#F6E4E1]/50 dark:bg-[#2C1819]/50 border-[#DCABA7] dark:border-[#5C2323]'
                                  : 'bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono font-bold text-[11px] text-[#006B61] dark:text-[#72C6AD]">
                                  {node.id}
                                </span>
                                {isSource ? (
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822]">
                                    Trigger
                                  </span>
                                ) : node.shiftDays > 0 ? (
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#F6E4E1] dark:bg-[#2C1819] text-[#A43B36] dark:text-[#F18B82] border border-[#DCABA7] dark:border-[#5C2323]">
                                    +{node.shiftDays}d Slip
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#E4F1E9] dark:bg-[#122A22] text-[#176B53] dark:text-[#72C6AD] border border-[#B7DAC3] dark:border-[#1E4A3B]">
                                    On Target
                                  </span>
                                )}
                              </div>

                              <p className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9] text-[11px] truncate mb-2">
                                {node.name}
                              </p>

                              <div className="space-y-0.5 text-[10px] font-mono pt-2 border-t border-[#D9E2DA]/60 dark:border-[#3A5146]">
                                <div className="flex justify-between text-[#738A80] dark:text-[#B5C1B5]">
                                  <span>Current:</span>
                                  <span>{formatFriendlyDate(node.currentFinish)}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                  <span className="text-[#006B61] dark:text-[#72C6AD]">Simulated:</span>
                                  <span className={node.shiftDays > 0 ? 'text-[#A43B36] dark:text-[#F18B82]' : 'text-[#1A2B25] dark:text-[#F2F4E9]'}>
                                    {formatFriendlyDate(node.simulatedFinish)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {!isLast && (
                              <div className="flex flex-col items-center justify-center shrink-0 text-[#738A80] dark:text-[#B5C1B5]">
                                <span className="text-[9px] font-mono font-bold text-[#52665D] dark:text-[#B5C1B5]">FS +0d</span>
                                <ArrowRight className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Affected Activities Table */}
                <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg shadow-xs overflow-hidden">
                  <div className="px-4 sm:px-6 py-4 border-b border-[#D9E2DA] dark:border-[#3A5146] bg-[#F6F7F3] dark:bg-[#243832] flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-sm font-bold text-[#1A2B25] dark:text-[#F2F4E9] uppercase tracking-wider">
                        Affected Activities Schedule
                      </h3>
                      <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
                        Downstream schedule shifts derived from Critical Path predecessor-successor graph.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-[#52665D] dark:text-[#B5C1B5]">
                      Total: {simulationResult.affectedActivities.length} activities
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left border-collapse text-sm">
                      <thead className="sticky top-0 z-10 bg-[#F6F7F3] dark:bg-[#243832]">
                        <tr className="bg-[#F6F7F3] dark:bg-[#243832] border-b border-[#D9E2DA] dark:border-[#3A5146] text-[11px] sm:text-xs uppercase font-semibold text-[#52665D] dark:text-[#B5C1B5] tracking-wider h-11">
                          <th className="py-3 px-4">Activity</th>
                          <th className="py-3 px-4">Discipline / Area</th>
                          <th className="py-3 px-4">Current Date</th>
                          <th className="py-3 px-4">Simulated Date</th>
                          <th className="py-3 px-4">Shift</th>
                          <th className="py-3 px-4">CPM Impact</th>
                          <th className="py-3 px-4 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D9E2DA]/60 dark:divide-[#3A5146]">
                        {simulationResult.affectedActivities.map((act) => (
                          <tr
                            key={act.activityId}
                            onClick={() => setSelectedActivityDetail(act)}
                            className="h-11 sm:h-12 hover:bg-[#EAF0E9]/60 dark:hover:bg-[#243832]/60 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#006B61] dark:text-[#72C6AD]">
                                  {act.activityId}
                                </span>
                                <span className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9] max-w-xs truncate">
                                  {act.name}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="text-[#52665D] dark:text-[#B5C1B5]">
                                {act.discipline} · {act.area}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-mono text-[#52665D] dark:text-[#B5C1B5]">
                              {formatFriendlyDate(act.currentDate)}
                            </td>

                            <td className="py-3 px-4 font-mono font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                              {formatFriendlyDate(act.simulatedDate)}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                  act.shiftDays > 0
                                    ? 'bg-[#F6E4E1] dark:bg-[#2C1819] text-[#A43B36] dark:text-[#F18B82] border border-[#DCABA7] dark:border-[#5C2323]'
                                    : act.shiftDays < 0
                                    ? 'bg-[#E4F1E9] dark:bg-[#122A22] text-[#176B53] dark:text-[#72C6AD] border border-[#B7DAC3] dark:border-[#1E4A3B]'
                                    : 'bg-[#EAF0E9] dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5]'
                                }`}
                              >
                                {act.shiftDays > 0 ? `+${act.shiftDays} days` : `${act.shiftDays} days`}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  act.pathImpact === 'Critical Path Slip'
                                    ? 'bg-[#F6E4E1] dark:bg-[#2C1819] text-[#A43B36] dark:text-[#F18B82] border border-[#DCABA7] dark:border-[#5C2323]'
                                    : act.pathImpact === 'Float Buffer Consumed'
                                    ? 'bg-[#F8EFDA] dark:bg-[#2C2114] text-[#825700] dark:text-[#F3BA63] border border-[#E5C185] dark:border-[#523B19]'
                                    : 'bg-[#E4F1E9] dark:bg-[#122A22] text-[#176B53] dark:text-[#72C6AD] border border-[#B7DAC3] dark:border-[#1E4A3B]'
                                }`}
                              >
                                {act.pathImpact}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <span className="text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] group-hover:underline">
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
                <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#D9E2DA]/60 dark:border-[#3A5146] flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
                      <h3 className="font-heading text-sm font-bold text-[#1A2B25] dark:text-[#F2F4E9] uppercase tracking-wider">
                        Downstream Milestone & Critical Path Impact
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {simulationResult.milestones.map((ms) => (
                      <div
                        key={ms.id}
                        className="p-4 rounded-lg border bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146] text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-[#006B61] dark:text-[#72C6AD]">
                            {ms.id}
                          </span>
                          <StatusBadge
                            status={ms.status === 'Critical Slip' ? 'Delayed' : 'On Track'}
                            size="xs"
                          />
                        </div>

                        <h5 className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9] text-xs line-clamp-1">{ms.name}</h5>

                        <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#D9E2DA]/60 dark:border-[#3A5146] text-[11px] font-mono">
                          <div>
                            <span className="text-[10px] text-[#52665D] dark:text-[#B5C1B5] uppercase font-semibold block">Baseline</span>
                            <span className="text-[#1A2B25] dark:text-[#F2F4E9]">{formatFriendlyDate(ms.currentDate)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#52665D] dark:text-[#B5C1B5] uppercase font-semibold block">Simulated</span>
                            <span className={ms.shiftDays > 0 ? 'text-[#A43B36] dark:text-[#F18B82] font-bold' : 'text-[#1A2B25] dark:text-[#F2F4E9]'}>
                              {formatFriendlyDate(ms.simulatedDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Engineering Mitigation Suggestions */}
                  {simulationResult.impactSummary.mitigationSuggestions.length > 0 && (
                    <div className="p-4 rounded-lg bg-[#F0F4F8] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                        <ShieldCheck className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
                        <span>Recommended Engineering Mitigation Strategies</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[#52665D] dark:text-[#B5C1B5] text-xs">
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
            <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-base font-bold text-[#1A2B25] dark:text-[#F2F4E9]">Session Scenarios (Temporary)</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EAF0E9] dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5] border border-[#D9E2DA] dark:border-[#3A5146]">
                    In-Memory Only
                  </span>
                </div>
                <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
                  Stored what-if simulations available during current session for comparative analysis. Scenarios are held in browser memory and reset when session closes.
                </p>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:text-[#0B2822] dark:hover:bg-[#5CB69C] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
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
                  className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 shadow-xs hover:border-[#006B61] dark:hover:border-[#72C6AD] transition-colors flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#006B61] dark:text-[#72C6AD]">{sc.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          sc.delayDays > 0
                            ? 'bg-[#F6E4E1] dark:bg-[#2C1819] text-[#A43B36] dark:text-[#F18B82]'
                            : 'bg-[#E4F1E9] dark:bg-[#122A22] text-[#176B53] dark:text-[#72C6AD]'
                        }`}
                      >
                        {sc.delayDays > 0 ? `+${sc.delayDays}d Delay` : `${sc.delayDays}d Crash`}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9]">{sc.name}</h3>
                    <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] line-clamp-2 leading-relaxed">
                      {sc.description}
                    </p>

                    <div className="pt-2 border-t border-[#D9E2DA]/60 dark:border-[#3A5146] text-xs space-y-1">
                      <div className="flex justify-between text-[#738A80] dark:text-[#B5C1B5]">
                        <span>Source Activity:</span>
                        <span className="font-mono font-bold text-[#1A2B25] dark:text-[#F2F4E9]">{sc.sourceActivityId}</span>
                      </div>
                      <div className="flex justify-between text-[#738A80] dark:text-[#B5C1B5]">
                        <span>Created By:</span>
                        <span className="text-[#1A2B25] dark:text-[#F2F4E9] truncate max-w-[150px]">{sc.createdBy}</span>
                      </div>
                      <div className="flex justify-between text-[#738A80] dark:text-[#B5C1B5]">
                        <span>Timestamp:</span>
                        <span className="text-[#52665D] dark:text-[#B5C1B5] font-mono">{sc.createdAt}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {sc.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-[#EAF0E9] dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#D9E2DA]/60 dark:border-[#3A5146] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleLoadScenario(sc)}
                      className="flex-1 py-1.5 px-3 bg-white dark:bg-[#243832] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146] text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Load Scenario</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedScenarioForComparison(sc);
                        setIsCompareModalOpen(true);
                      }}
                      className="p-2 border border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-lg text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] transition-colors cursor-pointer"
                      title="Compare with baseline"
                    >
                      <GitCompare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteScenario(sc.id, sc.name)}
                      className="p-2 border border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#F6E4E1] dark:hover:bg-[#2C1819] rounded-lg text-[#52665D] dark:text-[#B5C1B5] hover:text-[#A43B36] dark:hover:text-[#F18B82] transition-colors cursor-pointer"
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
                className="px-4 py-2 text-xs font-semibold text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] rounded-lg border border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#F6F7F3] dark:hover:bg-[#243832] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScenario}
                className="px-4 py-2 bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:text-[#0B2822] dark:hover:bg-[#5CB69C] text-white text-xs font-bold rounded-lg shadow-xs border border-[#006B61] dark:border-[#72C6AD] transition-colors cursor-pointer"
              >
                Save to Session
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] block mb-1">Scenario Title *</label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => {
                  setScenarioName(e.target.value);
                  setIsCustomName(true);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-[#1A2B25] dark:text-[#F2F4E9] outline-hidden focus:border-[#006B61] dark:focus:border-[#72C6AD]"
              />
            </div>
            <div>
              <label className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] block mb-1">Description / Assumptions</label>
              <textarea
                rows={3}
                value={scenarioDescription}
                onChange={(e) => {
                  setScenarioDescription(e.target.value);
                  setIsCustomName(true);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-[#1A2B25] dark:text-[#F2F4E9] outline-hidden focus:border-[#006B61] dark:focus:border-[#72C6AD] resize-none"
              />
            </div>
            <div className="p-3 bg-[#F6F7F3] dark:bg-[#243832] rounded-lg border border-[#D9E2DA] dark:border-[#3A5146] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#738A80] dark:text-[#B5C1B5]">Source Activity:</span>
                <span className="font-mono font-bold text-[#1A2B25] dark:text-[#F2F4E9]">{selectedActivityId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#738A80] dark:text-[#B5C1B5]">Delay Days:</span>
                <span className="font-mono font-bold text-[#006B61] dark:text-[#72C6AD]">
                  {delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#738A80] dark:text-[#B5C1B5]">Simulated Finish:</span>
                <span className="font-mono font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
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
                className="px-4 py-2 bg-white dark:bg-[#243832] text-[#1A2B25] dark:text-[#F2F4E9] border border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#F6F7F3] dark:hover:bg-[#243832] text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Close Comparison
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[#F6F7F3] dark:bg-[#243832]">
                  <tr className="bg-[#F6F7F3] dark:bg-[#243832] border-b border-[#D9E2DA] dark:border-[#3A5146] text-[11px] sm:text-xs uppercase font-semibold text-[#52665D] dark:text-[#B5C1B5] h-11">
                    <th className="py-3 px-4">Metric / Dimension</th>
                    <th className="py-3 px-4 bg-[#E4F1E9]/40 dark:bg-[#122A22]/40 text-[#176B53] dark:text-[#72C6AD]">
                      Baseline (Rev 3.2 (P6 XML))
                    </th>
                    <th className="py-3 px-4 bg-[#EAF0E9]/60 dark:bg-[#1C2C43] text-[#006B61] dark:text-[#72C6AD]">
                      Active Simulation
                    </th>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <th key={sc.id} className="py-3 px-4 text-[#1A2B25] dark:text-[#F2F4E9]">
                        {sc.name.slice(0, 20)}...
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E2DA]/60 dark:divide-[#3A5146]">
                  <tr className="h-11 sm:h-12">
                    <td className="py-3 px-4 font-bold text-[#1A2B25] dark:text-[#F2F4E9]">Scenario Status</td>
                    <td className="py-3 px-4 font-semibold text-[#176B53] dark:text-[#72C6AD]">Active Baseline</td>
                    <td className="py-3 px-4 font-bold text-[#006B61] dark:text-[#72C6AD]">Current Sandbox</td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-3 px-4 text-[#52665D] dark:text-[#B5C1B5]">
                        Session ({sc.id})
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-[#1A2B25] dark:text-[#F2F4E9]">Source Activity</td>
                    <td className="py-2 px-4 font-mono text-[#52665D] dark:text-[#B5C1B5]">None (0d delta)</td>
                    <td className="py-2 px-4 font-mono font-bold text-[#006B61] dark:text-[#72C6AD]">{selectedActivityId}</td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-2 px-4 font-mono text-[#52665D] dark:text-[#B5C1B5]">
                        {sc.sourceActivityId}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-[#1A2B25] dark:text-[#F2F4E9]">Applied Delay</td>
                    <td className="py-2 px-4 font-mono text-[#176B53] dark:text-[#72C6AD]">0 Days</td>
                    <td className="py-2 px-4 font-mono font-bold text-[#006B61] dark:text-[#72C6AD]">
                      {delayDays >= 0 ? `+${delayDays}d` : `${delayDays}d`}
                    </td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-2 px-4 font-mono text-[#52665D] dark:text-[#B5C1B5]">
                        {sc.delayDays >= 0 ? `+${sc.delayDays}d` : `${sc.delayDays}d`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-[#1A2B25] dark:text-[#F2F4E9]">Target Completion</td>
                    <td className="py-2 px-4 font-mono font-bold text-[#1A2B25] dark:text-[#F2F4E9]">15 Dec 2026</td>
                    <td className="py-2 px-4 font-mono font-bold text-[#A43B36] dark:text-[#F18B82]">
                      {formatFriendlyDate(simulationResult?.simulatedProjectFinish || '2026-12-15')}
                    </td>
                    {savedScenarios.slice(0, 2).map((sc) => {
                      const simCOD = addDaysToDateString('2026-12-15', sc.delayDays > 0 ? sc.delayDays : 0);
                      return (
                        <td key={sc.id} className="py-2 px-4 font-mono font-bold text-[#52665D] dark:text-[#B5C1B5]">
                          {formatFriendlyDate(simCOD)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-[#1A2B25] dark:text-[#F2F4E9]">Net Variance</td>
                    <td className="py-2 px-4 font-mono text-[#176B53] dark:text-[#72C6AD]">0d</td>
                    <td className="py-2 px-4 font-mono font-bold text-[#A43B36] dark:text-[#F18B82]">
                      {simulationResult?.differenceDays ? `+${simulationResult.differenceDays}d` : '0d'}
                    </td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-2 px-4 font-mono text-[#52665D] dark:text-[#B5C1B5]">
                        {sc.delayDays > 0 ? `+${sc.delayDays}d` : `${sc.delayDays}d`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-[#1A2B25] dark:text-[#F2F4E9]">Critical Path Status</td>
                    <td className="py-2 px-4 text-[#176B53] dark:text-[#72C6AD]">Stable (Float Intact)</td>
                    <td className="py-2 px-4 font-bold text-[#A43B36] dark:text-[#F18B82]">
                      {simulationResult?.criticalPathPenetrated ? 'Penetrated' : 'Buffered'}
                    </td>
                    {savedScenarios.slice(0, 2).map((sc) => (
                      <td key={sc.id} className="py-2 px-4 text-[#52665D] dark:text-[#B5C1B5]">
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
              <div className="p-3 rounded-lg bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#006B61] dark:text-[#72C6AD]">
                    {selectedActivityDetail.activityId}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedActivityDetail.pathImpact === 'Critical Path Slip'
                        ? 'bg-[#F6E4E1] dark:bg-[#2C1819] text-[#A43B36] dark:text-[#F18B82] border border-[#DCABA7] dark:border-[#5C2323]'
                        : 'bg-[#F8EFDA] dark:bg-[#2C2114] text-[#825700] dark:text-[#F3BA63] border border-[#E5C185] dark:border-[#523B19]'
                    }`}
                  >
                    {selectedActivityDetail.pathImpact}
                  </span>
                </div>
                <h4 className="font-heading font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9]">{selectedActivityDetail.name}</h4>
                <p className="text-[#52665D] dark:text-[#B5C1B5]">
                  {selectedActivityDetail.discipline} · {selectedActivityDetail.area} (WBS {selectedActivityDetail.wbs})
                </p>
              </div>

              {/* Schedule Shift Comparison */}
              <div className="space-y-2">
                <h5 className="font-heading font-bold text-[#1A2B25] dark:text-[#F2F4E9] uppercase tracking-wider text-[11px]">
                  Finish Date Comparison
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146]">
                    <span className="text-[10px] uppercase font-semibold text-[#52665D] dark:text-[#B5C1B5] block">
                      Current Planned Finish
                    </span>
                    <span className="font-mono text-sm font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">
                      {formatFriendlyDate(selectedActivityDetail.currentDate)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146]">
                    <span className="text-[10px] uppercase font-bold text-[#006B61] dark:text-[#72C6AD] block">
                      Simulated Finish
                    </span>
                    <span className="font-mono text-sm font-bold text-[#A43B36] dark:text-[#F18B82]">
                      {formatFriendlyDate(selectedActivityDetail.simulatedDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CPM Driving Reason */}
              <div className="p-4 rounded-lg bg-[#EAF0E9] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] space-y-2">
                <span className="font-bold text-[#006B61] dark:text-[#72C6AD] uppercase tracking-wider text-[10px] block">
                  Driving Dependency Relationship
                </span>
                <p className="text-[#1A2B25] dark:text-[#F2F4E9] font-medium leading-relaxed">
                  {selectedActivityDetail.predecessorReason}
                </p>
                <div className="pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-between text-[11px]">
                  <span className="text-[#52665D] dark:text-[#B5C1B5]">Constraint:</span>
                  <span className="font-mono font-bold text-[#006B61] dark:text-[#72C6AD]">
                    {selectedActivityDetail.dependencyType}
                  </span>
                </div>
              </div>

              {/* Float Breakdown */}
              <div className="p-3 rounded-lg bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] space-y-2">
                <span className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <span>Float & Buffer Absorption</span>
                  <TermHelp term="float" showIcon />
                </span>
                <div className="flex justify-between text-xs">
                  <span className="text-[#52665D] dark:text-[#B5C1B5] flex items-center gap-1">
                    <span>Total Float Available:</span>
                  </span>
                  <span className="font-mono font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">
                    {selectedActivityDetail.floatAvailable} days
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#52665D] dark:text-[#B5C1B5]">Float Consumed by Scenario:</span>
                  <span className="font-mono font-semibold text-[#A43B36] dark:text-[#F18B82]">
                    {selectedActivityDetail.floatConsumed} days
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-[#D9E2DA] dark:border-[#3A5146]">
                  <span className="font-bold text-[#1A2B25] dark:text-[#F2F4E9]">Net Critical Path Slip:</span>
                  <span className="font-mono font-bold text-[#A43B36] dark:text-[#F18B82]">
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
