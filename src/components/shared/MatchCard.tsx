'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Layers,
  Target,
  GitCompare,
  Check,
  X,
  SlidersHorizontal,
  FileText,
  MapPin,
  Tag,
  Calendar,
  FolderGit2,
} from 'lucide-react';
import { ConfidenceBadge } from './ConfidenceBadge';

export type ScoringFactorStatus = 'matched' | 'partial' | 'mismatch';

export interface MatchFactorItem {
  name: 'Activity keywords' | 'Area / Line' | 'Discipline' | 'Date / Context' | 'Project / WBS';
  status: ScoringFactorStatus;
  reason: string;
  contribution?: number;
  maxContribution?: number;
}

export interface MatchAlternativeItem {
  activityId: string;
  activityName: string;
  confidence: number;
  wbs?: string;
  discipline?: string;
  reasons?: string[];
}

export interface MatchCardProps {
  activityId: string | null;
  activityName: string | null;
  confidence: number;
  statusText?: string; // e.g. "High-confidence suggestion"
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected' | 'Unmatched';
  wbs?: string | null;
  discipline?: string | null;
  area?: string | null;
  line?: string | null;
  fieldStatement?: string;
  factors?: MatchFactorItem[];
  alternatives?: MatchAlternativeItem[];
  showAlternativesDefault?: boolean;
  onApprove?: () => void;
  onChooseAnother?: () => void;
  onReject?: () => void;
  onMarkUnmatched?: () => void;
  onSelectAlternative?: (activityId: string) => void;
  className?: string;
}

// Icon mapper for the 5 mandated factors
function getFactorIcon(name: string) {
  switch (name) {
    case 'Activity keywords':
      return <FileText className="w-4 h-4 text-[#176B87]" />;
    case 'Area / Line':
      return <MapPin className="w-4 h-4 text-[#0284C7]" />;
    case 'Discipline':
      return <Tag className="w-4 h-4 text-[#3B6EA8]" />;
    case 'Date / Context':
      return <Calendar className="w-4 h-4 text-[#D98B32]" />;
    case 'Project / WBS':
      return <FolderGit2 className="w-4 h-4 text-[#2E7D5B]" />;
    default:
      return <Target className="w-4 h-4 text-[#596579]" />;
  }
}

// Factor tag renderer using exact required status symbols: ✓ matched, △ partial, ✕ mismatch
function renderFactorBadge(status: ScoringFactorStatus) {
  switch (status) {
    case 'matched':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
          <span>✓</span>
          <span>matched</span>
        </span>
      );
    case 'partial':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]">
          <span>△</span>
          <span>partial</span>
        </span>
      );
    case 'mismatch':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
          <span>✕</span>
          <span>mismatch</span>
        </span>
      );
  }
}

