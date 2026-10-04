'use client';

import React from 'react';
import { colors } from '../../tokens/colors';

export interface ProgressBarProps {
  actual: number; // 0 - 100
  planned?: number; // 0 - 100
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  status?: 'on-track' | 'at-risk' | 'delayed' | 'completed' | 'pending' | 'not-started' | 'in-progress' | 'blocked';
  className?: string;
}

export function ProgressBar({
  actual,
  planned,
  showLabels = true,
  size = 'md',
  status,
  className = '',
}: ProgressBarProps) {
  const clampedActual = Math.min(100, Math.max(0, actual));
  const clampedPlanned = planned !== undefined ? Math.min(100, Math.max(0, planned)) : undefined;

  let barColor: string = colors.accent.primary;
  if (status === 'completed' || clampedActual >= 100) {
    barColor = colors.status.success;
  } else if (status === 'delayed' || (clampedPlanned !== undefined && clampedActual < clampedPlanned - 10)) {
    barColor = colors.status.critical;
  } else if (status === 'blocked' || status === 'at-risk' || (clampedPlanned !== undefined && clampedActual < clampedPlanned)) {
    barColor = colors.status.warning;
  } else if (status === 'on-track') {
    barColor = colors.status.success;
  } else if (status === 'in-progress') {
    barColor = colors.accent.primary;
  } else if (status === 'pending' || status === 'not-started') {
    barColor = '#8A94A6';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  }[size];

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs text-[#596579] mb-1 font-mono">
          <span className="font-sans font-medium text-[#172033]">
            Actual: <strong className="font-mono text-[#172033]">{clampedActual}%</strong>
          </span>
          {clampedPlanned !== undefined && (
            <span>
              Planned: <strong className="font-mono">{clampedPlanned}%</strong>
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-[#E8EBF0] rounded-full overflow-hidden relative ${heightClasses}`}
        role="progressbar"
        aria-valuenow={clampedActual}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Planned target marker */}
        {clampedPlanned !== undefined && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#172033] z-10 opacity-70"
            style={{ left: `${clampedPlanned}%` }}
            title={`Planned Target: ${clampedPlanned}%`}
          />
        )}
        {/* Actual progress fill */}
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${clampedActual}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
}
