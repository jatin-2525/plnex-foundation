'use client';

import React, { useState } from 'react';
import {
  FileText,
  Cpu,
  Layers,
  Target,
  Percent,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  Info,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface CoreFlowBannerProps {
  currentStage?:
    | 'FIELD_INPUT'
    | 'EXTRACTION'
    | 'EXECUTION_EVENT'
    | 'CANDIDATE_MATCH'
    | 'CONFIDENCE'
    | 'HUMAN_VERIFICATION'
    | 'VERIFIED_UPDATE';
  className?: string;
  collapsible?: boolean;
}

const FLOW_STEPS = [
  {
    key: 'FIELD_INPUT',
    num: 1,
    title: 'FIELD INPUT',
    subtitle: 'Site Diary, Voice, DPR, Mobile Form',
    icon: FileText,
    isAi: false,
    isGate: false,
  },
  {
    key: 'EXTRACTION',
    num: 2,
    title: 'EXTRACTION',
    subtitle: 'Parsed Quantities, Line, Discipline',
    icon: Cpu,
    isAi: true,
    isGate: false,
  },
  {
    key: 'EXECUTION_EVENT',
    num: 3,
    title: 'EXECUTION EVENT',
    subtitle: 'Structured Field Observation',
    icon: Layers,
    isAi: false,
    isGate: false,
  },
  {
    key: 'CANDIDATE_MATCH',
    num: 4,
    title: 'CANDIDATE MATCH',
    subtitle: 'Suggested Schedule WBS Activity',
    icon: Target,
    isAi: true,
    isGate: false,
  },
  {
    key: 'CONFIDENCE',
    num: 5,
    title: 'CONFIDENCE',
    subtitle: 'Explainable Similarity Score (e.g. 94%)',
    icon: Percent,
    isAi: true,
    isGate: false,
  },
  {
    key: 'HUMAN_VERIFICATION',
    num: 6,
    title: 'HUMAN VERIFICATION',
    subtitle: 'Conscious Planner / Engineer Decision',
    icon: UserCheck,
    isAi: false,
    isGate: true,
  },
  {
    key: 'VERIFIED_UPDATE',
    num: 7,
    title: 'VERIFIED UPDATE',
    subtitle: 'Schedule Twin Progress Commit',
    icon: CheckCircle2,
    isAi: false,
    isGate: false,
  },
];

export function CoreFlowBanner({
  currentStage = 'HUMAN_VERIFICATION',
  className = '',
  collapsible = true,
}: CoreFlowBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      className={`bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg overflow-hidden shadow-xs ${className}`}
      data-testid="plnex-core-flow-banner"
    >
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-[#F6F7F3] dark:bg-[#101815] border-b border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#006B61]/10 dark:bg-[#72C6AD]/10 text-[#006B61] dark:text-[#72C6AD] flex items-center justify-center font-bold text-xs">
            Px
          </div>
          <span className="font-bold text-xs uppercase tracking-wider text-[#1A2B25] dark:text-[#F2F4E9]">
            PLnEX Schedule Linking Core Flow
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white dark:bg-[#203129] border border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5]">
            Candidate Match ≠ Final Authority
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] hidden md:inline">
            7-Step Pipeline: From Field Capture to Baseline Twin
          </span>
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isExpanded ? 'Hide Pipeline' : 'Show Pipeline'}</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Flow Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Visual Step Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
            {FLOW_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCurrent = step.key === currentStage;
              const isGate = step.isGate;

              return (
                <div
                  key={step.key}
                  className={`relative p-3 rounded-lg border transition-all flex flex-col justify-between ${
                    isGate
                      ? 'border-[#006B61] dark:border-[#72C6AD] bg-[#EAF0E9] dark:bg-[#20382C] ring-2 ring-[#006B61]/20 dark:ring-[#72C6AD]/20'
                      : isCurrent
                      ? 'border-[#D9E2DA] dark:border-[#3A5146] bg-white dark:bg-[#17221D] shadow-xs'
                      : 'border-[#D9E2DA] dark:border-[#3A5146] bg-[#FAFAFA] dark:bg-[#203129]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                          isGate
                            ? 'bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822]'
                            : 'bg-[#EAF0E9] dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5]'
                        }`}
                      >
                        {step.num}
                      </span>
                      {isGate ? (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822]">
                          Human Gate
                        </span>
                      ) : step.isAi ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase bg-[#EAF0E9] dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5]">
                          Assisted
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase bg-[#EAF0E9] dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5]">
                          Field Record
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isGate
                            ? 'text-[#006B61] dark:text-[#72C6AD]'
                            : isCurrent
                            ? 'text-[#1A2B25] dark:text-[#F2F4E9]'
                            : 'text-[#738A80] dark:text-[#859688]'
                        }`}
                      />
                      <h4
                        className={`text-xs font-bold tracking-tight ${
                          isGate
                            ? 'text-[#006B61] dark:text-[#72C6AD]'
                            : 'text-[#1A2B25] dark:text-[#F2F4E9]'
                        }`}
                      >
                        {step.title}
                      </h4>
                    </div>

                    <p className="text-[10px] text-[#52665D] dark:text-[#B5C1B5] leading-tight">
                      {step.subtitle}
                    </p>
                  </div>

                  {/* Flow arrow on wide screens */}
                  {idx < FLOW_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-[#738A80] dark:text-[#859688]">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Core Governance Disclaimer */}
          <div className="p-3 bg-[#F8EFDA] dark:bg-[#3A3120] border border-[#E5C185] dark:border-[#5B4A2B] rounded-lg flex items-start gap-2 text-xs">
            <ShieldAlert className="w-4 h-4 text-[#825700] dark:text-[#F3D27E] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                Strict Decoupling: Match Confidence is NOT Verification
              </span>
              <p className="text-[#52665D] dark:text-[#B5C1B5] leading-relaxed">
                A 94% score indicates candidate match alignment — it is <strong>never automatically verified</strong>. Candidate matches are never silently converted into verified progress without conscious confirmation by the Project Controls Manager or Site Engineer.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoreFlowBanner;
