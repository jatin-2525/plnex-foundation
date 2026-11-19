'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sliders,
  ShieldAlert,
} from 'lucide-react';

export interface WorkfrontZone {
  id: string;
  name: string;
  code: string;
  wbs: string;
  discipline: string;
  progress: number;
  plannedProgress: number;
  status: 'on-track' | 'behind-plan' | 'critical-blocker' | 'pending-review';
  statusLabel: string;
  blocker?: string;
  activities: Array<{ id: string; name: string; progress: number; status: string }>;
  evidenceIds: string[];
  chainage: string;
  svgCoords: { x: number; y: number; width: number; height: number };
}

const WORKFRONT_ZONES: WorkfrontZone[] = [
  {
    id: 'ZONE-A',
    name: 'Unit A — Gas Processing Area (Piperack B)',
    code: 'UNIT-A-PRB',
    wbs: '1.1.3 (Piping)',
    discipline: 'Piping',
    progress: 70,
    plannedProgress: 85,
    status: 'behind-plan',
    statusLabel: 'Behind Plan (-15%)',
    blocker: '2-day welder shortage on Line 24-XX field joints; NDT clearance pending.',
    activities: [
      { id: 'PIP-24-001', name: 'Erect Line 24-XX High Pressure Gas Header', progress: 100, status: 'Completed (Late)' },
      { id: 'PIP-24-002', name: 'Weld Line 24-XX Field Joints & NDT Clearance', progress: 70, status: 'In Progress (Delayed)' },
    ],
    evidenceIds: ['EVD-001', 'EVD-002', 'EVD-004'],
    chainage: 'Grid A3-B6 · Chainage CH 0+240 to 0+380',
    svgCoords: { x: 40, y: 40, width: 280, height: 160 },
  },
  {
    id: 'ZONE-B',
    name: 'Unit B — Compressor House & Pedestals',
    code: 'UNIT-B-CMP',
    wbs: '1.1.1 / 1.1.2 (Civil)',
    discipline: 'Civil',
    progress: 45,
    plannedProgress: 60,
    status: 'critical-blocker',
    statusLabel: 'Critical Path Blocker (+5d Slip)',
    blocker: 'Mandatory 7-day cylinder compressive strength curing hold on baseplate grout (CIV-11-002).',
    activities: [
      { id: 'CIV-11-001', name: 'Foundation Block A Compressor Pedestal', progress: 100, status: 'Completed' },
      { id: 'CIV-11-002', name: 'Compressor House Baseplate Grouting & Anchor Setting', progress: 45, status: 'Delayed (+5d)' },
    ],
    evidenceIds: ['EVD-003', 'EVD-012'],
    chainage: 'Grid C1-D4 · Chainage CH 0+080 to 0+190',
    svgCoords: { x: 360, y: 40, width: 280, height: 160 },
  },
  {
    id: 'ZONE-C',
    name: 'Offsites, Flare KO Drum & Manifold',
    code: 'OFF-FLARE',
    wbs: '1.1.4 (Piping / Mech)',
    discipline: 'Mechanical',
    progress: 25,
    plannedProgress: 30,
    status: 'pending-review',
    statusLabel: 'Pending Match Review (62%)',
    blocker: '35m flare line field observation under review; candidate activity PIP-24-003.',
    activities: [
      { id: 'PIP-24-003', name: 'Hydrostatic Test Section Line 24-XX (150 bar)', progress: 0, status: 'Not Started' },
    ],
    evidenceIds: ['EVD-005', 'EVD-006'],
    chainage: 'Grid F1-G3 · Chainage CH 0+520 to 0+680',
    svgCoords: { x: 40, y: 230, width: 280, height: 150 },
  },
  {
    id: 'ZONE-D',
    name: 'Substation & Main Control Building',
    code: 'SUB-MCB',
    wbs: '1.1.5 (Electrical)',
    discipline: 'Electrical',
    progress: 60,
    plannedProgress: 60,
    status: 'on-track',
    statusLabel: 'On Schedule (Re-sequenced)',
    blocker: undefined,
    activities: [
      { id: 'ELE-11-032', name: 'Cable Tray Installation Substation', progress: 60, status: 'In Progress' },
    ],
    evidenceIds: ['EVD-007'],
    chainage: 'Grid E4-F6 · Chainage CH 0+410 to 0+490',
    svgCoords: { x: 360, y: 230, width: 280, height: 150 },
  },
];

