import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showWordmark = true, className = '' }: LogoProps) {
  const iconSizes = {
    sm: { w: 24, h: 24, text: 'text-sm' },
    md: { w: 30, h: 30, text: 'text-base' },
    lg: { w: 38, h: 38, text: 'text-xl' },
  };

  const current = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Connected-Path Flow Mark: Visualizing the Planning-to-Execution Bridge */}
      <svg
        width={current.w}
        height={current.h}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-hidden="true"
      >
        <defs>
          {/* Gradient flow from Planned (#5273C6) through Brand Nexus (#0F6B68) to Verified Field (#176B53) */}
          <linearGradient id="plnexFlowGradient" x1="6" y1="24" x2="26" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5273C6" />
            <stop offset="50%" stopColor="#0F6B68" />
            <stop offset="100%" stopColor="#176B53" />
          </linearGradient>
          <filter id="markShadow" x="0" y="0" width="32" height="32" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#1A2E42" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Squircle container with soft tinted surface and crisp border */}
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="7"
          fill="#FFFFFF"
          stroke="#D6E1E9"
          strokeWidth="1.2"
          filter="url(#markShadow)"
        />

        {/* Subtle grid reference lines representing Primavera/WBS schedule grid */}
        <line x1="6" y1="16" x2="26" y2="16" stroke="#EAF1F5" strokeWidth="1" strokeDasharray="2,2" />
        <line x1="16" y1="6" x2="16" y2="26" stroke="#EAF1F5" strokeWidth="1" strokeDasharray="2,2" />

        {/* Forecast Trajectory Branch (Dashed Violet #7055A4 extending from Nexus) */}
        <path
          d="M 16 16 C 19 16, 22 18, 25 21"
          stroke="#7055A4"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="2.5,2"
        />
        <circle cx="25" cy="21" r="1.8" fill="#7055A4" />

        {/* Main Connected-Path: Planning (Bottom-Left) -> Nexus Bridge -> Verified Field (Top-Right) */}
        <path
          d="M 7 23 C 7 17, 12 16, 16 16 C 20 16, 21 10, 25 9"
          stroke="url(#plnexFlowGradient)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 1. Planning Stage Node (Schedule Baseline) */}
        <circle cx="7" cy="23" r="3.2" fill="#FFFFFF" stroke="#5273C6" strokeWidth="1.8" />
        <circle cx="7" cy="23" r="1.4" fill="#5273C6" />

        {/* 2. Nexus Synchronization Node (Twin Alignment Engine) */}
        <circle cx="16" cy="16" r="2.8" fill="#0F6B68" />
        <circle cx="16" cy="16" r="1.1" fill="#FFFFFF" />

        {/* 3. Verified Field Execution Target Node (Signed Milestone) */}
        <circle cx="25" cy="9" r="3.4" fill="#176B53" />
        <path
          d="M 23.6 9 L 24.6 10 L 26.6 7.8"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold tracking-tight text-[#1A2E42] font-sans ${current.text}`}>
            PL<span className="text-[#0F6B68]">n</span>EX
          </span>
          <span className="text-[9px] font-semibold text-[#52687B] tracking-wider uppercase font-sans mt-0.5">
            Project Controls
          </span>
        </div>
      )}
    </div>
  );
}
