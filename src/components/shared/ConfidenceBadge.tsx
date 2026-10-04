'use client';

import React from 'react';
import { getConfidenceLevel, getMatchConfidenceConfig } from '../../tokens/status';

export interface ConfidenceBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ConfidenceBadge({
  score,
  showLabel = true,
  size = 'md',
  className = '',
}: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(score);
  const config = getMatchConfidenceConfig(level);

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border font-mono tracking-tight ${sizeClasses} ${className}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        borderColor: config.borderColor,
      }}
      title={`AI Match Confidence: ${score}% (${config.label})`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.color }}
        aria-hidden="true"
      />
      <span className="font-semibold">{score}%</span>
      {showLabel && (
        <span className="font-sans font-normal opacity-90 border-l pl-1.5 ml-0.5 border-current">
          {level === 'high' ? 'Auto-link' : level === 'medium' ? 'Review' : 'Unmatched'}
        </span>
      )}
    </span>
  );
}