export function WorkfrontSchematic({ className = '' }: { className?: string }) {
  const { openActivityDrawer } = useApp();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ZONE-A');

  const selectedZone = WORKFRONT_ZONES.find((z) => z.id === selectedZoneId) || WORKFRONT_ZONES[0];

  const getStatusColor = (status: WorkfrontZone['status']) => {
    switch (status) {
      case 'on-track':
        return {
          stroke: isDark ? '#72C6AD' : '#08786A',
          fill: isDark ? '#172B23' : '#EAF0E9',
          badgeText: isDark ? '#9AD5AF' : '#1F6B4E',
          badgeBg: isDark ? '#20382C' : '#E4F1E9',
        };
      case 'behind-plan':
        return {
          stroke: isDark ? '#E5C185' : '#C8963E',
          fill: isDark ? '#2B2416' : '#FBF5E8',
          badgeText: isDark ? '#F3D27E' : '#825700',
          badgeBg: isDark ? '#3A3120' : '#F8EFDA',
        };
      case 'critical-blocker':
        return {
          stroke: isDark ? '#FF9E94' : '#C7522A',
          fill: isDark ? '#351C1A' : '#FBF0ED',
          badgeText: isDark ? '#FF9E94' : '#A43B36',
          badgeBg: isDark ? '#3B2422' : '#F6E4E1',
        };
      case 'pending-review':
        return {
          stroke: isDark ? '#A9A3D8' : '#7872A8',
          fill: isDark ? '#242236' : '#F4F3FA',
          badgeText: isDark ? '#C7C2EA' : '#544E85',
          badgeBg: isDark ? '#2E2B45' : '#ECEAF7',
        };
    }
  };

  return (
    <div className={`bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-4 sm:p-5 shadow-xs transition-colors ${className}`}>
      {/* Schematic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9E2DA] dark:border-[#3A5146]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#EAF0E9] dark:bg-[#203129] text-[#08786A] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146] text-[11px] font-mono font-bold uppercase">
              <MapPin className="w-3 h-3" />
              2D Workfront Schematic
            </span>
            <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
              Engineering Plot Plan · Non-BIM Schematic Model
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#182920] dark:text-[#F2F4E9] font-heading mt-1">
            Site Workfront Spatial Progress & Blocker Map
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#52665D] dark:text-[#B5C1B5]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#08786A] dark:bg-[#72C6AD]" title="On Track" />
          <span>Active</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#C8963E] dark:bg-[#E5C185] ml-2" title="Behind Plan" />
          <span>At Risk</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#C7522A] dark:bg-[#FF9E94] ml-2" title="Critical Blocker" />
          <span>Blocker</span>
        </div>
      </div>

      {/* Schematic Grid + Detail Inspection Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4 items-start">
        {/* SVG Schematic Canvas (7 cols on lg) */}
        <div className="lg:col-span-7 bg-[#F5F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-2 overflow-hidden relative">
          <svg
            viewBox="0 0 680 420"
            className="w-full h-auto select-none"
            style={{ minHeight: '260px' }}
            aria-label="Interactive 2D site workfront layout map"
          >
            {/* Engineering Grid Backdrop */}
            <defs>
              <pattern id="workfront-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke={isDark ? '#1C2923' : '#E2EBE1'}
                  strokeWidth="0.75"
                />
              </pattern>
            </defs>
            <rect width="680" height="420" fill="url(#workfront-grid)" />

            {/* Piperack Interconnect Line */}
            <path
              d="M 180 200 L 180 230 L 360 230"
              fill="none"
              stroke={isDark ? '#3A5146' : '#B5C1B5'}
              strokeWidth="3"
              strokeDasharray="4,4"
            />
            <text
              x="270"
              y="222"
              fill={isDark ? '#859688' : '#738A80'}
              fontSize="10"
              fontFamily="monospace"
              textAnchor="middle"
            >
              RACK-B HP INTERCONNECT
            </text>

            {/* Interactive Workfront Zones */}
            {WORKFRONT_ZONES.map((zone) => {
              const isSelected = zone.id === selectedZoneId;
              const colors = getStatusColor(zone.status);
              const { x, y, width, height } = zone.svgCoords;

              return (
                <g
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  className="cursor-pointer transition-transform duration-150"
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`${zone.name}, ${zone.statusLabel}, Progress ${zone.progress}%`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedZoneId(zone.id);
                    }
                  }}
                >
                  {/* Zone Boundary Box */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx="8"
                    fill={colors.fill}
                    stroke={isSelected ? colors.stroke : isDark ? '#3A5146' : '#D9E2DA'}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    strokeDasharray={zone.status === 'pending-review' ? '4,4' : undefined}
                    className="transition-colors hover:brightness-95"
                  />

                  {/* Header Title Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height="32"
                    rx="8"
                    fill={isSelected ? colors.stroke : isDark ? '#1F3128' : '#E2EBE1'}
                    opacity={isSelected ? 0.9 : 0.6}
                  />

                  {/* Zone Code Label */}
                  <text
                    x={x + 12}
                    y={y + 20}
                    fill={isSelected ? '#FFFFFF' : isDark ? '#F2F4E9' : '#182920'}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {zone.code}
                  </text>

                  {/* Progress Pill inside header */}
                  <text
                    x={x + width - 12}
                    y={y + 20}
                    fill={isSelected ? '#FFFFFF' : isDark ? '#B5C1B5' : '#52665D'}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    {zone.progress}%
                  </text>

                  {/* Zone Name text */}
                  <text
                    x={x + 12}
                    y={y + 55}
                    fill={isDark ? '#F2F4E9' : '#182920'}
                    fontSize="12"
                    fontWeight="600"
                  >
                    {zone.name.split('—')[0].trim()}
                  </text>
                  <text
                    x={x + 12}
                    y={y + 72}
                    fill={isDark ? '#B5C1B5' : '#52665D'}
                    fontSize="10"
                  >
                    {zone.name.split('—')[1] ? zone.name.split('—')[1].trim() : ''}
                  </text>

                  {/* Progress Bar inside box */}
                  <rect
                    x={x + 12}
                    y={y + 88}
                    width={width - 24}
                    height="6"
                    rx="3"
                    fill={isDark ? '#203129' : '#D9E2DA'}
                  />
                  <rect
                    x={x + 12}
                    y={y + 88}
                    width={(width - 24) * (zone.progress / 100)}
                    height="6"
                    rx="3"
                    fill={colors.stroke}
                  />

                  {/* Status Indicator text */}
                  <text
                    x={x + 12}
                    y={y + 115}
                    fill={colors.stroke}
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    {zone.statusLabel}
                  </text>

                  {/* WBS Tag */}
                  <text
                    x={x + width - 12}
                    y={y + 115}
                    fill={isDark ? '#859688' : '#738A80'}
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {zone.wbs}
                  </text>

                  {/* Blocker Callout Tag if present */}
                  {zone.blocker && (
                    <g transform={`translate(${x + 12}, ${y + 128})`}>
                      <rect
                        width={width - 24}
                        height="18"
                        rx="3"
                        fill={isDark ? '#3B2422' : '#F6E4E1'}
                      />
                      <text
                        x="6"
                        y="12"
                        fill={isDark ? '#FF9E94' : '#A43B36'}
                        fontSize="9"
                        fontWeight="600"
                      >
                        ⚠ ACTIVE BLOCKER: {zone.blocker.slice(0, 38)}...
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] mt-1.5 px-2">
            Click any workfront block to inspect active activities, blockers, and linked evidence proofs.
          </p>
        </div>

        {/* Selected Workfront Details Card (5 cols on lg) */}
        <div className="lg:col-span-5 bg-[#F5F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#08786A] dark:text-[#72C6AD]">
                {selectedZone.code}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                selectedZone.status === 'critical-blocker'
                  ? 'bg-[#F6E4E1] text-[#A43B36] dark:bg-[#3B2422] dark:text-[#FF9E94]'
                  : selectedZone.status === 'behind-plan'
                  ? 'bg-[#F8EFDA] text-[#825700] dark:bg-[#3A3120] dark:text-[#F3D27E]'
                  : 'bg-[#E4F1E9] text-[#1F6B4E] dark:bg-[#20382C] dark:text-[#9AD5AF]'
              }`}>
                {selectedZone.statusLabel}
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#182920] dark:text-[#F2F4E9]">
              {selectedZone.name}
            </h3>
            <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] font-mono">
              {selectedZone.chainage}
            </p>
          </div>

          {/* Progress Overview Bar */}
          <div className="space-y-1.5 pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#52665D] dark:text-[#B5C1B5]">Verified Physical Progress:</span>
              <span className="font-mono font-bold text-[#182920] dark:text-[#F2F4E9]">
                {selectedZone.progress}% <span className="text-[#52665D] font-normal">/ {selectedZone.plannedProgress}% Plan</span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#D9E2DA] dark:bg-[#203129] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${selectedZone.progress}%`,
                  backgroundColor:
                    selectedZone.status === 'critical-blocker'
                      ? '#C7522A'
                      : selectedZone.status === 'behind-plan'
                      ? '#C8963E'
                      : '#08786A',
                }}
              />
            </div>
          </div>

          {/* Blocker Callout if any */}
          {selectedZone.blocker && (
            <div className="p-3 rounded-lg bg-[#F6E4E1] dark:bg-[#3B2422] border border-[#DCABA7] dark:border-[#5B3734] text-xs text-[#A43B36] dark:text-[#FF9E94] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Active Field Blocker</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {selectedZone.blocker}
              </p>
            </div>
          )}

          {/* Linked CPM Schedule Activities */}
          <div className="space-y-2 pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146]">
            <span className="text-xs font-semibold text-[#182920] dark:text-[#F2F4E9] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#08786A] dark:text-[#72C6AD]" />
              Linked Schedule Activities ({selectedZone.activities.length}):
            </span>
            <div className="space-y-1.5">
              {selectedZone.activities.map((act) => (
                <button
                  key={act.id}
                  onClick={() => openActivityDrawer(act.id)}
                  className="w-full p-2 rounded bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] hover:border-[#08786A] dark:hover:border-[#72C6AD] text-left transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                  title="Click to open Activity Detail Drawer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#08786A] dark:text-[#72C6AD] group-hover:underline">
                        {act.id}
                      </span>
                      <span className="text-[10px] text-[#52665D] dark:text-[#B5C1B5] font-mono">
                        {act.progress}%
                      </span>
                    </div>
                    <p className="text-xs text-[#182920] dark:text-[#F2F4E9] truncate font-medium mt-0.5">
                      {act.name}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#52665D] group-hover:text-[#08786A] shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Linked Evidence Tickets */}
          <div className="pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-between text-xs">
            <span className="text-[#52665D] dark:text-[#B5C1B5] flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#08786A] dark:text-[#72C6AD]" />
              Attached Proofs:
            </span>
            <div className="flex items-center gap-1.5">
              {selectedZone.evidenceIds.map((eid) => (
                <Link
                  key={eid}
                  href={`/evidence?id=${eid}`}
                  className="px-1.5 py-0.5 rounded bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] hover:border-[#08786A] dark:hover:border-[#72C6AD] font-mono text-[10px] text-[#08786A] dark:text-[#72C6AD] transition-colors"
                  title="View evidence in Evidence Vault"
                >
                  {eid}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
