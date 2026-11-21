'use client';

import React, { useState } from 'react';
import { Drawer } from './Drawer';
import { WhyExplanationData } from '../../lib/domain/whyExplanations';
import {
  HelpCircle,
  TrendingDown,
  Target,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Cpu,
  Info,
  ChevronDown,
  ChevronUp,
  GitBranch,
  ShieldCheck,
} from 'lucide-react';

export interface WhyExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WhyExplanationData | null;
  onOpenActivityDrawer?: (activityId: string) => void;
}

/**
 * PLnEX "Why?" Explanation Drawer
 *
 * Explains computed project information concisely across 6 dimensions:
 * - Progress (Verified progress breakdown)
 * - Confidence (Match scoring factors)
 * - Schedule Health (DCMA 14-point CPM integrity)
 * - Variance (Earned value planned vs actual)
 * - Delay (Root causes and predecessor lags)
 * - Impact (Downstream critical path cascades)
 *
 * Adheres to strict UX rules:
 * 1. Slide-over drawer format (not a center alert modal).
 * 2. Highlights concise contributing factors immediately.
 * 3. Does NOT expose technical implementation by default (progressive disclosure).
 * 4. The purpose is operational explainability, not technical complexity.
 */
export function WhyExplanationModal({
  isOpen,
  onClose,
  data,
  onOpenActivityDrawer,
}: WhyExplanationModalProps) {
  // Progressive disclosure: hide technical calculation/rule engine details by default
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  if (!data) return null;

  const getTypeIcon = () => {
    switch (data.type) {
      case 'progress':
        return <Activity className="w-5 h-5 text-[#006B61]" />;
      case 'confidence':
        return <Target className="w-5 h-5 text-[#006B61]" />;
      case 'health':
        return <ShieldCheck className="w-5 h-5 text-[#825700]" />;
      case 'variance':
        return <TrendingDown className="w-5 h-5 text-[#A43B36]" />;
      case 'delay':
        return <TrendingDown className="w-5 h-5 text-[#A43B36]" />;
      case 'impact':
        return <GitBranch className="w-5 h-5 text-[#A43B36]" />;
      default:
        return <HelpCircle className="w-5 h-5 text-[#006B61]" />;
    }
  };

  const getCategoryLabel = () => {
    switch (data.type) {
      case 'progress':
        return 'Progress';
      case 'confidence':
        return 'Confidence';
      case 'health':
        return 'Schedule Health';
      case 'variance':
        return 'Variance';
      case 'delay':
        return 'Delay';
      case 'impact':
        return 'Schedule Impact';
      default:
        return 'Project Controls';
    }
  };

  const getBadgeStyle = () => {
    switch (data.type) {
      case 'progress':
        return 'bg-[#EAF0E9] dark:bg-[#203129] text-[#006B61] dark:text-[#72C6AD] border-[#D9E2DA] dark:border-[#3A5146]';
      case 'confidence':
        return 'bg-[#EAF0E9] dark:bg-[#203129] text-[#006B61] dark:text-[#72C6AD] border-[#D9E2DA] dark:border-[#3A5146]';
      case 'health':
        return 'bg-[#F8EFDA] dark:bg-[#3A3120] text-[#825700] dark:text-[#F3D27E] border-[#E5C185] dark:border-[#5B4A2B]';
      case 'variance':
        return 'bg-[#F6E4E1] dark:bg-[#3B2422] text-[#A43B36] dark:text-[#FF9E94] border-[#DCABA7] dark:border-[#5B3734]';
      case 'delay':
        return 'bg-[#F6E4E1] dark:bg-[#3B2422] text-[#A43B36] dark:text-[#FF9E94] border-[#DCABA7] dark:border-[#5B3734]';
      case 'impact':
        return 'bg-[#F6E4E1] dark:bg-[#3B2422] text-[#A43B36] dark:text-[#FF9E94] border-[#DCABA7] dark:border-[#5B3734]';
      default:
        return 'bg-[#EAF0E9] dark:bg-[#203129] text-[#1A2B25] dark:text-[#F2F4E9] border-[#D9E2DA] dark:border-[#3A5146]';
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={data.title}
      subtitle={data.subjectName ? `${data.subjectId} • ${data.subjectName}` : data.subjectId}
      width="md"
      footer={
        <div className="flex items-center justify-between w-full text-xs">
          <div className="flex items-center gap-2 text-[#52665D] dark:text-[#B5C1B5] font-mono text-[11px] truncate max-w-xs">
            <Clock className="w-3.5 h-3.5 text-[#738A80] dark:text-[#859688] shrink-0" />
            <span className="truncate">{data.timestamp || 'Live Schedule Snapshot'}</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenActivityDrawer && data.subjectId && data.subjectId.includes('-') && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenActivityDrawer(data.subjectId);
                }}
                className="px-3 py-1.5 bg-[#EAF0E9] dark:bg-[#203129] hover:bg-[#DCEBF1] dark:hover:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg font-semibold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer text-xs"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Open Activity</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#103F39] hover:bg-[#0E1524] dark:bg-[#72C6AD] dark:hover:bg-[#5CB69C] text-white dark:text-[#0B2822] rounded-lg font-semibold shadow-xs transition-colors cursor-pointer text-xs"
            >
              Done
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Metric Summary Header Card */}
        <div className="p-4 rounded-xl bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-center shrink-0 shadow-2xs">
              {getTypeIcon()}
            </div>
            <div>
              <span className="text-[11px] uppercase font-semibold text-[#52665D] dark:text-[#B5C1B5] tracking-wider block">
                {data.metricLabel}
              </span>
              <div className="text-xl font-bold font-mono text-[#1A2B25] dark:text-[#F2F4E9] mt-0.5">
                {data.metricValue}
              </div>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-md text-[11px] font-semibold border self-center ${getBadgeStyle()}`}
          >
            {getCategoryLabel()}
          </div>
        </div>

        {/* Executive Plain English Summary */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] space-y-1">
          <span className="text-[11px] uppercase font-semibold text-[#52665D] dark:text-[#B5C1B5] tracking-wider block">
            Executive Summary
          </span>
          <p className="text-xs text-[#1A2B25] dark:text-[#F2F4E9] leading-relaxed">
            {data.summary}
          </p>
        </div>

        {/* Contributing Factors Breakdown (Core Explainability) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-semibold text-[#52665D] dark:text-[#B5C1B5] tracking-wider">
              Contributing Factors ({data.factors.length})
            </span>
            <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] font-mono">Impact / Contribution</span>
          </div>

          <div className="divide-y divide-[#D9E2DA] dark:divide-[#3A5146] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl overflow-hidden bg-white dark:bg-[#17221D]">
            {data.factors.map((f, idx) => (
              <div key={idx} className="p-3 hover:bg-[#F9FAFC] dark:hover:bg-[#243832]/60 transition-colors space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {f.status === 'positive' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#176B53] dark:text-[#72C6AD] shrink-0" />
                    ) : f.status === 'negative' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#A43B36] dark:text-[#FF9E94] shrink-0" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD] shrink-0" />
                    )}
                    <span className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9] text-xs">{f.factor}</span>
                  </div>
                  <span
                    className={`font-mono font-semibold text-[11px] px-2 py-0.5 rounded border shrink-0 ${
                      f.status === 'positive'
                        ? 'bg-[#E4F1E9] dark:bg-[#0E2C26] text-[#176B53] dark:text-[#72C6AD] border-[#BCE7D2] dark:border-[#1C5247]'
                        : f.status === 'negative'
                        ? 'bg-[#F6E4E1] dark:bg-[#3B2422] text-[#A43B36] dark:text-[#FF9E94] border-[#DCABA7] dark:border-[#5B3734]'
                        : 'bg-[#EAF0E9] dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] border-[#D9E2DA] dark:border-[#3A5146]'
                    }`}
                  >
                    {f.contribution}
                  </span>
                </div>
                <p className="text-[11px] text-[#52665D] pl-5 leading-normal">
                  {f.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Next Step */}
        {data.recommendation && (
          <div className="p-4 rounded-lg bg-[#E4F1E9] dark:bg-[#20382C] border border-[#B7DAC3] dark:border-[#315442] space-y-1">
            <div className="flex items-center gap-2 font-semibold text-[#1F6B4E] dark:text-[#9AD5AF] text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#1F6B4E] dark:text-[#9AD5AF]" />
              <span>Recommended Operational Next Step</span>
            </div>
            <p className="text-xs text-[#1A2B25] dark:text-[#F2F4E9] leading-relaxed">
              {data.recommendation}
            </p>
          </div>
        )}

        {/* Progressive Disclosure: Technical Details (Collapsed by Default) */}
        {data.algorithmOrRule && (
          <div className="pt-2 border-t border-[#D9E2DA]/80 dark:border-[#3A5146]">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between p-2 rounded text-[11px] font-medium text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#203129] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#738A80] dark:text-[#859688]" />
                <span>Technical Details</span>
              </span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#738A80] dark:text-[#859688]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#738A80] dark:text-[#859688]" />
              )}
            </button>

            {showTechnicalDetails && (
              <div className="mt-2 p-3 rounded-lg bg-[#F6F7F3] dark:bg-[#203129] border border-[#D9E2DA] dark:border-[#3A5146] space-y-2 text-[11px] font-mono">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#738A80] dark:text-[#859688]">Calculation Baseline:</span>
                  <span className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] text-right">{data.algorithmOrRule}</span>
                </div>
                <div className="flex items-center justify-between text-[#738A80] dark:text-[#859688]">
                  <span>Verification Signature:</span>
                  <span className="text-[#006B61] dark:text-[#72C6AD]">Verified Schedule Twin Calculation</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}

// Re-export as WhyExplanationDrawer as well for clean semantics
export { WhyExplanationModal as WhyExplanationDrawer };
