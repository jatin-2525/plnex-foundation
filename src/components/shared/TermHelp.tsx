'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, ExternalLink, BookOpen } from 'lucide-react';

export type ProjectControlTerm =
  | 'float'
  | 'wbs'
  | 'forecast'
  | 'variance'
  | 'confidence'
  | 'cpi'
  | 'spi'
  | 'data_date'
  | 's_curve'
  | 'critical_path'
  | 'verified_progress'
  | 'progress';

export interface TermDefinition {
  term: string;
  name: string;
  short: string;
  detail: string;
  formula?: string;
  referenceStandard: string;
}

export const GLOSSARY: Record<ProjectControlTerm, TermDefinition> = {
  float: {
    term: 'float',
    name: 'Total Float (Buffer)',
    short: 'Allowable delay before project completion slips.',
    detail:
      'The amount of time that an activity can be delayed or extended from its early start date without delaying the project completion date or violating a schedule constraint. Activities with 0 days total float form the Critical Path.',
    formula: 'Total Float = Late Finish - Early Finish',
    referenceStandard: 'AACE International Recommended Practice 29R-03 / PMI PMBOK Guide',
  },
  wbs: {
    term: 'wbs',
    name: 'Work Breakdown Structure (WBS)',
    short: 'Hierarchical scope decomposition from plant to work package.',
    detail:
      'A deliverable-oriented hierarchical decomposition of the work to be executed by the project team to accomplish project objectives. In PLnEX, Level 1 is the Facility, Level 3 is Discipline/System, and Level 5 is the Field Activity.',
    formula: 'L1 (Facility) → L2 (Area) → L3 (System) → L4 (Subsystem) → L5 (Work Package) → L6 (Component)',
    referenceStandard: 'ISO 21511 / Primavera P6 Hierarchical Schema',
  },
  forecast: {
    term: 'forecast',
    name: 'Forecast at Completion (FAC)',
    short: 'Projected completion date based on actual field productivity.',
    detail:
      'The forward-pass expected finish date calculated by applying remaining work quantities against proven shift burn rates. Forecast extends from the reporting Data Date forward.',
    formula: 'Forecast Finish = Data Date + (Remaining Work / Current Daily Burn Rate)',
    referenceStandard: 'EIA-748 Earned Value Management Standard',
  },
  variance: {
    term: 'variance',
    name: 'Schedule Variance & Sign Conventions',
    short: 'Difference between verified actual and planned baseline progress.',
    detail:
      'In physical progress project controls, two standard sign conventions apply:\n• Progress % Variance uses negative values for delays/slip (e.g. 73.0% actual - 80.0% planned = -7.0 pp slip).\n• Delay Duration uses positive values for calendar slip days (e.g. +5.0d slip beyond baseline finish date).',
    formula: 'Progress % Variance = Actual % - Planned % (Negative = Behind) | Delay Slip Days = Forecast Finish - Baseline Finish (Positive = Late)',
    referenceStandard: 'AACE RP 55R-09 / Earned Value Management System',
  },
  verified_progress: {
    term: 'verified_progress',
    name: 'Verified Physical Progress (%)',
    short: 'Audited physical completion backed by field evidence and engineering sign-off.',
    detail:
      'The percentage of physical work completed to date, validated through inspection evidence and engineering sign-off, independent of incurred cost or spend. Calculated as (Earned Physical Quantities / Total Baseline Quantities) * 100.',
    formula: 'Verified Progress % = Σ (Installed Quantity Done / Target Quantity) * Work Package Weight',
    referenceStandard: 'AACE International Recommended Practice 37R-06 / Level 5 Quantity Tracking',
  },
  progress: {
    term: 'progress',
    name: 'Verified Physical Progress (%)',
    short: 'Audited physical completion backed by field evidence and engineering sign-off.',
    detail:
      'The percentage of physical work completed to date, validated through inspection evidence and engineering sign-off, independent of incurred cost or spend. Calculated as (Earned Physical Quantities / Total Baseline Quantities) * 100.',
    formula: 'Verified Progress % = Σ (Installed Quantity Done / Target Quantity) * Work Package Weight',
    referenceStandard: 'AACE International Recommended Practice 37R-06 / Level 5 Quantity Tracking',
  },
  confidence: {
    term: 'confidence',
    name: 'Match Confidence Score',
    short: 'Deterministic rule score matching field reports to WBS activities.',
    detail:
      'Multi-factor alignment score (0–100%) derived from Asset Tag (35%), Discipline (25%), Action Verb (20%), and Temporal Window (20%). Scores ≥90% are recommended for sign-off; scores 70%–89% require planner review.',
    formula: 'Score = Tag Match (35%) + Trade (25%) + Action (20%) + Window (20%)',
    referenceStandard: 'PLnEX Deterministic Linking Engine Specification',
  },
  cpi: {
    term: 'cpi',
    name: 'Cost Performance Index (CPI)',
    short: 'Cost efficiency ratio of earned value to actual cost.',
    detail:
      'Measures financial efficiency. A CPI of 1.0 means budget equals earned value. CPI < 1.0 indicates cost overrun.',
    formula: 'CPI = Earned Value (EV) / Actual Cost (AC)',
    referenceStandard: 'ANSI/EIA-748 EVMS Standard',
  },
  spi: {
    term: 'spi',
    name: 'Schedule Performance Index (SPI)',
    short: 'Schedule efficiency ratio of earned value to planned value.',
    detail:
      'Measures execution velocity. SPI of 1.0 means project is on target. SPI < 1.0 indicates work is advancing slower than baseline schedule.',
    formula: 'SPI = Earned Value (EV) / Planned Value (PV)',
    referenceStandard: 'ANSI/EIA-748 EVMS Standard',
  },
  data_date: {
    term: 'data_date',
    name: 'Cutoff Data Date',
    short: 'The chronological cutoff separating actuals from forecasts.',
    detail:
      'The reference date up to which all progress, quantities, man-hours, and expenditures are recorded as verified actuals. All work subsequent to this date represents scheduled forecast.',
    formula: 'Past / Left = Verified Actuals | Future / Right = Planned / Forecast',
    referenceStandard: 'Primavera P6 Data Date Protocol / AACE RP 29R-03',
  },
  s_curve: {
    term: 's_curve',
    name: 'Progress S-Curve',
    short: 'Cumulative earned progress envelope plotted over project timeline.',
    detail:
      'A cumulative plot of physical progress against time, typically forming an S-shape due to slow startup acceleration, peak production during intermediate construction, and gradual leveling off during final commissioning and punchlisting.',
    formula: 'Cumulative Progress % = Σ(Earned Quantity * WBS Weight) / Total Target',
    referenceStandard: 'AACE International Recommended Practice 55R-09',
  },
  critical_path: {
    term: 'critical_path',
    name: 'Critical Path Method (CPM)',
    short: 'The zero-float sequence of activities controlling project duration.',
    detail:
      'The longest continuous path of dependent activities through a schedule network. Any delay to an activity on the critical path directly delays the contractual commercial operation date (COD).',
    formula: 'Critical Path: Activities where Total Float = 0 days',
    referenceStandard: 'ASCE Standard 67-17 / CPM Scheduling Best Practices',
  },
};

