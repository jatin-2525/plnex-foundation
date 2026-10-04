'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  MapPin,
  Calendar,
  FolderGit2,
  FileText,
  Camera,
  Cpu,
  Binary,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Hash,
  ArrowRight,
  Info,
  Clock,
  User,
  GitCompare,
  FileSpreadsheet,
  Mic,
  Tag,
  Check,
} from 'lucide-react';
import { ConfidenceBadge } from './ConfidenceBadge';
import {
  MatchExplanationModel,
  ScoringFactorItem,
  ScoringFactorName,
  AlternativeCandidateItem,
  EvidenceSourceInfo,
  SuggestedActivityInfo,
  getMatchExplanationForEvent,
  getConfidenceBracket,
  calculateConfidenceFromFactors,
  DEFAULT_ALGORITHM_METADATA,
} from '../../lib/domain/matchExplanationData';

export interface MatchExplanationProps {
  /**
   * If provided, automatically loads mock data or pre-computed audit record
   */
  eventId?: string;

  /**
   * Complete structured model. If omitted and eventId is given, resolved from eventId.
   */
  data?: MatchExplanationModel;

  /**
   * Granular overrides or standalone props
   */
  suggestedActivity?: SuggestedActivityInfo | null;
  confidence?: number;
  matchStatus?: string;
  scoringFactors?: ScoringFactorItem[];
  alternativeCandidates?: AlternativeCandidateItem[];
  evidenceSource?: EvidenceSourceInfo;
  algorithmVersion?: string;
  generatedTimestamp?: string;

  /**
   * Interactive Callbacks
   */
  onSelectAlternative?: (activityId: string) => void;
  onOpenActivity?: (activityId: string) => void;
  onViewEvidence?: (evidenceId: string) => void;

  /**
   * UI Options
   */
  compact?: boolean;
  showHeading?: boolean;
  showAlternatives?: boolean;
  showEvidenceSource?: boolean;
  showAlgorithmDetails?: boolean;
  className?: string;
}

// Icon mapper for the 5 mandated scoring factors
function getFactorIcon(factor: ScoringFactorName) {
  switch (factor) {
    case 'Activity keywords':
      return <FileText className="w-4 h-4 text-[#176B87]" />;
    case 'Area / Line':
      return <MapPin className="w-4 h-4 text-[#0284C7]" />;
    case 'Discipline':
      return <Tag className="w-4 h-4 text-[#7C3AED]" />;
    case 'Context / Date':
      return <Calendar className="w-4 h-4 text-[#D98B32]" />;
    case 'Project / WBS':
      return <FolderGit2 className="w-4 h-4 text-[#2E7D5B]" />;
    default:
      return <Sparkles className="w-4 h-4 text-[#596579]" />;
  }
}

// Factor color accent mapper
function getFactorAccentColor(factor: ScoringFactorName) {
  switch (factor) {
    case 'Activity keywords':
      return '#176B87';
    case 'Area / Line':
      return '#0284C7';
    case 'Discipline':
      return '#7C3AED';
    case 'Context / Date':
      return '#D98B32';
    case 'Project / WBS':
      return '#2E7D5B';
    default:
      return '#596579';
  }
}

// Evidence type icon mapper
function getEvidenceIcon(type: string) {
  const lower = (type || '').toLowerCase();
  if (lower.includes('photo') || lower.includes('img') || lower.includes('camera')) {
    return <Camera className="w-4 h-4 text-[#0284C7]" />;
  }
  if (lower.includes('sheet') || lower.includes('excel') || lower.includes('csv')) {
    return <FileSpreadsheet className="w-4 h-4 text-[#2E7D5B]" />;
  }
  if (lower.includes('voice') || lower.includes('audio')) {
    return <Mic className="w-4 h-4 text-[#D98B32]" />;
  }
  return <FileText className="w-4 h-4 text-[#176B87]" />;
}

