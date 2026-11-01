import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showWordmark = true, className = '' }: LogoProps) {
  const iconSizes = {
    sm: { w: 22, h: 22, box: 'w-5.5 h-5.5' },
    md: { w: 28, h: 28, box: 'w-7 h-7' },
    lg: { w: 36, h: 36, box: 'w-9 h-9' },
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };

  const current = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Geometric mark: Schedule Plan curve meeting Field Execution baseline at synchronization nexus */}
      <svg
        width={current.w}
        height={current.h}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-hidden="true"
      >
        {/* Rounded square container with subtle surface tone */}
        <rect width="28" height="28" rx="6" fill="#0F6B68" />
        
        {/* Soft grid background dots */}
        <circle cx="6" cy="6" r="1" fill="#FFFFFF" fillOpacity="0.25" />
        <circle cx="22" cy="6" r="1" fill="#FFFFFF" fillOpacity="0.25" />
        <circle cx="6" cy="22" r="1" fill="#FFFFFF" fillOpacity="0.25" />

        {/* Field execution horizontal baseline */}
        <line x1="5" y1="21" x2="23" y2="21" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />

        {/* Schedule plan trajectory curve (S-Curve rising from baseline) */}
        <path
          d="M6 21 C 10 21, 12 15, 15 11 C 18 7, 20 7, 22 7"
          stroke="#5FD0DF"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Plan vs Field synchronization nexus node */}
        <circle cx="15" cy="11" r="2.5" fill="#FFFFFF" />
        <circle cx="15" cy="11" r="1.2" fill="#0F6B68" />
      </svg>

      {showWordmark && (
        <span className={`font-bold tracking-tight text-[#142C3F] leading-none ${textSizes[size]}`}>
          PL<span className="text-[#0F6B68]">n</span>EX
        </span>
      )}
    </div>
  );
}
