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
  Target,
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
import { StatusBadge } from './StatusBadge';
import { ConfidenceBlock } from './ConfidenceBlock';
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
      return <FileText className="w-4 h-4 text-[#006B61]" />;
    case 'Area / Line':
      return <MapPin className="w-4 h-4 text-[#0284C7]" />;
    case 'Discipline':
      return <Tag className="w-4 h-4 text-[#2C6475]" />;
    case 'Date / Context':
    case 'Context / Date':
      return <Calendar className="w-4 h-4 text-[#825700]" />;
    case 'Project / WBS':
      return <FolderGit2 className="w-4 h-4 text-[#1F6B4E]" />;
    default:
      return <Target className="w-4 h-4 text-[#52665D]" />;
  }
}

// Factor color accent mapper
function getFactorAccentColor(factor: ScoringFactorName) {
  switch (factor) {
    case 'Activity keywords':
      return '#006B61';
    case 'Area / Line':
      return '#2C6475';
    case 'Discipline':
      return '#2C6475';
    case 'Date / Context':
    case 'Context / Date':
      return '#825700';
    case 'Project / WBS':
      return '#1F6B4E';
    default:
      return '#52665D';
  }
}

// Evidence type icon mapper
function getEvidenceIcon(type: string) {
  const lower = (type || '').toLowerCase();
  if (lower.includes('photo') || lower.includes('img') || lower.includes('camera')) {
    return <Camera className="w-4 h-4 text-[#0284C7]" />;
  }
  if (lower.includes('sheet') || lower.includes('excel') || lower.includes('csv')) {
    return <FileSpreadsheet className="w-4 h-4 text-[#1F6B4E]" />;
  }
  if (lower.includes('voice') || lower.includes('audio')) {
    return <Mic className="w-4 h-4 text-[#825700]" />;
  }
  return <FileText className="w-4 h-4 text-[#006B61]" />;
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
        sublabel: 'Pending Human Verification',
        badgeClass: 'bg-[#E4F1E9] text-[#1F6B4E] border-[#B7DAC3]',
        barColor: 'bg-[#2E7D5B]',
        icon: <CheckCircle2 className="w-4 h-4 text-[#1F6B4E]" />,
      };
    }
    if (confidenceBracket === 'Review Required') {
      return {
        label: '70–89 Review Required',
        sublabel: 'Planner Attestation Required',
        badgeClass: 'bg-[#F8EFDA] text-[#825700] border-[#E5C185]',
        barColor: 'bg-[#81500B]',
        icon: <AlertTriangle className="w-4 h-4 text-[#825700]" />,
      };
    }
    return {
      label: '<70 Unmatched',
      sublabel: 'Below Automated Threshold',
      badgeClass: 'bg-[#F6E4E1] text-[#A43B36] border-[#DCABA7]',
      barColor: 'bg-[#92372F]',
      icon: <AlertCircle className="w-4 h-4 text-[#A43B36]" />,
    };
  }, [confidenceBracket]);


  return (
    <div
      className={`bg-white rounded-lg border border-[#D9E2DA] overflow-hidden shadow-xs space-y-0 ${className}`}
      data-testid="plnex-match-explanation"
    >
      {/* =========================================================================
          1. HEADER CARD: SUGGESTED ACTIVITY, CONFIDENCE & MATCH STATUS
          ========================================================================= */}
      <div className="p-4 sm:p-4 sm:p-6 bg-[#F6F7F3] border-b border-[#D9E2DA] space-y-4">
        {showHeading && (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EAF0E9] border border-[#D9E2DA] flex items-center justify-center text-[#006B61]">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#1A2B25] flex items-center gap-2">
                  <span>Match Explanation</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white border border-[#D9E2DA] text-[#52665D]">
                    Auditable Deterministic Scoring
                  </span>
                </h3>
                <p className="text-[11px] text-[#52665D]">
                  Decomposed across 5 explicit engineering signals with zero unexplained variance.
                </p>
              </div>
            </div>

            {/* Match Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#52665D]">
                Match Status:
              </span>
              <StatusBadge status={matchStatus} size="sm" />
            </div>
          </div>
        )}

        {/* Suggested Activity Presentation */}
        <div className="p-4 bg-white border border-[#D9E2DA] rounded-lg shadow-xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#52665D] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#006B61]" />
              Suggested Activity
            </span>

            {suggestedActivity ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EAF0E9] border border-[#D9E2DA] text-[#006B61] font-semibold">
                  WBS {suggestedActivity.wbs}
                </span>
                {suggestedActivity.discipline && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F6F7F3] border border-[#D9E2DA] text-[#52665D]">
                    {suggestedActivity.discipline}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F6E4E1] border border-[#DCABA7] text-[#A43B36]">
                No Schedule Link
              </span>
            )}
          </div>

          {suggestedActivity ? (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm text-[#006B61]">
                  {suggestedActivity.id}
                </span>
                <span className="font-bold text-sm text-[#1A2B25]">
                  {suggestedActivity.name}
                </span>
              </div>

              {(suggestedActivity.area || suggestedActivity.line || suggestedActivity.plannedStart) && (
                <div className="flex items-center gap-3 text-[11px] text-[#52665D] flex-wrap pt-0.5">
                  {suggestedActivity.area && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#738A80]" />
                      {suggestedActivity.area}
                    </span>
                  )}
                  {suggestedActivity.line && (
                    <span className="inline-flex items-center gap-1 font-mono text-[#1A2B25]">
                      Line: {suggestedActivity.line}
                    </span>
                  )}
                  {suggestedActivity.plannedStart && suggestedActivity.plannedFinish && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#738A80]" />
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
                    className="text-xs font-semibold text-[#006B61] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Inspect in Activity Detail Drawer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-[#F6E4E1] border border-[#DCABA7] rounded-lg text-xs text-[#A43B36] space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>No Baseline Activity Identified</span>
              </div>
              <p className="text-[11px] text-[#7A271A] flex items-center gap-2 flex-wrap">
                <span>The score of</span>
                <ConfidenceBadge score={confidence} size="sm" />
                <span>falls below the 70% automated threshold. No direct WBS activity corresponds to this field submission in current schedule baseline.</span>
              </p>
            </div>
          )}
        </div>

        {/* Standardized Confidence Visualization (Simple text + small indicator + explanation) */}
        <ConfidenceBlock
          score={confidence}
          alternatives={alternativeCandidates.map((c) => ({
            activityId: c.activityId,
            activityName: c.activityName,
            confidence: c.confidence,
            wbs: c.wbs,
            reasons: c.reasons,
          }))}
          onSelectAlternative={onSelectAlternative}
          unmatchedExplanation={`No sufficiently strong match exists. The confidence score of ${confidence}% falls below the 70% threshold required for automated schedule association. No direct WBS activity corresponds to this field submission in current schedule Rev 3.2 (P6 XML). Manual WBS assignment is required.`}
        />

        {/* Raw Field Observation Snippet if available */}
        {rawFieldStatement && (
          <div className="p-3 bg-[#F6F7F3] border border-[#D9E2DA] rounded-lg text-xs space-y-1">
            <span className="text-[10px] uppercase font-semibold text-[#52665D] block">
              Field Submission Source Text:
            </span>
            <p className="text-[#1A2B25] font-mono text-[11px] italic bg-white p-2 rounded border border-[#D9E2DA]/80">
              &ldquo;{rawFieldStatement}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* =========================================================================
          2. STRICT DECOMPOSITION: "DO NOT SHOW AN UNEXPLAINED AI PERCENTAGE"
             Shows equation & stacked proportional breakdown bar
          ========================================================================= */}
      <div className="p-4 sm:p-4 sm:p-6 border-b border-[#D9E2DA] bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#006B61]" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#52665D]">
              Deterministic Score Factor Breakdown
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setIsEquationExpanded(!isEquationExpanded)}
            className="text-[11px] font-semibold text-[#006B61] hover:underline flex items-center gap-1"
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
        <div className="space-y-2">
          <div
            className="w-full h-3 rounded-md overflow-hidden flex bg-[#EAF0E9] border border-[#D9E2DA]"
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
                  className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-md border text-[10px] font-medium transition-all ${
                    isHighlighted
                      ? 'ring-2 ring-[#006B61] dark:ring-[#72C6AD] font-bold bg-white dark:bg-[#17221D]'
                      : 'bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5] hover:bg-white dark:hover:bg-[#17221D]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>{f.factor}:</span>
                  <span className="font-mono font-bold text-[#1A2B25]">
                    +{f.contribution} pts
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expanded Mathematical Formula Display */}
        {isEquationExpanded && (
          <div className="p-3 bg-[#F6F7F3] border border-[#D9E2DA] rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] text-[#52665D]">
              <span className="font-semibold text-[#1A2B25]">
                Audit Formula Verification:
              </span>
              <span className="font-mono text-[10px] text-[#738A80]">
                Sum of discrete contributions = Total confidence
              </span>
            </div>
            <div className="p-3 bg-white border border-[#D9E2DA] rounded-lg font-mono text-[11px] text-[#1A2B25] overflow-x-auto flex items-center gap-2">
              <ConfidenceBadge score={confidence} size="sm" />
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
                  {idx < scoringFactors.length - 1 && <span className="text-[#738A80]">+</span>}
                </React.Fragment>
              ))}
            </div>
            <p className="text-[10px] text-[#738A80] italic">
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
      <div className="p-4 sm:p-4 sm:p-6 border-b border-[#D9E2DA] bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#006B61]" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#52665D]">
              Scoring Factors Breakdown ({scoringFactors.length})
            </h4>
          </div>
          <span className="text-[10px] font-mono text-[#738A80]">
            Weights Sum: 100 pts
          </span>
        </div>

        <div className="space-y-2">
          {scoringFactors.map((item, idx) => {
            const isHighlighted = activeFactorHighlight === item.factor;
            const pct = Math.round((item.contribution / item.maxContribution) * 100);
            const isNegative = item.contribution < 0;

            return (
              <div
                key={idx}
                onMouseEnter={() => setActiveFactorHighlight(item.factor)}
                onMouseLeave={() => setActiveFactorHighlight(null)}
                className={`p-4 rounded-lg border transition-all ${
                  isHighlighted
                    ? 'border-[#006B61] shadow-xs bg-[#EAF0E9]/30'
                    : 'border-[#D9E2DA] bg-white hover:border-[#D9E2DA]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#F6F7F3] border border-[#D9E2DA] flex items-center justify-center shrink-0 mt-0.5">
                      {getFactorIcon(item.factor)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#1A2B25]">
                          {item.factor}
                        </span>
                        <span className="text-[10px] font-mono text-[#738A80]">
                          (Weight: {item.maxContribution} pts / {item.weightPercent}%)
                        </span>
                        {item.status === 'FULL_MATCH' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E4F1E9] text-[#1F6B4E] border border-[#B7DAC3]">
                            ✓ matched
                          </span>
                        )}
                        {item.status === 'PARTIAL_MATCH' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F8EFDA] text-[#825700] border border-[#E5C185]">
                            △ partial
                          </span>
                        )}
                        {(item.status === 'NO_MATCH' || item.status === 'PENALTY') && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F6E4E1] text-[#A43B36] border border-[#DCABA7]">
                            ✕ mismatch
                          </span>
                        )}
                      </div>

                      {/* Explicit Deterministic Reason */}
                      <p className="text-xs text-[#52665D] leading-relaxed">
                        {item.reason}
                      </p>

                      {/* Optional Tokens Comparison */}
                      {(item.extractedToken || item.targetBaselineToken) && (
                        <div className="pt-1 flex flex-wrap gap-2 text-[10px] font-mono">
                          {item.extractedToken && (
                            <span className="px-2 py-0.5 rounded bg-[#F6F7F3] border border-[#D9E2DA] text-[#1A2B25]">
                              <strong className="text-[#738A80] font-sans">Reported:</strong> {item.extractedToken}
                            </span>
                          )}
                          {item.targetBaselineToken && (
                            <span className="px-2 py-0.5 rounded bg-[#EAF0E9] border border-[#D9E2DA] text-[#006B61]">
                              <strong className="text-[#738A80] font-sans">Baseline:</strong> {item.targetBaselineToken}
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
                            ? 'text-[#A43B36]'
                            : item.contribution >= item.maxContribution * 0.9
                            ? 'text-[#1F6B4E]'
                            : item.contribution >= item.maxContribution * 0.5
                            ? 'text-[#825700]'
                            : 'text-[#52665D]'
                        }`}
                      >
                        {item.contribution > 0 ? `+${item.contribution}` : item.contribution}
                      </span>
                      <span className="text-[10px] text-[#738A80]">
                        / {item.maxContribution} pts
                      </span>
                    </div>

                    {/* Mini contribution bar */}
                    <div className="w-full h-1.5 bg-[#EAF0E9] rounded-full overflow-hidden border border-[#D9E2DA]">
                      <div
                        className={`h-full rounded-full ${
                          isNegative
                            ? 'bg-[#92372F]'
                            : item.contribution >= item.maxContribution * 0.9
                            ? 'bg-[#2E7D5B]'
                            : item.contribution >= item.maxContribution * 0.5
                            ? 'bg-[#81500B]'
                            : 'bg-[#92372F]'
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
        <div className="p-4 sm:p-4 sm:p-6 border-b border-[#D9E2DA] bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[#006B61]" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#52665D]">
                Alternative Candidates Evaluated ({alternativeCandidates.length})
              </h4>
            </div>
            <span className="text-[11px] text-[#738A80]">
              Secondary candidate activities in scope
            </span>
          </div>

          {alternativeCandidates.length === 0 ? (
            <div className="p-4 bg-[#F6F7F3] border border-[#D9E2DA] rounded-lg text-center space-y-1">
              <p className="font-semibold text-xs text-[#1A2B25]">No alternative candidates evaluated</p>
              <p className="text-[11px] text-[#52665D]">
                No secondary baseline activities met the minimum candidate threshold (&gt; 25%) in this plant area.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {alternativeCandidates.map((alt) => (
                <div
                  key={alt.activityId}
                  className="p-3 bg-[#F6F7F3] border border-[#D9E2DA] rounded-lg flex items-start justify-between gap-3 text-xs hover:border-[#D9E2DA] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#006B61]">
                        {alt.activityId}
                      </span>
                      <span className="font-bold text-[#1A2B25]">
                        {alt.activityName}
                      </span>
                      {alt.wbs && (
                        <span className="text-[10px] font-mono text-[#52665D] bg-white px-1.5 py-0.5 rounded border border-[#D9E2DA]">
                          WBS {alt.wbs}
                        </span>
                      )}
                      {alt.discipline && (
                        <span className="text-[10px] text-[#52665D]">
                          ({alt.discipline})
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#52665D]">
                      <strong className="text-[#1A2B25]">Ranking Rationale:</strong>{' '}
                      {alt.rejectionOrRankingReason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ConfidenceBadge score={alt.confidence} size="sm" />
                    {onSelectAlternative && (
                      <button
                        type="button"
                        onClick={() => onSelectAlternative(alt.activityId)}
                        className="px-3 py-1 text-[11px] font-bold text-[#006B61] hover:bg-[#EAF0E9] border border-[#D9E2DA] rounded-lg transition-colors"
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
        <div className="p-4 sm:p-4 sm:p-6 border-b border-[#D9E2DA] bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#006B61]" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#52665D]">
                Evidence Source & Lineage
              </h4>
            </div>
            {evidenceSource.type && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#EAF0E9] text-[#006B61] border border-[#D9E2DA]">
                {evidenceSource.type}
              </span>
            )}
          </div>

          <div className="p-4 bg-[#F6F7F3] border border-[#D9E2DA] rounded-lg flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#D9E2DA] flex items-center justify-center shrink-0 mt-0.5">
                {getEvidenceIcon(evidenceSource.type)}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[#1A2B25]">
                    {evidenceSource.title}
                  </span>
                  {evidenceSource.id && (
                    <span className="text-[10px] font-mono text-[#738A80]">
                      ({evidenceSource.id})
                    </span>
                  )}
                </div>

                {evidenceSource.filename && (
                  <p className="font-mono text-[11px] text-[#52665D]">
                    File: {evidenceSource.filename}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[10px] text-[#738A80] flex-wrap pt-0.5">
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
                  <p className="text-[11px] text-[#52665D] italic bg-white p-2 rounded border border-[#D9E2DA]/80 mt-1">
                    &ldquo;{evidenceSource.snippet}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {onViewEvidence && evidenceSource.id && (
              <button
                type="button"
                onClick={() => onViewEvidence(evidenceSource.id!)}
                className="px-3 py-1 text-[11px] font-semibold text-[#006B61] hover:bg-white border border-[#D9E2DA] rounded-lg shrink-0 inline-flex items-center gap-1"
              >
                <span>View Proof</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          6. TECHNICAL DETAILS (COLLAPSIBLE DISCLOSURE)
          ========================================================================= */}
      {showAlgorithmDetails && (
        <details className="group border-t border-[#D9E2DA] bg-[#F6F7F3]">
          <summary className="p-3 sm:px-6 flex items-center justify-between cursor-pointer text-xs font-semibold text-[#52665D] hover:text-[#1A2B25] hover:bg-[#EAF0E9] transition-colors list-none">
            <span className="flex items-center gap-2">
              <Binary className="w-3.5 h-3.5 text-[#738A80]" />
              <span>Technical Details</span>
            </span>
            <span className="text-[11px] text-[#738A80] group-open:rotate-180">▼</span>
          </summary>
          <div className="p-4 sm:px-6 pt-0 text-[11px] text-[#52665D] space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1A2B25]">
                  {algorithmVersion.name}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#D9E2DA] text-[#006B61]">
                  {algorithmVersion.version}
                </span>
                <span className="text-[10px] text-[#738A80]">
                  Ruleset: {algorithmVersion.rulepack}
                </span>
              </div>

              <div className="flex items-center gap-1 font-mono text-[10px] text-[#738A80]">
                <Clock className="w-3 h-3" />
                <span>Generated: {generatedTimestamp}</span>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] text-[#738A80] pt-1 border-t border-[#D9E2DA]/60">
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
        </details>
      )}
    </div>
  );
}

export default MatchExplanation;