export interface TermHelpProps {
  term: ProjectControlTerm;
  children?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

export function TermHelp({
  term,
  children,
  showIcon = true,
  className = '',
}: TermHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const def = GLOSSARY[term] || GLOSSARY.variance;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <span className="relative inline-flex items-center align-baseline">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label={`Explain term: ${def.name}`}
        title={`Click for definition: ${def.name}`}
        className={`inline-flex items-center gap-0.5 text-inherit hover:text-[#0F6B68] transition-colors cursor-pointer border-b border-dotted border-[#526779] hover:border-[#0F6B68] ${className}`}
      >
        <span>{children || def.name}</span>
        {showIcon && (
          <HelpCircle className="w-3 h-3 text-[#526779] hover:text-[#0F6B68] shrink-0 ml-0.5 inline" />
        )}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={def.name}
          className="absolute z-50 left-0 bottom-full mb-2 w-80 sm:w-96 p-4 bg-white rounded-lg border border-[#D8E2EA] shadow-lg text-left text-xs font-normal text-[#142C3F] animate-in fade-in zoom-in-95 duration-100"
          style={{ maxWidth: 'calc(100vw - 32px)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#D8E2EA]">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#0F6B68]" />
              <span className="font-bold text-sm text-[#142C3F]">{def.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-[#526779] hover:text-[#142C3F] rounded hover:bg-[#F3F6FA] transition-colors"
              aria-label="Close explanation"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="py-2.5 space-y-2">
            <p className="text-[#142C3F] leading-relaxed">
              {def.detail}
            </p>

            {def.formula && (
              <div className="p-2 rounded bg-[#F3F6FA] border border-[#D8E2EA] font-mono text-[11px] text-[#0F6B68]">
                <strong className="text-[#526779] font-sans block text-[10px] uppercase tracking-wider mb-0.5">
                  Calculation Formula:
                </strong>
                {def.formula}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-[#D8E2EA] flex items-center justify-between text-[10px] text-[#526779]">
            <span>Standard: {def.referenceStandard}</span>
            <span className="font-mono text-[#0F6B68]">PLnEX Controls</span>
          </div>
        </div>
      )}
    </span>
  );
}
