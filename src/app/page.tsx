'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { Breadcrumbs } from '../components/shell/Breadcrumbs';
import { PageHeader } from '../components/shared/PageHeader';
import { StateWrapper } from '../components/shared/StateWrapper';
import { StatusBadge } from '../components/shared/StatusBadge';
import { VarianceBadge } from '../components/shared/VarianceBadge';
import { ProgressBar } from '../components/shared/ProgressBar';
import { Drawer } from '../components/shared/Drawer';
import { MOCK_ACTIVITIES, MOCK_HEALTH_SCORE, MOCK_DATA_QUALITY_SCORE } from '../lib/api/mockData';
import { ScheduleActivity } from '../types';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText,
  Activity as ActivityIcon,
  ChevronRight,
  Info,
} from 'lucide-react';

export default function OverviewPage() {
  const { activeProject } = useApp();
  const [selectedActivity, setSelectedActivity] = useState<ScheduleActivity | null>(null);

  const breadcrumbs = [{ label: 'Overview' }, { label: 'Schedule Twin & Project Health', current: true }];

  const delayedActivities = MOCK_ACTIVITIES.filter((a) => a.status === 'delayed' || a.delayDays > 0);
  const atRiskActivities = MOCK_ACTIVITIES.filter((a) => a.status === 'at-risk');

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        title="Schedule Twin & Project Controls"
        description="Dual-view comparison of baseline planned schedule against verified field execution. Detects variances early, preserves evidence traceability, and identifies downstream critical path delays."
        stage="UPDATE"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/schedule"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F0F2F5] text-[#172033] border border-[#D9DEE5] rounded-md text-xs font-medium transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#596579]" />
              View Full WBS
            </Link>
            <Link
              href="/field"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#176B87] hover:bg-[#135A72] text-white rounded-md text-xs font-medium shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Submit Field DPR
            </Link>
          </div>
        }
        metadata={
          <>
            <span className="font-mono">PROJECT: {activeProject.code}</span>
            <span>•</span>
            <span>CONTRACTOR: {activeProject.contractor}</span>
            <span>•</span>
            <span>LOCATION: {activeProject.location}</span>
          </>
        }
      />

      <StateWrapper>
        {/* Core Workflow Pipeline Navigator */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#596579]">
              End-to-End Execution Value Chain
            </span>
            <span className="text-xs text-[#176B87] font-medium font-mono">
              SIH26122 Planning-to-Execution Bridge
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5 text-center">
            {[
              { step: '1. PLAN', href: '/schedule', active: false },
              { step: '2. FIELD', href: '/field', active: false },
              { step: '3. EXTRACT', href: '/field', active: false },
              { step: '4. MATCH', href: '/matching', active: false },
              { step: '5. VERIFY', href: '/matching', active: false },
              { step: '6. UPDATE', href: '/', active: true },
              { step: '7. VARIANCE', href: '/variance', active: false },
              { step: '8. IMPACT', href: '/variance', active: false },
              { step: '9. ACTION', href: '/variance', active: false },
            ].map((st, i) => (
              <Link
                key={i}
                href={st.href}
                className={`py-2 px-1 rounded border text-[11px] font-mono font-semibold transition-colors flex items-center justify-center ${
                  st.active
                    ? 'bg-[#176B87] text-white border-[#176B87]'
                    : 'bg-[#F7F8FA] hover:bg-[#EDF5F8] text-[#596579] hover:text-[#176B87] border-[#D9DEE5]'
                }`}
              >
                {st.step}
              </Link>
            ))}
          </div>
        </div>

        {/* Project Health Scorecards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5">
            <span className="text-[11px] font-medium text-[#596579] block">Actual Progress</span>
            <span className="text-xl font-bold text-[#172033] font-mono mt-0.5 block">
              {activeProject.overallProgress}%
            </span>
            <span className="text-[10px] text-[#596579]">Target: {activeProject.plannedProgress}%</span>
          </div>

          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5">
            <span className="text-[11px] font-medium text-[#596579] block">Planned Baseline</span>
            <span className="text-xl font-bold text-[#172033] font-mono mt-0.5 block">
              {activeProject.plannedProgress}%
            </span>
            <span className="text-[10px] text-[#596579]">Primavera P6 basis</span>
          </div>

          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5">
            <span className="text-[11px] font-medium text-[#596579] block">Schedule Variance</span>
            <span className="text-xl font-bold text-[#B5473C] font-mono mt-0.5 block">
              {activeProject.variance}%
            </span>
            <span className="text-[10px] text-[#B5473C] font-medium">Cumulative lag</span>
          </div>

          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5">
            <span className="text-[11px] font-medium text-[#596579] block">Delayed Tasks</span>
            <span className="text-xl font-bold text-[#B5473C] font-mono mt-0.5 block">
              {activeProject.delayedCount}
            </span>
            <span className="text-[10px] text-[#596579]">Critical path items</span>
          </div>

          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5">
            <span className="text-[11px] font-medium text-[#596579] block">At-Risk Tasks</span>
            <span className="text-xl font-bold text-[#D98B32] font-mono mt-0.5 block">
              {activeProject.atRiskCount}
            </span>
            <span className="text-[10px] text-[#596579]">Within buffer zone</span>
          </div>

          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5">
            <span className="text-[11px] font-medium text-[#596579] block">Completed</span>
            <span className="text-xl font-bold text-[#2E7D5B] font-mono mt-0.5 block">
              {activeProject.completedCount}
            </span>
            <span className="text-[10px] text-[#2E7D5B] font-medium">Verified actuals</span>
          </div>
        </div>

        {/* Schedule Twin Side-by-Side View */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#D9DEE5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F7F8FA]">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#176B87]" />
                <h3 className="text-sm font-bold text-[#172033]">
                  Schedule Twin — Plan vs Reality Synchronization
                </h3>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Every field update is reconciled against the baseline activity without overwriting master schedules without audit.
              </p>
            </div>
            <Link
              href="/schedule"
              className="text-xs text-[#176B87] hover:underline font-medium inline-flex items-center gap-1 self-start sm:self-auto"
            >
              Full Schedule View <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#E8EBF0]">
            {MOCK_ACTIVITIES.map((activity) => (
              <div
                key={activity.id}
                onClick={() => setSelectedActivity(activity)}
                className="p-4 hover:bg-[#F7F8FA] transition-colors cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Activity Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#176B87] bg-[#EDF2F8] px-2 py-0.5 rounded">
                        {activity.id}
                      </span>
                      <span className="text-xs font-semibold text-[#172033]">{activity.name}</span>
                      <span className="text-[11px] text-[#596579]">({activity.discipline} • {activity.wbsLevel})</span>
                      {activity.isCritical && (
                        <span className="text-[10px] font-mono uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] px-1.5 py-0.2 rounded font-bold">
                          Critical Path
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#596579] truncate">{activity.description}</p>
                  </div>

                  {/* Right: Plan vs Reality Columns */}
                  <div className="flex items-center gap-4 sm:gap-6 flex-wrap lg:flex-nowrap">
                    {/* Plan Column */}
                    <div className="min-w-[120px] text-xs">
                      <span className="text-[10px] text-[#8A94A6] uppercase font-bold block">
                        PLAN (P6 BASELINE)
                      </span>
                      <span className="font-mono text-xs text-[#172033] block">
                        {activity.plannedStart} → {activity.plannedFinish}
                      </span>
                      <span className="text-[11px] text-[#596579] font-mono">
                        Target: {activity.plannedQuantity} {activity.unit}
                      </span>
                    </div>

                    {/* Reality Column */}
                    <div className="min-w-[130px] text-xs">
                      <span className="text-[10px] text-[#176B87] uppercase font-bold block">
                        REALITY (ACTUAL)
                      </span>
                      <span className="font-mono text-xs text-[#172033] block">
                        {activity.actualStart || 'Pending'} → {activity.actualFinish || 'In Progress'}
                      </span>
                      <span className="text-[11px] text-[#172033] font-mono font-semibold">
                        Done: {activity.actualQuantity} {activity.unit} ({activity.actualProgress}%)
                      </span>
                    </div>

                    {/* Variance indicator */}
                    <div className="min-w-[90px]">
                      <span className="text-[10px] text-[#8A94A6] uppercase font-bold block mb-1">
                        VARIANCE
                      </span>
                      <VarianceBadge daysDelay={activity.delayDays} size="sm" />
                    </div>

                    {/* Status badge */}
                    <div className="min-w-[90px]">
                      <span className="text-[10px] text-[#8A94A6] uppercase font-bold block mb-1">
                        STATUS
                      </span>
                      <StatusBadge status={activity.status} size="sm" />
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#8A94A6] group-hover:text-[#172033] transition-colors hidden sm:block" />
                  </div>
                </div>

                {/* Progress bar comparison */}
                <div className="mt-3 pt-2 border-t border-[#F0F2F5]">
                  <ProgressBar
                    actual={activity.actualProgress}
                    planned={activity.plannedProgress}
                    size="sm"
                    status={activity.status as any}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Extraordinary Features: Schedule Health & Data Quality */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Schedule Health Scorecard */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EBF0] mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">Schedule Health Score</h3>
                <p className="text-xs text-[#596579]">Transparent deterministic calculation</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-[#176B87]">
                  {MOCK_HEALTH_SCORE.overall}
                </span>
                <span className="text-xs text-[#596579] font-mono"> / 100</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#596579]">Schedule Performance</span>
                <span className="font-mono font-semibold text-[#172033]">{MOCK_HEALTH_SCORE.schedulePerformance}/100</span>
              </div>
              <ProgressBar actual={MOCK_HEALTH_SCORE.schedulePerformance} size="sm" showLabels={false} />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[#596579]">Milestone Performance</span>
                <span className="font-mono font-semibold text-[#172033]">{MOCK_HEALTH_SCORE.milestonePerformance}/100</span>
              </div>
              <ProgressBar actual={MOCK_HEALTH_SCORE.milestonePerformance} size="sm" showLabels={false} />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[#596579]">Progress Variance Index</span>
                <span className="font-mono font-semibold text-[#172033]">{MOCK_HEALTH_SCORE.progressVariance}/100</span>
              </div>
              <ProgressBar actual={MOCK_HEALTH_SCORE.progressVariance} size="sm" showLabels={false} />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[#596579]">Open Critical Risks</span>
                <span className="font-mono font-semibold text-[#172033]">{MOCK_HEALTH_SCORE.openRisks}/100</span>
              </div>
              <ProgressBar actual={MOCK_HEALTH_SCORE.openRisks} size="sm" showLabels={false} />
            </div>

            <div className="mt-4 pt-3 border-t border-[#E8EBF0] text-xs text-[#596579]">
              <p className="font-semibold text-[#172033] mb-1">Health Explanation:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                {MOCK_HEALTH_SCORE.breakdownNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Data Quality Scorecard */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EBF0] mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">Field Data Quality Score</h3>
                <p className="text-xs text-[#596579]">
                  Evaluates completeness & reliability of site reports
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-[#2E7D5B]">
                  {MOCK_DATA_QUALITY_SCORE.overall}%
                </span>
                <span className="text-xs text-[#596579] font-mono"> Reliable</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#596579]">Data Completeness</span>
                <span className="font-mono font-semibold text-[#172033]">{MOCK_DATA_QUALITY_SCORE.completeness}%</span>
              </div>
              <ProgressBar actual={MOCK_DATA_QUALITY_SCORE.completeness} size="sm" showLabels={false} />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[#596579]">Submission Timeliness</span>
                <span className="font-mono font-semibold text-[#172033]">{MOCK_DATA_QUALITY_SCORE.timeliness}%</span>
              </div>
              <ProgressBar actual={MOCK_DATA_QUALITY_SCORE.timeliness} size="sm" showLabels={false} />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[#596579]">Evidence Photo/PDF Coverage</span>
                <span className="font-mono font-semibold text-[#172033]">{MOCK_DATA_QUALITY_SCORE.evidenceCoverage}%</span>
              </div>
              <ProgressBar actual={MOCK_DATA_QUALITY_SCORE.evidenceCoverage} size="sm" showLabels={false} />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[#596579]">Schedule Linking Rate</span>
                <span className="font-mono font-semibold text-[#172033]">{MOCK_DATA_QUALITY_SCORE.scheduleLinking}%</span>
              </div>
              <ProgressBar actual={MOCK_DATA_QUALITY_SCORE.scheduleLinking} size="sm" showLabels={false} />
            </div>

            <div className="mt-4 pt-3 border-t border-[#E8EBF0] text-xs text-[#596579]">
              <p className="font-semibold text-[#172033] mb-1">Quality Assessment:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                {MOCK_DATA_QUALITY_SCORE.explanation.slice(0, 3).map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Activity Alerts Section */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#596579] mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#D98B32]" />
            Active Schedule Alerts & Interventions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-[#FBEFEE] border border-[#E4B0AA] rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#B5473C]" />
                <span className="font-mono text-xs font-bold text-[#B5473C]">PIP-24-001</span>
                <span className="text-xs font-semibold text-[#172033]">2 Days Delayed</span>
              </div>
              <p className="text-xs text-[#596579]">
                High Pressure Gas Header spool erection completed on 17 Sep vs planned 15 Sep. Predecessor for joint welding.
              </p>
              <Link
                href="/variance"
                className="text-xs text-[#B5473C] hover:underline font-semibold mt-2 inline-flex items-center gap-1"
              >
                Inspect Delay Chain <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-3 bg-[#FDF6ED] border border-[#F0D4A6] rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#D98B32]" />
                <span className="font-mono text-xs font-bold text-[#D98B32]">ELE-11-032</span>
                <span className="text-xs font-semibold text-[#172033]">Deadline Approaching</span>
              </div>
              <p className="text-xs text-[#596579]">
                Overhead cable ladder tray installation at 40% progress. Baseline finish is 23 Sep (5 days remaining).
              </p>
              <Link
                href="/matching"
                className="text-xs text-[#D98B32] hover:underline font-semibold mt-2 inline-flex items-center gap-1"
              >
                Review Voice Event <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-3 bg-[#EDF7F2] border border-[#B8DCC9] rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" />
                <span className="font-mono text-xs font-bold text-[#2E7D5B]">CIV-11-001</span>
                <span className="text-xs font-semibold text-[#172033]">Pedestal Completed</span>
              </div>
              <p className="text-xs text-[#596579]">
                45m³ concrete foundation pour verified with cube test certificate EVD-001. Ready for compressor skid shaft alignment.
              </p>
              <Link
                href="/evidence"
                className="text-xs text-[#2E7D5B] hover:underline font-semibold mt-2 inline-flex items-center gap-1"
              >
                View Evidence Certificate <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </StateWrapper>

      {/* Activity Details Drawer */}
      {selectedActivity && (
        <Drawer
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          title={`Activity ${selectedActivity.id}`}
          subtitle={selectedActivity.name}
          width="md"
        >
          <div className="space-y-4">
            <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#596579]">Discipline:</span>
                <strong className="text-[#172033]">{selectedActivity.discipline}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#596579]">WBS Location:</span>
                <span className="font-mono text-[#172033]">{selectedActivity.wbs} ({selectedActivity.wbsLevel})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#596579]">Area / Line:</span>
                <span className="text-[#172033]">{selectedActivity.area} {selectedActivity.line ? `• ${selectedActivity.line}` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#596579]">Assigned Engineer:</span>
                <span className="text-[#172033]">{selectedActivity.assignedEngineer}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#172033] uppercase mb-2">Planned vs Actual Metrics</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="border border-[#D9DEE5] rounded p-2 bg-white">
                  <span className="text-[10px] text-[#8A94A6] uppercase font-bold block">Planned (P6)</span>
                  <p className="font-mono mt-0.5">{selectedActivity.plannedStart} → {selectedActivity.plannedFinish}</p>
                  <p className="font-mono text-[#596579]">{selectedActivity.plannedQuantity} {selectedActivity.unit}</p>
                </div>
                <div className="border border-[#D9DEE5] rounded p-2 bg-white">
                  <span className="text-[10px] text-[#176B87] uppercase font-bold block">Actual (Field)</span>
                  <p className="font-mono mt-0.5">{selectedActivity.actualStart || 'None'} → {selectedActivity.actualFinish || 'In Progress'}</p>
                  <p className="font-mono font-bold text-[#176B87]">{selectedActivity.actualQuantity} {selectedActivity.unit} ({selectedActivity.actualProgress}%)</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#172033] uppercase mb-2">Dependencies & Predecessors</h4>
              <div className="text-xs space-y-1">
                {selectedActivity.predecessors.length > 0 ? (
                  selectedActivity.predecessors.map((p) => (
                    <div key={p} className="p-2 border border-[#D9DEE5] rounded bg-[#F7F8FA] flex items-center justify-between font-mono">
                      <span>Predecessor: {p}</span>
                      <span className="text-[#176B87]">Linked</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[#8A94A6] text-xs">No predecessors (Header milestone)</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#172033] uppercase mb-2">Linked Evidence Records</h4>
              <div className="text-xs space-y-1">
                {selectedActivity.evidenceIds.length > 0 ? (
                  selectedActivity.evidenceIds.map((eid) => (
                    <div key={eid} className="p-2 border border-[#B8DCC9] bg-[#EDF7F2] rounded flex items-center justify-between">
                      <span className="font-mono font-bold text-[#2E7D5B]">{eid}</span>
                      <span className="text-[11px] text-[#2E7D5B]">Verified Photo / PDF</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[#8A94A6] text-xs">No evidence records linked yet</p>
                )}
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
