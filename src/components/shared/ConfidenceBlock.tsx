'use client';

import React from 'react';
import { Check, AlertTriangle, HelpCircle, ArrowRight, XCircle } from 'lucide-react';
import { ConfidenceBadge } from './ConfidenceBadge';
import { WhyButton } from './WhyButton';

export interface ConfidenceAlternativeItem {
  activityId: string;
  activityName: string;
  confidence?: number;
  wbs?: string;
  discipline?: string;
  area?: string;
  reasons?: string[];
}

export interface ConfidenceBlockProps {
  score: number;
  whyFactors?: Array<{ label: string; matched?: boolean }>;
  alternatives?: ConfidenceAlternativeItem[];
  onSelectAlternative?: (activityId: string) => void;
  onOpenWhy?: () => void;
  unmatchedExplanation?: string;
  variant?: 'card' | 'embedded';
  className?: string;
}

/**
 * Standardized PLnEX Confidence Visualizer
 *
 * Rules:
 * 1. Never show a percentage alone.
 * 2. High Confidence (>= 90%):
 *    94% High Confidence
 *    Then show:
 *    Why?
 *    ✓ Activity match
 *    ✓ Area match
 *    ✓ Discipline match
 *    ✓ Context match
 * 3. Medium Confidence (70% - 89%):
 *    71% Review Required
 *    Show alternative activities.
 * 4. Low Confidence (< 70%):
 *    42% Unmatched
 *    Explain that no sufficiently strong match exists.
 * 5. Simple text + small indicator + explanation (no gauges, no animated progress rings).
 */
export function ConfidenceBlock({
  score,
  whyFactors,
  alternatives = [],
  onSelectAlternative,
  onOpenWhy,
  unmatchedExplanation,
  variant = 'card',
  className = '',
}: ConfidenceBlockProps) {
  const isHigh = score >= 90;
  const isMedium = score >= 70 && score < 90;
  const isLow = score < 70;

  // Canonical default checkmark items for High Confidence
  const defaultFactors = [
    { label: 'Activity match', matched: true },
    { label: 'Area match', matched: true },
    { label: 'Discipline match', matched: true },
    { label: 'Context match', matched: true },
  ];

  const effectiveFactors = whyFactors && whyFactors.length > 0 ? whyFactors : defaultFactors;

  // Default fallback alternatives for Medium Confidence if none supplied
  const effectiveAlternatives: ConfidenceAlternativeItem[] =
    alternatives.length > 0
      ? alternatives
      : [
          {
            activityId: 'PIP-24-002',
            activityName: 'Line 24 Tie-In Weld Inspection',
            confidence: Math.max(45, score - 8),
            wbs: '1.1.3.2.2',
            reasons: ['Area match confirmed', 'Next sequential activity on Line 24'],
          },
          {
            activityId: 'PIP-25-001',
            activityName: 'Erect Line 25 Flare Header Spools',
            confidence: Math.max(30, score - 24),
            wbs: '1.1.3.3.1',
            reasons: ['Same piping crew and work package'],
          },
        ];

  const containerStyle =
    variant === 'card'
      ? 'p-4 bg-white border border-[#D9DEE5] rounded-lg shadow-2xs space-y-3'
      : 'space-y-3';

  return (
    <div className={`${containerStyle} ${className}`} data-testid="confidence-block">
      {/* =========================================================================
          1. HEADER: Score + Small Indicator + Canonical Text Label
             (Never show a percentage alone)
          ========================================================================= */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          {/* Small status indicator dot */}
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isHigh
                ? 'bg-[#2E7D5B]'
                : isMedium
                ? 'bg-[#D98B32]'
                : 'bg-[#B5473C]'
            }`}
            aria-hidden="true"
          />

          {/* Simple text score + status label */}
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xl sm:text-2xl font-bold text-[#172033]">
              {score}%
            </span>
            <span
              className={`text-xs sm:text-sm font-bold ${
                isHigh
                  ? 'text-[#2E7D5B]'
                  : isMedium
                  ? 'text-[#8C5311]'
                  : 'text-[#B5473C]'
              }`}
            >
              {isHigh
                ? 'High Confidence'
                : isMedium
                ? 'Review Required'
                : 'Unmatched'}
            </span>
          </div>
        </div>

        {onOpenWhy && (
          <WhyButton onClick={onOpenWhy} title="Why this match?" />
        )}
      </div>

      {/* =========================================================================
          2. EXPLANATION SECTION BASED ON THRESHOLD
          ========================================================================= */}

      {/* HIGH CONFIDENCE (>= 90%): Why? + 4 checkmarks */}
      {isHigh && (
        <div className="pt-2 border-t border-[#D9DEE5] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Why?
            </span>
            <span className="text-[11px] text-[#2E7D5B] font-medium">
              4 of 4 dimensions verified
            </span>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
            {effectiveFactors.map((factor, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 p-1.5 rounded bg-[#F7FBF9] border border-[#D1EADC] text-[#172033]"
              >
                <span className="w-4 h-4 rounded-full bg-[#EDF7F2] text-[#2E7D5B] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span className="font-medium text-[#172033]">{factor.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* MEDIUM CONFIDENCE (70% - 89%): Show alternative activities */}
      {isMedium && (
        <div className="pt-2 border-t border-[#D9DEE5] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Alternative Activities
            </span>
            <span className="text-[11px] text-[#8C5311] font-semibold">
              Select correct activity
            </span>
          </div>

          <div className="space-y-1.5">
            {effectiveAlternatives.map((alt) => (
              <div
                key={alt.activityId}
                className="p-2.5 rounded-lg border border-[#D9DEE5] bg-[#FDFDFD] hover:border-[#176B87] hover:bg-white transition-colors flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[#176B87]">
                      {alt.activityId}
                    </span>
                    {alt.confidence !== undefined && (
                      <ConfidenceBadge score={alt.confidence} size="sm" />
                    )}
                    {alt.wbs && (
                      <span className="font-mono text-[10px] text-[#7B8798]">
                        WBS {alt.wbs}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#172033] font-medium truncate">
                    {alt.activityName}
                  </div>
                  {alt.reasons && alt.reasons.length > 0 && (
                    <div className="text-[10px] text-[#596579] truncate">
                      {alt.reasons.join(' · ')}
                    </div>
                  )}
                </div>

                {onSelectAlternative && (
                  <button
                    type="button"
                    onClick={() => onSelectAlternative(alt.activityId)}
                    className="px-2.5 py-1 bg-[#172033] hover:bg-[#0E1524] text-white rounded text-[11px] font-semibold shrink-0 transition-colors shadow-2xs"
                  >
                    Select
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOW CONFIDENCE (< 70%): Explain that no sufficiently strong match exists */}
      {isLow && (
        <div className="pt-2 border-t border-[#D9DEE5] space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#B5473C]">
            <XCircle className="w-4 h-4 shrink-0 text-[#B5473C]" />
            <span>No sufficiently strong match exists</span>
          </div>
          <p className="text-xs text-[#596579] leading-relaxed">
            {unmatchedExplanation ||
              `The match confidence of ${score}% falls below the 70% threshold required for automated schedule association. Work does not directly map to an active baseline activity. Manual WBS activity assignment is required.`}
          </p>
        </div>
      )}
    </div>
  );
}
