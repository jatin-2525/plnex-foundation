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
        return <Activity className="w-5 h-5 text-[#0F6B68]" />;
      case 'confidence':
        return <Target className="w-5 h-5 text-[#0F6B68]" />;
      case 'health':
        return <ShieldCheck className="w-5 h-5 text-[#845006]" />;
      case 'variance':
        return <TrendingDown className="w-5 h-5 text-[#A24335]" />;
      case 'delay':
        return <TrendingDown className="w-5 h-5 text-[#A24335]" />;
      case 'impact':
        return <GitBranch className="w-5 h-5 text-[#A24335]" />;
      default:
        return <HelpCircle className="w-5 h-5 text-[#0F6B68]" />;
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
        return 'bg-[#EAF0F5] text-[#0F6B68] border-[#D8E2EA]';
      case 'confidence':
        return 'bg-[#EAF0F5] text-[#0F6B68] border-[#D8E2EA]';
      case 'health':
        return 'bg-[#FFF1D3] text-[#8C5311] border-[#F0D4A6]';
      case 'variance':
        return 'bg-[#FCE8E4] text-[#A24335] border-[#E4B0AA]';
      case 'delay':
        return 'bg-[#FCE8E4] text-[#A24335] border-[#E4B0AA]';
      case 'impact':
        return 'bg-[#FCE8E4] text-[#A24335] border-[#E4B0AA]';
      default:
        return 'bg-[#EAF0F5] text-[#142C3F] border-[#D8E2EA]';
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
          <div className="flex items-center gap-2 text-[#526779] font-mono text-[11px] truncate max-w-xs">
            <Clock className="w-3.5 h-3.5 text-[#7B8798] shrink-0" />
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
                className="px-3 py-1.5 bg-[#EAF0F5] hover:bg-[#DCEBF1] text-[#0F6B68] border border-[#D8E2EA] rounded-lg font-semibold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer text-xs"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Open Activity</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#142C3F] hover:bg-[#0E1524] text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer text-xs"
            >
              Done
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Metric Summary Header Card */}
        <div className="p-4 rounded-lg bg-[#F3F6FA] border border-[#D8E2EA] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-[#D8E2EA] flex items-center justify-center shrink-0 shadow-2xs">
              {getTypeIcon()}
            </div>
            <div>
              <span className="text-[11px] uppercase font-semibold text-[#526779] tracking-wider block">
                {data.metricLabel}
              </span>
              <div className="text-xl font-bold font-mono text-[#142C3F] mt-0.5">
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
        <div className="p-4 rounded-lg bg-white border border-[#D8E2EA] space-y-1">
          <span className="text-[11px] uppercase font-semibold text-[#526779] tracking-wider block">
            Executive Summary
          </span>
          <p className="text-xs text-[#142C3F] leading-relaxed">
            {data.summary}
          </p>
        </div>

        {/* Contributing Factors Breakdown (Core Explainability) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-semibold text-[#526779] tracking-wider">
              Contributing Factors ({data.factors.length})
            </span>
            <span className="text-[11px] text-[#526779] font-mono">Impact / Contribution</span>
          </div>

          <div className="divide-y divide-[#D8E2EA] border border-[#D8E2EA] rounded-lg overflow-hidden bg-white">
            {data.factors.map((f, idx) => (
              <div key={idx} className="p-3 hover:bg-[#F9FAFC] transition-colors space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {f.status === 'positive' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
                    ) : f.status === 'negative' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#A24335] shrink-0" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-[#0F6B68] shrink-0" />
                    )}
                    <span className="font-semibold text-[#142C3F] text-xs">{f.factor}</span>
                  </div>
                  <span
                    className={`font-mono font-semibold text-[11px] px-2 py-0.5 rounded border shrink-0 ${
                      f.status === 'positive'
                        ? 'bg-[#E4F4EC] text-[#2E7D5B] border-[#B8DCC9]'
                        : f.status === 'negative'
                        ? 'bg-[#FCE8E4] text-[#A24335] border-[#E4B0AA]'
                        : 'bg-[#EAF0F5] text-[#0F6B68] border-[#D8E2EA]'
                    }`}
                  >
                    {f.contribution}
                  </span>
                </div>
                <p className="text-[11px] text-[#526779] pl-5 leading-normal">
                  {f.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Next Step */}
        {data.recommendation && (
          <div className="p-4 rounded-lg bg-[#E4F4EC] border border-[#B8DCC9] space-y-1">
            <div className="flex items-center gap-2 font-semibold text-[#2E7D5B] text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />
              <span>Recommended Operational Next Step</span>
            </div>
            <p className="text-xs text-[#142C3F] leading-relaxed">
              {data.recommendation}
            </p>
          </div>
        )}

        {/* Progressive Disclosure: Technical Details (Collapsed by Default) */}
        {data.algorithmOrRule && (
          <div className="pt-2 border-t border-[#D8E2EA]/80">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between p-2 rounded text-[11px] font-medium text-[#526779] hover:text-[#142C3F] hover:bg-[#EAF0F5] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#7B8798]" />
                <span>Technical Details</span>
              </span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#7B8798]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#7B8798]" />
              )}
            </button>

            {showTechnicalDetails && (
              <div className="mt-2 p-3 rounded-lg bg-[#F3F6FA] border border-[#D8E2EA] space-y-2 text-[11px] font-mono">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#7B8798]">Calculation Baseline:</span>
                  <span className="font-bold text-[#142C3F] text-right">{data.algorithmOrRule}</span>
                </div>
                <div className="flex items-center justify-between text-[#7B8798]">
                  <span>Verification Signature:</span>
                  <span className="text-[#0F6B68]">Verified Schedule Twin Calculation</span>
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
