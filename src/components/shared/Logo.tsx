import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

/**
 * Clean, ownable PLnEX structural vector mark:
 * An ascending structural line with three connected nodes visualizing the
 * Planning (Baseline) → Nexus Engine → Verified Field Execution path.
 * Designed to work in monochrome / single-color and in both light and dark themes.
 */
export function Logo({ size = 'md', showWordmark = true, className = '' }: LogoProps) {
  const iconSizes = {
    sm: { w: 22, h: 22, text: 'text-sm' },
    md: { w: 28, h: 28, text: 'text-base' },
    lg: { w: 34, h: 34, text: 'text-xl' },
  };

  const current = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Structural Path Vector Mark (Works in 1 color, light & dark) */}
      <svg
        width={current.w}
        height={current.h}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 text-[#006B61] dark:text-[#72C6AD]"
        aria-hidden="true"
      >
        {/* Structural Boundary / Enclosure (Clean geometric squircle) */}
        <rect
          x="1"
          y="1"
          width="26"
          height="26"
          rx="6"
          className="fill-[#F6F7F3] dark:fill-[#17221D] stroke-[#D9E2DA] dark:stroke-[#3A5146]"
          strokeWidth="1.2"
        />

        {/* Structural connecting line (CPM trajectory vector) */}
        <path
          d="M 6.5 20.5 L 14 14 L 21.5 7.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Node 1: Baseline Plan (Left) */}
        <circle
          cx="6.5"
          cy="20.5"
          r="2.5"
          className="fill-white dark:fill-[#101815]"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        {/* Node 2: Nexus / Bridge Engine (Center) */}
        <circle
          cx="14"
          cy="14"
          r="2.5"
          className="fill-white dark:fill-[#101815]"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="14"
          cy="14"
          r="1"
          fill="currentColor"
        />

        {/* Node 3: Verified Field Delivery (Right) */}
        <circle
          cx="21.5"
          cy="7.5"
          r="2.8"
          fill="currentColor"
        />
      </svg>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold font-heading tracking-tight text-[#1A2B25] dark:text-[#F2F4E9] ${current.text}`}>
            PL<span className="text-[#006B61] dark:text-[#72C6AD]">n</span>EX
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-[#52665D] dark:text-[#B5C1B5] font-mono mt-0.5">
            Controls
          </span>
        </div>
      )}
    </div>
  );
}
