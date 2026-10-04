'use client';

import React from 'react';
import { HelpCircle, ChevronRight, Sparkles } from 'lucide-react';

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
  title = 'Click to open transparent explanation panel',
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
        className={`inline-flex items-center gap-1 text-[11px] font-semibold text-[#176B87] hover:text-[#135A72] hover:underline transition-colors cursor-pointer ${className}`}
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
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-[#596579] hover:text-[#176B87] hover:bg-[#EDF5F8] border border-transparent hover:border-[#B3CBE0] transition-all cursor-pointer ${className}`}
      >
        <HelpCircle className="w-3 h-3 text-[#176B87]" />
        <span>{label}</span>
      </button>
    );
  }

  // Default 'badge' variant
  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EDF5F8] hover:bg-[#DCEBF1] text-[#176B87] border border-[#B3CBE0] transition-colors cursor-pointer shadow-2xs ${className}`}
    >
      <Sparkles className="w-2.5 h-2.5" />
      <span>{label}</span>
    </button>
  );
}