export function MatchExplanation({
  eventId,
  data: initialData,
  suggestedActivity: propActivity,
  confidence: propConfidence,
  matchStatus: propStatus,
  scoringFactors: propFactors,
  alternativeCandidates: propAlternatives,
  evidenceSource: propEvidence,
  algorithmVersion: propAlgoVersion,
  generatedTimestamp: propTimestamp,
  onSelectAlternative,
  onOpenActivity,
  onViewEvidence,
  compact = false,
  showHeading = true,
  showAlternatives = true,
  showEvidenceSource = true,
  showAlgorithmDetails = true,
  className = '',
}: MatchExplanationProps) {
  // Resolve base data model
  const resolvedModel: MatchExplanationModel = React.useMemo(() => {
    let base: MatchExplanationModel;
    if (initialData) {
      base = initialData;
    } else if (eventId) {
      base = getMatchExplanationForEvent(eventId);
    } else {
      base = getMatchExplanationForEvent('EVT-2026-001');
    }

    // Merge individual prop overrides if provided
    const factors = propFactors ?? base.scoringFactors;
    const calcScore = propConfidence ?? calculateConfidenceFromFactors(factors);

    return {
      ...base,
      suggestedActivity: propActivity !== undefined ? propActivity : base.suggestedActivity,
      confidence: calcScore,
      confidenceBracket: getConfidenceBracket(calcScore),
      matchStatus: (propStatus as any) ?? base.matchStatus,
      scoringFactors: factors,
      alternativeCandidates: propAlternatives ?? base.alternativeCandidates,
      evidenceSource: propEvidence ?? base.evidenceSource,
      algorithmVersion: propAlgoVersion
        ? { ...base.algorithmVersion, version: propAlgoVersion }
        : base.algorithmVersion,
      generatedTimestamp: propTimestamp ?? base.generatedTimestamp,
    };
  }, [
    initialData,
    eventId,
    propActivity,
    propConfidence,
    propStatus,
    propFactors,
    propAlternatives,
    propEvidence,
    propAlgoVersion,
    propTimestamp,
  ]);

  const [isEquationExpanded, setIsEquationExpanded] = useState(!compact);
  const [activeFactorHighlight, setActiveFactorHighlight] = useState<ScoringFactorName | null>(null);

  const {
    suggestedActivity,
    confidence,
    confidenceBracket,
    matchStatus,
    scoringFactors,
    alternativeCandidates,
    evidenceSource,
    algorithmVersion,
    generatedTimestamp,
    auditHash,
    processingLatencyMs,
    rawFieldStatement,
  } = resolvedModel;

  // Bracket styling config
  const bracketConfig = React.useMemo(() => {
    if (confidenceBracket === 'High') {
      return {
        label: '90–100 High Confidence',
        sublabel: 'Auto-link Eligible',
        badgeClass: 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]',
        barColor: 'bg-[#2E7D5B]',
        icon: <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />,
      };
    }
    if (confidenceBracket === 'Review Required') {
      return {
        label: '70–89 Review Required',
        sublabel: 'Planner Attestation Required',
        badgeClass: 'bg-[#FDF6ED] text-[#D98B32] border-[#F0D4A6]',
        barColor: 'bg-[#D98B32]',
        icon: <AlertTriangle className="w-4 h-4 text-[#D98B32]" />,
      };
    }
    return {
      label: '<70 Unmatched',
      sublabel: 'Below Automated Threshold',
      badgeClass: 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]',
      barColor: 'bg-[#B5473C]',
      icon: <AlertCircle className="w-4 h-4 text-[#B5473C]" />,
    };
  }, [confidenceBracket]);

  // Match status badge color helper
  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('auto') || s.includes('approved')) {
      return 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]';
    }
    if (s.includes('review') || s.includes('pending')) {
      return 'bg-[#FDF6ED] text-[#D98B32] border-[#F0D4A6]';
    }
    if (s.includes('unmatched') || s.includes('reject') || s.includes('conflict')) {
      return 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]';
    }
    return 'bg-[#F7F8FA] text-[#596579] border-[#D9DEE5]';
  };

  return (
    <div
      className={`bg-white rounded-xl border border-[#D9DEE5] overflow-hidden shadow-sm space-y-0 ${className}`}
      data-testid="plnex-match-explanation"
    >
      {/* =========================================================================
          1. HEADER CARD: SUGGESTED ACTIVITY, CONFIDENCE & MATCH STATUS
          ========================================================================= */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-[#F7F8FA] to-white border-b border-[#D9DEE5] space-y-4">
        {showHeading && (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EDF5F8] border border-[#B3CBE0] flex items-center justify-center text-[#176B87]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#172033] flex items-center gap-2">
                  <span>Match Explanation</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white border border-[#D9DEE5] text-[#596579]">
                    Auditable Deterministic Scoring
                  </span>
                </h3>
                <p className="text-[11px] text-[#596579]">
                  Zero black-box AI percentage. Decomposed across 5 explicit engineering signals.
                </p>
              </div>
            </div>

            {/* Match Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#8A94A6]">
                Match Status:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusBadgeClass(
                  matchStatus
                )}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {matchStatus}
              </span>
            </div>
          </div>
        )}

        {/* Suggested Activity Presentation */}
        <div className="p-3.5 bg-white border border-[#D9DEE5] rounded-xl shadow-xs space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#8A94A6] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#176B87]" />
              Suggested Activity
            </span>

            {suggestedActivity ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EDF5F8] border border-[#B3CBE0] text-[#176B87] font-semibold">
                  WBS {suggestedActivity.wbs}
                </span>
                {suggestedActivity.discipline && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#D9DEE5] text-[#596579]">
                    {suggestedActivity.discipline}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FBEFEE] border border-[#E4B0AA] text-[#B5473C]">
                No Schedule Link
              </span>
            )}
          </div>

          {suggestedActivity ? (
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm text-[#176B87]">
                  {suggestedActivity.id}
                </span>
                <span className="font-bold text-sm text-[#172033]">
                  {suggestedActivity.name}
                </span>
              </div>

              {(suggestedActivity.area || suggestedActivity.line || suggestedActivity.plannedStart) && (
                <div className="flex items-center gap-3 text-[11px] text-[#596579] flex-wrap pt-0.5">
                  {suggestedActivity.area && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#8A94A6]" />
                      {suggestedActivity.area}
                    </span>
                  )}
                  {suggestedActivity.line && (
                    <span className="inline-flex items-center gap-1 font-mono text-[#172033]">
                      Line: {suggestedActivity.line}
                    </span>
                  )}
                  {suggestedActivity.plannedStart && suggestedActivity.plannedFinish && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#8A94A6]" />
                      Window: {suggestedActivity.plannedStart} → {suggestedActivity.plannedFinish}
                    </span>
                  )}
                </div>
              )}

              {onOpenActivity && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenActivity(suggestedActivity.id)}
                    className="text-xs font-semibold text-[#176B87] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Inspect in Activity Detail Drawer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg text-xs text-[#B5473C] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>No Baseline Activity Identified</span>
              </div>
              <p className="text-[11px] text-[#7A271A]">
                The score of <strong>{confidence}%</strong> falls below the 70% automated threshold. No direct WBS activity corresponds to this field submission in current schedule V3 · Rev 3.2.
              </p>
            </div>
          )}
        </div>

        {/* Confidence Bracket & Gauge Bar */}
        <div className="p-3.5 bg-white border border-[#D9DEE5] rounded-xl space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#8A94A6]">
                Confidence Score:
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-[#172033]">
                  {confidence}%
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${bracketConfig.badgeClass}`}
                >
                  {bracketConfig.icon}
                  <span>{bracketConfig.label}</span>
                </span>
              </div>
            </div>

            <div className="text-[11px] text-[#596579] font-medium">
              {bracketConfig.sublabel}
            </div>
          </div>

          {/* Visual Confidence Gauge with 70% and 90% threshold markers */}
          <div className="space-y-1 pt-1">
            <div className="relative w-full h-3 bg-[#F0F2F5] rounded-full overflow-hidden border border-[#D9DEE5]">
              {/* Colored score fill */}
              <div
                className={`h-full rounded-full transition-all duration-500 ${bracketConfig.barColor}`}
                style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
              />

              {/* Threshold Marker 70% */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-[#172033]/60 z-10"
                style={{ left: '70%' }}
                title="70% Review Required Gate"
              />

              {/* Threshold Marker 90% */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-[#172033]/80 z-10"
                style={{ left: '90%' }}
                title="90% Auto-Link High Confidence Gate"
              />
            </div>

            {/* Threshold Labels */}
            <div className="flex justify-between items-center text-[10px] font-mono text-[#8A94A6] pt-0.5">
              <span>0% (Unmatched)</span>
              <span className="pl-6 text-[#D98B32] font-semibold">| 70% Review Gate</span>
              <span className="text-[#2E7D5B] font-semibold">| 90% Auto-Link Gate</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Raw Field Observation Snippet if available */}
        {rawFieldStatement && (
          <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">
              Field Submission Source Text:
            </span>
            <p className="text-[#172033] font-mono text-[11px] italic bg-white p-2 rounded border border-[#D9DEE5]/80">
              &ldquo;{rawFieldStatement}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* =========================================================================
          2. STRICT DECOMPOSITION: "DO NOT SHOW AN UNEXPLAINED AI PERCENTAGE"
             Shows equation & stacked proportional breakdown bar
          ========================================================================= */}
      <div className="p-4 sm:p-5 border-b border-[#D9DEE5] bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#176B87]" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#596579]">
              Deterministic Score Decomposition (No Black-Box AI)
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setIsEquationExpanded(!isEquationExpanded)}
            className="text-[11px] font-semibold text-[#176B87] hover:underline flex items-center gap-1"
          >
            <span>{isEquationExpanded ? 'Collapse Equation' : 'Expand Equation'}</span>
            {isEquationExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Stacked Proportional Score Bar */}
        <div className="space-y-1.5">
          <div
            className="w-full h-3 rounded-md overflow-hidden flex bg-[#E5E9F0] border border-[#D9DEE5]"
            title="Score Composition by Signal Factor"
          >
            {scoringFactors.map((f, idx) => {
              const widthPct = Math.max(0, f.contribution);
              const color = getFactorAccentColor(f.factor);
              const isDimmed =
                activeFactorHighlight && activeFactorHighlight !== f.factor;
              return (
                <div
                  key={idx}
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: color,
                    opacity: isDimmed ? 0.35 : 1,
                  }}
                  className="h-full transition-opacity cursor-pointer relative group"
                  onMouseEnter={() => setActiveFactorHighlight(f.factor)}
                  onMouseLeave={() => setActiveFactorHighlight(null)}
                  title={`${f.factor}: +${f.contribution} pts`}
                />
              );
            })}
          </div>

          {/* Factor Pills Legend */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            {scoringFactors.map((f, idx) => {
              const color = getFactorAccentColor(f.factor);
              const isHighlighted = activeFactorHighlight === f.factor;
              return (
                <button
                  key={idx}
                  type="button"
                  onMouseEnter={() => setActiveFactorHighlight(f.factor)}
                  onMouseLeave={() => setActiveFactorHighlight(null)}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium transition-all ${
                    isHighlighted
                      ? 'ring-2 ring-[#176B87] font-bold bg-white'
                      : 'bg-[#F7F8FA] border-[#D9DEE5] text-[#596579] hover:bg-white'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>{f.factor}:</span>
                  <span className="font-mono font-bold text-[#172033]">
                    +{f.contribution} pts
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expanded Mathematical Formula Display */}
        {isEquationExpanded && (
          <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] text-[#596579]">
              <span className="font-semibold text-[#172033]">
                Audit Formula Verification:
              </span>
              <span className="font-mono text-[10px] text-[#8A94A6]">
                Sum of discrete contributions = Total confidence
              </span>
            </div>
            <div className="p-2.5 bg-white border border-[#D9DEE5] rounded-lg font-mono text-[11px] text-[#172033] overflow-x-auto flex items-center gap-1.5">
              <span className="font-bold text-[#176B87]">{confidence}%</span>
              <span>=</span>
              {scoringFactors.map((f, idx) => (
                <React.Fragment key={idx}>
                  <span
                    className="px-1.5 py-0.5 rounded border inline-block"
                    style={{
                      borderColor: `${getFactorAccentColor(f.factor)}50`,
                      backgroundColor: `${getFactorAccentColor(f.factor)}12`,
                      color: getFactorAccentColor(f.factor),
                    }}
                    title={`${f.factor}: ${f.reason}`}
                  >
                    {f.factor.split(' ')[0]} ({f.contribution > 0 ? `+${f.contribution}` : f.contribution})
                  </span>
                  {idx < scoringFactors.length - 1 && <span className="text-[#8A94A6]">+</span>}
                </React.Fragment>
              ))}
            </div>
            <p className="text-[10px] text-[#8A94A6] italic">
              Notice: Confidence is not an opaque probability distribution. Every single point is directly substantiated by the verifiable engineering evidence reasons below.
            </p>
          </div>
        )}
      </div>

      {/* =========================================================================
          3. SCORING FACTORS BREAKDOWN (THE 5 MANDATED FACTORS)
             - Activity keywords
             - Area / Line
             - Discipline
             - Context / Date
             - Project / WBS
             Each showing: factor, contribution, reason
          ========================================================================= */}
      <div className="p-4 sm:p-5 border-b border-[#D9DEE5] bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#176B87]" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#596579]">
              Scoring Factors Breakdown ({scoringFactors.length})
            </h4>
          </div>
          <span className="text-[10px] font-mono text-[#8A94A6]">
            Weights Sum: 100 pts
          </span>
        </div>

        <div className="space-y-2.5">
          {scoringFactors.map((item, idx) => {
            const isHighlighted = activeFactorHighlight === item.factor;
            const pct = Math.round((item.contribution / item.maxContribution) * 100);
            const isNegative = item.contribution < 0;

            return (
              <div
                key={idx}
                onMouseEnter={() => setActiveFactorHighlight(item.factor)}
                onMouseLeave={() => setActiveFactorHighlight(null)}
                className={`p-3.5 rounded-xl border transition-all ${
                  isHighlighted
                    ? 'border-[#176B87] shadow-sm bg-[#EDF5F8]/30'
                    : 'border-[#D9DEE5] bg-white hover:border-[#B3CBE0]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] flex items-center justify-center shrink-0 mt-0.5">
                      {getFactorIcon(item.factor)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#172033]">
                          {item.factor}
                        </span>
                        <span className="text-[10px] font-mono text-[#8A94A6]">
                          (Weight: {item.maxContribution} pts / {item.weightPercent}%)
                        </span>
                        {item.status === 'FULL_MATCH' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                            Full Alignment
                          </span>
                        )}
                        {item.status === 'PARTIAL_MATCH' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-[#FDF6ED] text-[#D98B32] border border-[#F0D4A6]">
                            Partial Alignment
                          </span>
                        )}
                        {item.status === 'NO_MATCH' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                            No Match
                          </span>
                        )}
                        {item.status === 'PENALTY' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                            Constraint Penalty
                          </span>
                        )}
                      </div>

                      {/* Explicit Deterministic Reason */}
                      <p className="text-xs text-[#596579] leading-relaxed">
                        {item.reason}
                      </p>

                      {/* Optional Tokens Comparison */}
                      {(item.extractedToken || item.targetBaselineToken) && (
                        <div className="pt-1 flex flex-wrap gap-2 text-[10px] font-mono">
                          {item.extractedToken && (
                            <span className="px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#D9DEE5] text-[#172033]">
                              <strong className="text-[#8A94A6] font-sans">Reported:</strong> {item.extractedToken}
                            </span>
                          )}
                          {item.targetBaselineToken && (
                            <span className="px-2 py-0.5 rounded bg-[#EDF5F8] border border-[#B3CBE0] text-[#176B87]">
                              <strong className="text-[#8A94A6] font-sans">Baseline:</strong> {item.targetBaselineToken}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contribution Score Gauge */}
                  <div className="text-right shrink-0 min-w-[90px] space-y-1">
                    <div className="flex items-baseline justify-end gap-1 font-mono">
                      <span
                        className={`text-sm font-bold ${
                          isNegative
                            ? 'text-[#B5473C]'
                            : item.contribution >= item.maxContribution * 0.9
                            ? 'text-[#2E7D5B]'
                            : item.contribution >= item.maxContribution * 0.5
                            ? 'text-[#D98B32]'
                            : 'text-[#596579]'
                        }`}
                      >
                        {item.contribution > 0 ? `+${item.contribution}` : item.contribution}
                      </span>
                      <span className="text-[10px] text-[#8A94A6]">
                        / {item.maxContribution} pts
                      </span>
                    </div>

                    {/* Mini contribution bar */}
                    <div className="w-full h-1.5 bg-[#F0F2F5] rounded-full overflow-hidden border border-[#D9DEE5]">
                      <div
                        className={`h-full rounded-full ${
                          isNegative
                            ? 'bg-[#B5473C]'
                            : item.contribution >= item.maxContribution * 0.9
                            ? 'bg-[#2E7D5B]'
                            : item.contribution >= item.maxContribution * 0.5
                            ? 'bg-[#D98B32]'
                            : 'bg-[#B5473C]'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, pct))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          4. ALTERNATIVE CANDIDATES SECTION
          ========================================================================= */}
      {showAlternatives && (
        <div className="p-4 sm:p-5 border-b border-[#D9DEE5] bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[#176B87]" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#596579]">
                Alternative Candidates Evaluated ({alternativeCandidates.length})
              </h4>
            </div>
            <span className="text-[11px] text-[#8A94A6]">
              Secondary candidate activities in scope
            </span>
          </div>

          {alternativeCandidates.length === 0 ? (
            <div className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl text-xs text-[#8A94A6] italic">
              No alternative candidates met the minimum candidate threshold (&gt; 25%) in this plant area.
            </div>
          ) : (
            <div className="space-y-2">
              {alternativeCandidates.map((alt) => (
                <div
                  key={alt.activityId}
                  className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl flex items-start justify-between gap-3 text-xs hover:border-[#B3CBE0] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#176B87]">
                        {alt.activityId}
                      </span>
                      <span className="font-bold text-[#172033]">
                        {alt.activityName}
                      </span>
                      {alt.wbs && (
                        <span className="text-[10px] font-mono text-[#596579] bg-white px-1.5 py-0.5 rounded border border-[#D9DEE5]">
                          WBS {alt.wbs}
                        </span>
                      )}
                      {alt.discipline && (
                        <span className="text-[10px] text-[#596579]">
                          ({alt.discipline})
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#596579]">
                      <strong className="text-[#172033]">Ranking Rationale:</strong>{' '}
                      {alt.rejectionOrRankingReason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ConfidenceBadge score={alt.confidence} size="sm" />
                    {onSelectAlternative && (
                      <button
                        type="button"
                        onClick={() => onSelectAlternative(alt.activityId)}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded-lg transition-colors"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          5. EVIDENCE SOURCE SECTION
          ========================================================================= */}
      {showEvidenceSource && evidenceSource && (
        <div className="p-4 sm:p-5 border-b border-[#D9DEE5] bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#176B87]" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#596579]">
                Evidence Source & Lineage
              </h4>
            </div>
            {evidenceSource.type && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                {evidenceSource.type}
              </span>
            )}
          </div>

          <div className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#D9DEE5] flex items-center justify-center shrink-0 mt-0.5">
                {getEvidenceIcon(evidenceSource.type)}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[#172033]">
                    {evidenceSource.title}
                  </span>
                  {evidenceSource.id && (
                    <span className="text-[10px] font-mono text-[#8A94A6]">
                      ({evidenceSource.id})
                    </span>
                  )}
                </div>

                {evidenceSource.filename && (
                  <p className="font-mono text-[11px] text-[#596579]">
                    File: {evidenceSource.filename}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[10px] text-[#8A94A6] flex-wrap pt-0.5">
                  {evidenceSource.uploadedBy && (
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {evidenceSource.uploadedBy}
                    </span>
                  )}
                  {evidenceSource.timestamp && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {evidenceSource.timestamp}
                    </span>
                  )}
                </div>

                {evidenceSource.snippet && (
                  <p className="text-[11px] text-[#596579] italic bg-white p-2 rounded border border-[#D9DEE5]/80 mt-1">
                    &ldquo;{evidenceSource.snippet}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {onViewEvidence && evidenceSource.id && (
              <button
                type="button"
                onClick={() => onViewEvidence(evidenceSource.id!)}
                className="px-2.5 py-1 text-[11px] font-semibold text-[#176B87] hover:bg-white border border-[#B3CBE0] rounded-lg shrink-0 inline-flex items-center gap-1"
              >
                <span>View Proof</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          6. ALGORITHM / VERSION & GENERATED TIMESTAMP FOOTER
          ========================================================================= */}
      {showAlgorithmDetails && (
        <div className="p-4 sm:p-5 bg-[#F7F8FA] text-[11px] text-[#596579] space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Binary className="w-3.5 h-3.5 text-[#176B87]" />
              <span className="font-bold text-[#172033]">
                {algorithmVersion.name}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white border border-[#D9DEE5] text-[#176B87]">
                {algorithmVersion.version}
              </span>
              <span className="text-[10px] text-[#8A94A6]">
                Ruleset: {algorithmVersion.rulepack}
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono text-[10px] text-[#8A94A6]">
              <Clock className="w-3 h-3" />
              <span>Generated: {generatedTimestamp}</span>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] text-[#8A94A6] pt-1 border-t border-[#D9DEE5]/60">
            <p className="max-w-xl">
              {algorithmVersion.description}
            </p>

            <div className="flex items-center gap-3 shrink-0">
              {processingLatencyMs && (
                <span>Latency: {processingLatencyMs}ms</span>
              )}
              {auditHash && (
                <span className="font-mono" title={`Audit Hash: ${auditHash}`}>
                  Hash: {auditHash.slice(0, 10)}...{auditHash.slice(-6)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchExplanation;
