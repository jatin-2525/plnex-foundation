'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { PageHeader } from '../../components/shared/PageHeader';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { VarianceBadge } from '../../components/shared/VarianceBadge';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { projectService } from '../../lib/api/projectService';
import { MOCK_ACTIVITIES, MOCK_PROJECT_MEMORY } from '../../lib/api/mockData';
import { traceDelayChain, WhatIfSimulationResult } from '../../lib/domain/varianceEngine';
import {
  TrendingDown,
  GitBranch,
  Play,
  RotateCcw,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';

export default function VariancePage() {
  const { activeProject } = useApp();
  const { addToast } = useToast();

  const [selectedActivityId, setSelectedActivityId] = useState<string>('PIP-24-002');
  const [simDays, setSimDays] = useState<number>(3);
  const [simulationResult, setSimulationResult] = useState<WhatIfSimulationResult | null>(null);

  const breadcrumbs = [
    { label: 'Variance & Impact' },
    { label: 'Delay Chain Analysis & What-If Simulator', current: true },
  ];

  // Delay chain for selected activity
  const delayChain = traceDelayChain(selectedActivityId, MOCK_ACTIVITIES);

  const handleRunSimulation = () => {
    const res = projectService.simulateWhatIf(selectedActivityId, simDays);
    setSimulationResult(res.data);
    addToast({
      type: res.data.criticalPathImpacted ? 'warning' : 'info',
      title: 'What-If Simulation Computed',
      description: `Delay of +${simDays} days propagates to ${res.data.affectedDownstreamCount} downstream activities.`,
    });
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        title="Delay Chain Analysis & What-If Simulation Engine"
        description="Explains why activities are delayed by tracing root predecessor dependencies, and forecasts downstream critical path impacts deterministically before problems compound."
        stage="IMPACT"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/risks"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FBEFEE] hover:bg-[#FBEFEE]/80 border border-[#E4B0AA] text-[#B5473C] text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Risks & Dependencies</span>
            </Link>
            <Link
              href="/progress"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <TrendingDown className="w-3.5 h-3.5 rotate-180" />
              <span>Progress & Variance</span>
            </Link>
          </div>
        }
        metadata={
          <>
            <span className="font-mono">RULES ENGINE: Deterministic Predecessor-Successor Graph</span>
            <span>•</span>
            <span>ACTIVE DELAYS: 2 Downstream Slips</span>
            <span>•</span>
            <span>CRITICAL PATH FLOAT: 0 Days</span>
          </>
        }
      />

      <StateWrapper>
        {/* Section 1: "Why is this delayed?" Dependency Chain Visualization */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9DEE5]">
            <div>
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#176B87]" />
                <h3 className="text-sm font-bold text-[#172033]">
                  "Why Is This Delayed?" — Traceable Predecessor Dependency Chain
                </h3>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Reveals the cascading root causes of execution slips across construction disciplines.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#596579] font-medium">Inspect Activity:</span>
              <select
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="px-2.5 py-1 text-xs bg-white border border-[#D9DEE5] rounded-md font-mono text-[#172033] outline-none"
              >
                {MOCK_ACTIVITIES.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.id} ({act.name.slice(0, 30)}...)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chain Steps Progression */}
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#D9DEE5]">
            {delayChain.map((step, idx) => {
              const isTerminus = idx === delayChain.length - 1;
              return (
                <div key={idx} className="relative group">
                  <div
                    className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                      step.delayDays > 0 ? 'border-[#B5473C]' : 'border-[#176B87]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        step.delayDays > 0 ? 'bg-[#B5473C]' : 'bg-[#176B87]'
                      }`}
                    />
                  </div>

                  <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-md p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#176B87]">
                          {step.activityId}
                        </span>
                        <span className="text-xs font-semibold text-[#172033]">{step.name}</span>
                        <span className="text-[11px] text-[#596579]">({step.discipline})</span>
                      </div>
                      <VarianceBadge daysDelay={step.delayDays} size="sm" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-[#D9DEE5]">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#596579]">Cause / Origin</span>
                        <p className="text-[#596579] mt-0.5">{step.reason}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#176B87]">Successor Impact</span>
                        <p className="text-[#172033] font-medium mt-0.5">{step.impactOnSuccessor}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Deterministic What-If Simulator */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 space-y-4">
          <div className="pb-3 border-b border-[#D9DEE5] flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-[#176B87]" />
                <h3 className="text-sm font-bold text-[#172033]">
                  Deterministic What-If Delay Simulator
                </h3>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Simulate prospective field delays deterministically on the CPM network without modifying baseline data.
              </p>
            </div>
            <Link
              href="/what-if"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EDF5F8] hover:bg-[#EDF5F8]/80 border border-[#B3CBE0] text-[#176B87] text-xs font-bold rounded-lg transition-colors"
            >
              <span>Full What-If Simulator Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg p-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-[#172033] block mb-1">
                  Source Activity to Delay
                </label>
                <select
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-[#D9DEE5] rounded font-mono text-[#172033] outline-none"
                >
                  {MOCK_ACTIVITIES.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.id} — {act.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-36">
                <label className="text-xs font-bold text-[#172033] block mb-1">
                  Additional Delay
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={simDays}
                    onChange={(e) => setSimDays(parseInt(e.target.value) || 1)}
                    className="w-full p-2 text-xs bg-white border border-[#D9DEE5] rounded font-mono text-[#172033] outline-none"
                  />
                  <span className="text-xs text-[#596579]">days</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Simulate Downstream Slippage
            </button>
          </div>

          {/* Simulation Output */}
          {simulationResult && (
            <div className="p-4 border rounded-lg bg-white border-[#D9DEE5] space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#D9DEE5]">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    Simulation Results: What If +{simulationResult.additionalDays} Days Occurs?
                  </h4>
                  <p className="text-xs text-[#596579] mt-0.5">
                    Evaluated against predecessor/successor schedule tree.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {simulationResult.criticalPathImpacted ? (
                    <span className="px-2.5 py-1 bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] text-xs font-mono font-bold rounded">
                      CRITICAL PATH DELAY: +{simulationResult.projectCompletionDelayDays} DAYS
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9] text-xs font-mono font-bold rounded">
                      ABSORBED BY FLOAT
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#172033] block mb-2">
                  Affected Downstream Activities ({simulationResult.affectedActivities.length}):
                </span>
                {simulationResult.affectedActivities.length > 0 ? (
                  <div className="space-y-1.5 text-xs">
                    {simulationResult.affectedActivities.map((aff) => (
                      <div
                        key={aff.activityId}
                        className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#176B87]">
                              {aff.activityId}
                            </span>
                            <span className="font-medium text-[#172033]">{aff.name}</span>
                            {aff.isCritical && (
                              <span className="text-[10px] font-mono uppercase bg-[#FBEFEE] text-[#B5473C] px-1 rounded">
                                Critical
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#596579] font-mono mt-0.5">
                            Original: {aff.originalPlannedFinish} → Projected: {aff.newProjectedFinish}
                          </div>
                        </div>
                        <VarianceBadge daysDelay={aff.additionalDelayDays} size="sm" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#7B8798]">
                    No downstream successors impacted; activity has sufficient free float buffer.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Project Memory — Institutional Knowledge */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#D9DEE5]">
            <BookOpen className="w-4 h-4 text-[#176B87]" />
            <div>
              <h3 className="text-sm font-bold text-[#172033]">
                Project Memory & Institutional Knowledge Base
              </h3>
              <p className="text-xs text-[#596579] mt-0.5">
                Past project completion records and root cause patterns from historical Oil India infrastructure executions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_PROJECT_MEMORY.map((mem) => (
              <div key={mem.id} className="p-4 border border-[#D9DEE5] rounded-lg bg-[#F7F8FA]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-[#176B87]">{mem.projectCode}</span>
                  <span className="px-2 py-0.5 bg-[#F1F3F5] text-xs font-medium rounded text-[#596579]">
                    {mem.discipline}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#172033] mb-2">{mem.projectName}</h4>

                <div className="flex items-center gap-4 text-xs font-mono text-[#596579] mb-3">
                  <span>Planned: {mem.plannedDurationDays}d</span>
                  <span>•</span>
                  <span>Actual: {mem.actualDurationDays}d</span>
                  <span>•</span>
                  <span className="text-[#B5473C] font-semibold">Slip: +{mem.varianceDays}d</span>
                </div>

                <div className="text-xs space-y-1 mb-3">
                  <span className="font-semibold text-[#172033] block text-[11px] uppercase">
                    Key Historical Delay Factors:
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-[#596579] space-y-0.5">
                    {mem.keyDelayCauses.map((cause, cIdx) => (
                      <li key={cIdx}>{cause}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-2.5 bg-white border border-[#B8DCC9] rounded text-xs text-[#2E7D5B]">
                  <strong className="block text-[11px] uppercase mb-0.5">Recommended Mitigation Rule:</strong>
                  <span>{mem.recommendedMitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </StateWrapper>
    </div>
  );
}
