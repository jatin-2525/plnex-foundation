'use client';

import React from 'react';
import { Modal } from './Modal';
import { WhyExplanationData } from '../../lib/domain/whyExplanations';
import {
  HelpCircle,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Layers,
  Cpu,
  Info,
} from 'lucide-react';

export interface WhyExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WhyExplanationData | null;
  onOpenActivityDrawer?: (activityId: string) => void;
}

export function WhyExplanationModal({
  isOpen,
  onClose,
  data,
  onOpenActivityDrawer,
}: WhyExplanationModalProps) {
  if (!data) return null;

  const getTypeIcon = () => {
    switch (data.type) {
      case 'delay':
        return <TrendingDown className="w-5 h-5 text-[#B5473C]" />;
      case 'confidence':
        return <Sparkles className="w-5 h-5 text-[#176B87]" />;
      case 'health':
        return <Activity className="w-5 h-5 text-[#D98B32]" />;
      case 'variance':
        return <TrendingDown className="w-5 h-5 text-[#D98B32]" />;
      default:
        return <HelpCircle className="w-5 h-5 text-[#176B87]" />;
    }
  };

  const getBadgeStyle = () => {
    switch (data.type) {
      case 'delay':
        return 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]';
      case 'confidence':
        return 'bg-[#EDF5F8] text-[#176B87] border-[#B3CBE0]';
      case 'health':
        return 'bg-[#FDF6ED] text-[#D98B32] border-[#F0D4A6]';
      case 'variance':
        return 'bg-[#FDF6ED] text-[#D98B32] border-[#F0D4A6]';
      default:
        return 'bg-[#F1F3F5] text-[#172033] border-[#D9DEE5]';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data.title}
      subtitle={data.subjectName ? `${data.subjectId} • ${data.subjectName}` : data.subjectId}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full text-xs">
          <div className="flex items-center gap-1.5 text-[#596579] font-mono text-[11px] truncate max-w-xs">
            <Clock className="w-3.5 h-3.5 text-[#7B8798] shrink-0" />
            <span className="truncate">Timestamp: {data.timestamp || 'Authoritative Snapshot'}</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenActivityDrawer && data.subjectId.includes('-') && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenActivityDrawer(data.subjectId);
                }}
                className="px-3 py-1.5 bg-[#EDF5F8] hover:bg-[#DCEBF1] text-[#176B87] border border-[#B3CBE0] rounded-lg font-bold shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Open Activity Drawer</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#172033] hover:bg-[#0E1524] text-white rounded-lg font-semibold shadow-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Metric Summary Header Card */}
        <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-[#D9DEE5] flex items-center justify-center shrink-0 shadow-2xs">
              {getTypeIcon()}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#7B8798] tracking-wider block">
                {data.metricLabel}
              </span>
              <div className="text-base font-bold font-mono text-[#172033] mt-0.5">
                {data.metricValue}
              </div>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold border self-start sm:self-auto ${getBadgeStyle()}`}>
            Transparent Logic Model
          </div>
        </div>

        {/* Executive Plain English Summary */}
        <div className="p-3.5 rounded-lg bg-white border border-[#D9DEE5] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#7B8798] tracking-wider block">
            Executive Root-Cause Summary
          </span>
          <p className="text-xs text-[#172033] leading-relaxed">
            {data.summary}
          </p>
        </div>

        {/* Contributing Factors Breakdown Table / List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#7B8798] tracking-wider">
              Scoring Factors &amp; Contributors ({data.factors.length})
            </span>
            <span className="text-[11px] text-[#596579] font-mono">Weight / Impact</span>
          </div>

          <div className="divide-y divide-[#D9DEE5] border border-[#D9DEE5] rounded-lg overflow-hidden bg-white">
            {data.factors.map((f, idx) => (
              <div key={idx} className="p-3 hover:bg-[#F9FAFC] transition-colors space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {f.status === 'positive' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
                    ) : f.status === 'negative' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#B5473C] shrink-0" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-[#176B87] shrink-0" />
                    )}
                    <span className="font-bold text-[#172033] text-xs">{f.factor}</span>
                  </div>
                  <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                    f.status === 'positive'
                      ? 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]'
                      : f.status === 'negative'
                      ? 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]'
                      : 'bg-[#EDF5F8] text-[#176B87] border-[#B3CBE0]'
                  }`}>
                    {f.contribution}
                  </span>
                </div>
                <p className="text-[11px] text-[#596579] pl-5 leading-normal">
                  {f.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation / Actionable Next Step */}
        {data.recommendation && (
          <div className="p-3.5 rounded-lg bg-[#EDF7F2] border border-[#B8DCC9] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#2E7D5B] text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />
              <span>Recommended Project Controls Action</span>
            </div>
            <p className="text-xs text-[#172033] leading-relaxed">
              {data.recommendation}
            </p>
          </div>
        )}

        {/* Underlying Rule / Algorithm / Version */}
        {data.algorithmOrRule && (
          <div className="p-2.5 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] flex items-center justify-between text-[11px] text-[#596579] font-mono">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-[#176B87]" />
              <span>Rule Engine: <strong>{data.algorithmOrRule}</strong></span>
            </div>
            <span className="text-[#7B8798]">Deterministic Trace</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