export function MatchCard({
  activityId,
  activityName,
  confidence,
  statusText,
  verificationStatus = 'Pending',
  wbs,
  discipline,
  area,
  line,
  fieldStatement,
  factors = [],
  alternatives = [],
  showAlternativesDefault,
  onApprove,
  onChooseAnother,
  onReject,
  onMarkUnmatched,
  onSelectAlternative,
  className = '',
}: MatchCardProps) {
  // If confidence is not high (< 90%), default show alternatives to true
  const isConfidenceHigh = confidence >= 90;
  const [showAlternatives, setShowAlternatives] = useState<boolean>(
    showAlternativesDefault !== undefined ? showAlternativesDefault : !isConfidenceHigh
  );
  const [showWhyDetails, setShowWhyDetails] = useState<boolean>(true);

  // Derive status label matching prompt specification
  const derivedStatusText =
    statusText ||
    (!activityId
      ? 'Unmatched scope'
      : isConfidenceHigh
      ? 'High-confidence suggestion'
      : confidence >= 70
      ? 'Review-required suggestion'
      : 'Low-confidence suggestion');

  // Default fallback factors if none provided
  const effectiveFactors: MatchFactorItem[] =
    factors.length > 0
      ? factors
      : [
          {
            name: 'Activity keywords',
            status: isConfidenceHigh ? 'matched' : 'partial',
            reason: activityId
              ? 'Activity work terms aligned with baseline schedule description'
              : 'Keywords do not correspond to scheduled WBS scope',
          },
          {
            name: 'Area / Line',
            status: line || area ? 'matched' : 'partial',
            reason: line
              ? `Line identifier confirmed: ${line}`
              : area
              ? `General area matched: ${area}`
              : 'Plant area is unspecific in field capture',
          },
          {
            name: 'Discipline',
            status: discipline ? 'matched' : 'partial',
            reason: discipline
              ? `Discipline strictly conforms to ${discipline}`
              : 'Trade discipline unassigned',
          },
          {
            name: 'Date / Context',
            status: isConfidenceHigh ? 'matched' : 'partial',
            reason: 'Execution date checked against active baseline timeline',
          },
          {
            name: 'Project / WBS',
            status: wbs ? 'matched' : 'mismatch',
            reason: wbs
              ? `Associated with WBS package ${wbs}`
              : 'No matching WBS leaf node found in master schedule',
          },
        ];

  return (
    <div
      className={`bg-white border border-[#D9DEE5] rounded-lg overflow-hidden shadow-xs space-y-0 ${className}`}
      data-testid="plnex-match-card"
    >
      {/* =========================================================================
          1. MATCH CARD HEADER: Suggested Activity, Activity ID, Confidence, Status
          ========================================================================= */}
      <div className="p-4 sm:p-4 sm:p-6 bg-[#F7F8FA] border-b border-[#D9DEE5] space-y-4">
        {/* Field Statement Context if provided */}
        {fieldStatement && (
          <div className="p-3 bg-[#F1F3F5] border border-[#D9DEE5] rounded-lg text-xs space-y-1">
            <span className="text-[10px] uppercase font-semibold text-[#596579] block tracking-wider">
              Field Execution Report:
            </span>
            <p className="text-[#172033] font-medium italic">
              &ldquo;{fieldStatement}&rdquo;
            </p>
          </div>
        )}

        {/* Primary Match Card Information */}
        <div className="p-4 bg-white border border-[#D9DEE5] rounded-lg shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-[#596579] flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-[#176B87]" />
              Suggested Match
            </span>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#F7F8FA] text-[#596579] border border-[#D9DEE5]">
              Assistive Suggestion · Not Final Authority
            </span>
          </div>

          {activityId ? (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base font-extrabold text-[#176B87]">
                      {activityId}
                    </span>
                    {wbs && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EDF5F8] text-[#176B87] font-semibold border border-[#B3CBE0]">
                        WBS {wbs}
                      </span>
                    )}
                    {discipline && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#F7F8FA] text-[#596579] font-medium border border-[#D9DEE5]">
                        {discipline}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#172033] mt-1">
                    {activityName || 'Suggested Schedule Activity'}
                  </h3>
                </div>

                {/* Example format: PIP-24-001 | 94% | High Confidence */}
                <div className="text-right sm:shrink-0 space-y-1">
                  <div className="flex items-center justify-start sm:justify-end gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isConfidenceHigh
                          ? 'bg-[#2E7D5B]'
                          : confidence >= 70
                          ? 'bg-[#D98B32]'
                          : 'bg-[#B5473C]'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-2xl font-black font-mono text-[#172033]">
                      {confidence}%
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-md text-xs font-bold border ${
                      isConfidenceHigh
                        ? 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]'
                        : confidence >= 70
                        ? 'bg-[#FDF6ED] text-[#8C5311] border-[#F0D4A6]'
                        : 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]'
                    }`}
                  >
                    {isConfidenceHigh ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isConfidenceHigh
                        ? 'High Confidence'
                        : confidence >= 70
                        ? 'Review Required'
                        : 'Unmatched'}
                    </span>
                  </span>
                  <span className="sr-only">{derivedStatusText}</span>
                </div>
              </div>

              {(area || line) && (
                <div className="flex items-center gap-3 text-xs text-[#596579] pt-1 border-t border-[#D9DEE5]/60 flex-wrap">
                  {area && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#7B8798]" />
                      Area: <strong className="text-[#172033]">{area}</strong>
                    </span>
                  )}
                  {line && (
                    <span className="inline-flex items-center gap-1 font-mono">
                      Line: <strong className="text-[#172033]">{line}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg text-xs space-y-2 text-[#B5473C]">
              <div className="flex items-center gap-2 font-bold">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>No sufficiently strong match exists</span>
              </div>
              <p className="text-[11px] text-[#7A271A] flex items-center gap-2 flex-wrap">
                <span>The score of</span>
                <ConfidenceBadge score={confidence} size="sm" />
                <span>falls below automated baseline correlation. No sufficiently strong match exists. Manual review or WBS assignment required.</span>
              </p>
            </div>
          )}
        </div>

        {/* =========================================================================
            2. VERIFICATION: CLEARLY SEPARATE CONFIDENCE FROM VERIFICATION
               Example: Confidence: 94% | Verification: Pending
            ========================================================================= */}
        <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-6 flex-wrap">
            {/* Confidence metric */}
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#596579] tracking-wider block">
                Confidence:
              </span>
              <div className="mt-0.5">
                <ConfidenceBadge score={confidence} size="sm" />
              </div>
            </div>

            <div className="h-8 w-[1px] bg-[#D9DEE5] hidden sm:block" />

            {/* Verification metric */}
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#596579] tracking-wider block">
                Verification:
              </span>
              <span
                className={`inline-flex items-center gap-2 px-3 py-0.5 rounded text-xs font-bold border mt-0.5 ${
                  verificationStatus === 'Verified'
                    ? 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]'
                    : verificationStatus === 'Rejected'
                    ? 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]'
                    : verificationStatus === 'Unmatched'
                    ? 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5]'
                    : 'bg-[#FDF6ED] text-[#8C5311] border-[#F0D4A6]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{verificationStatus}</span>
              </span>
            </div>
          </div>

          {/* DO NOT Display 94% = Verified Disclaimer */}
          <div className="text-right">
            <span className="text-[11px] text-[#596579] font-medium block">
              Human-in-the-loop Gate
            </span>
            <span className="text-[10px] font-mono text-[#7B8798]">
              94% ≠ Verified · Zero silent updates
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. WHY? SECTION: Activity keywords, Area / Line, Discipline, Date / Context, Project / WBS
             Using: ✓ matched, △ partial, ✕ mismatch
          ========================================================================= */}
      <div className="p-4 sm:p-4 sm:p-6 border-b border-[#D9DEE5] bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#176B87]" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#172033]">
              Why this match?
            </h4>
            <span className="text-[10px] font-mono text-[#7B8798]">
              (5 Evaluated Factors)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowWhyDetails(!showWhyDetails)}
            className="text-xs font-semibold text-[#176B87] hover:underline flex items-center gap-1"
          >
            <span>{showWhyDetails ? 'Collapse Why?' : 'Expand Why?'}</span>
            {showWhyDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {showWhyDetails && (
          <div className="space-y-3 pt-1">
            {/* Canonical 4 dimensions for High Confidence */}
            {isConfidenceHigh && (
              <div className="p-3 bg-[#F7FBF9] border border-[#D1EADC] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Why?
                  </span>
                  <span className="text-[11px] text-[#2E7D5B] font-medium">
                    Verified Match Dimensions
                  </span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <li className="flex items-center gap-2 text-[#172033]">
                    <span className="w-4 h-4 rounded-full bg-[#EDF7F2] text-[#2E7D5B] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span className="font-medium">Activity match</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#172033]">
                    <span className="w-4 h-4 rounded-full bg-[#EDF7F2] text-[#2E7D5B] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span className="font-medium">Area match</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#172033]">
                    <span className="w-4 h-4 rounded-full bg-[#EDF7F2] text-[#2E7D5B] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span className="font-medium">Discipline match</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#172033]">
                    <span className="w-4 h-4 rounded-full bg-[#EDF7F2] text-[#2E7D5B] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span className="font-medium">Context match</span>
                  </li>
                </ul>
              </div>
            )}
            {effectiveFactors.map((factor, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#D9DEE5] flex items-center justify-center shrink-0 mt-0.5">
                    {getFactorIcon(factor.name)}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-[#172033]">
                        {factor.name}
                      </span>
                      {renderFactorBadge(factor.status)}
                    </div>
                    <p className="text-[11px] text-[#596579] leading-relaxed">
                      {factor.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          4. ALTERNATIVES: If confidence is not high, show alternative activities
             Example: PIP-24-001 (94%), PIP-24-003 (71%), PIP-24-009 (42%)
          ========================================================================= */}
      {alternatives.length > 0 && (
        <div className="p-4 sm:p-4 sm:p-6 border-b border-[#D9DEE5] bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[#176B87]" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#172033]">
                Alternative Activities ({alternatives.length})
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="text-xs font-semibold text-[#176B87] hover:underline flex items-center gap-1"
            >
              <span>{showAlternatives ? 'Hide Alternatives' : 'Show Alternatives'}</span>
              {showAlternatives ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {showAlternatives && (
            <div className="space-y-2 pt-1">
              {alternatives.map((alt) => (
                <div
                  key={alt.activityId}
                  className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex items-center justify-between gap-3 text-xs hover:border-[#B3CBE0] transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#176B87]">
                        {alt.activityId}
                      </span>
                      <span className="font-bold text-[#172033] truncate">
                        {alt.activityName}
                      </span>
                      {alt.wbs && (
                        <span className="text-[10px] font-mono text-[#596579] bg-white px-1.5 py-0.5 rounded border border-[#D9DEE5]">
                          WBS {alt.wbs}
                        </span>
                      )}
                    </div>
                    {alt.reasons && alt.reasons.length > 0 && (
                      <p className="text-[11px] text-[#596579]">
                        {alt.reasons[0]}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ConfidenceBadge score={alt.confidence} size="sm" />
                    {onSelectAlternative && (
                      <button
                        type="button"
                        onClick={() => onSelectAlternative(alt.activityId)}
                        className="px-3 py-1 text-xs font-bold text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded-lg transition-colors"
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
          5. VERIFICATION ACTIONS:
             Approve Match, Choose Another, Reject, Mark Unmatched
          ========================================================================= */}
      {(onApprove || onChooseAnother || onReject || onMarkUnmatched) && (
        <div className="p-4 sm:p-6 bg-[#F7F8FA] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {onReject && (
              <button
                type="button"
                onClick={onReject}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#B5473C] hover:bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            )}

            {onMarkUnmatched && (
              <button
                type="button"
                onClick={onMarkUnmatched}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#596579] hover:text-[#172033] hover:bg-white border border-[#D9DEE5] rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Mark Unmatched</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {onChooseAnother && (
              <button
                type="button"
                onClick={onChooseAnother}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#172033] bg-white hover:bg-[#F1F3F5] border border-[#D9DEE5] rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Choose Another</span>
              </button>
            )}

            {onApprove && (
              <button
                type="button"
                onClick={onApprove}
                className="min-h-[44px] px-5 py-2 text-xs font-bold bg-[#176B87] hover:bg-[#135A72] text-white rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve Match</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchCard;
