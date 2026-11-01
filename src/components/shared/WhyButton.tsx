'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';

export interface WhyButtonProps {
  onClick: (e: React.MouseEvent) => void;
  label?: string;
  size?: 'sm' | 'xs';
  variant?: 'subtle' | 'badge' | 'link';
  className?: string;
  title?: string;
}

export function WhyButton({
  onClick,
  label = 'Why?',
  size = 'xs',
  variant = 'badge',
  className = '',
  title = 'Click to view transparent audit explanation',
}: WhyButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };

  if (variant === 'link') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={title}
        className={`inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F6B68] hover:text-[#135A72] hover:underline transition-colors cursor-pointer ${className}`}
      >
        <HelpCircle className="w-3 h-3" />
        <span>{label}</span>
      </button>
    );
  }

  if (variant === 'subtle') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={title}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#526779] hover:text-[#0F6B68] hover:bg-[#EAF0F5] border border-transparent hover:border-[#D8E2EA] transition-colors cursor-pointer ${className}`}
      >
        <HelpCircle className="w-3 h-3 text-[#0F6B68]" />
        <span>{label}</span>
      </button>
    );
  }

  // Default 'badge' variant
  const displayLabel = label.startsWith('[') ? label : `[${label}]`;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EAF0F5] hover:bg-[#E0EFF5] text-[#0F6B68] border border-[#D8E2EA] transition-colors cursor-pointer shadow-2xs ${className}`}
    >
      <HelpCircle className="w-2.5 h-2.5" />
      <span>{displayLabel}</span>
    </button>
  );
}
