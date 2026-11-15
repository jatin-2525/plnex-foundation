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
      className={`bg-white border border-[#D9E2DA] rounded-lg overflow-hidden shadow-xs ${className}`}
      data-testid="plnex-core-flow-banner"
    >
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-[#F6F7F3] border-b border-[#D9E2DA] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#006B61]/10 text-[#006B61] flex items-center justify-center font-bold text-xs">
            Px
          </div>
          <span className="font-bold text-xs uppercase tracking-wider text-[#1A2B25]">
            PLnEX Schedule Linking Core Flow
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-[#D9E2DA] text-[#52665D]">
            Candidate Match ≠ Final Authority
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#52665D] hidden md:inline">
            7-Step Pipeline: From Field Capture to Baseline Twin
          </span>
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-semibold text-[#006B61] hover:underline flex items-center gap-1"
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
                      ? 'border-[#006B61] bg-[#EAF0E9] ring-2 ring-[#006B61]/20'
                      : isCurrent
                      ? 'border-[#D9E2DA] bg-white shadow-xs'
                      : 'border-[#D9E2DA] bg-[#FAFAFA]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                          isGate
                            ? 'bg-[#006B61] text-white'
                            : 'bg-[#EAF0E9] text-[#52665D]'
                        }`}
                      >
                        {step.num}
                      </span>
                      {isGate ? (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase bg-[#006B61] text-white">
                          Human Gate
                        </span>
                      ) : step.isAi ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase bg-[#EAF0E9] text-[#52665D]">
                          Assisted
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase bg-[#EAF0E9] text-[#52665D]">
                          Field Record
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isGate
                            ? 'text-[#006B61]'
                            : isCurrent
                            ? 'text-[#1A2B25]'
                            : 'text-[#738A80]'
                        }`}
                      />
                      <h4
                        className={`text-xs font-bold tracking-tight ${
                          isGate ? 'text-[#006B61]' : 'text-[#1A2B25]'
                        }`}
                      >
                        {step.title}
                      </h4>
                    </div>

                    <p className="text-[10px] text-[#52665D] leading-tight">
                      {step.subtitle}
                    </p>
                  </div>

                  {/* Flow arrow on wide screens */}
                  {idx < FLOW_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-[#738A80]">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Core Governance Disclaimer */}
          <div className="p-3 bg-[#F8EFDA] border border-[#E5C185] rounded-lg flex items-start gap-2 text-xs">
            <ShieldAlert className="w-4 h-4 text-[#825700] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[#1A2B25]">
                Strict Decoupling: Match Confidence is NOT Verification
              </span>
              <p className="text-[#52665D] leading-relaxed">
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
