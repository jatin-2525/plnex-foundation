'use client';

import React from 'react';
import { colors } from '../../tokens/colors';
import { ActivityStatus } from '../../tokens/status';
import { useTheme } from '../../context/ThemeContext';

export interface ProgressBarProps {
  actual: number; // 0 - 100
  planned?: number; // 0 - 100
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  status?: ActivityStatus | 'on-track' | 'at-risk' | 'delayed' | 'completed' | 'pending' | 'not-started' | 'in-progress' | 'blocked' | 'forecast-late' | 'completed-late' | string;
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
  const { resolvedTheme } = useTheme();
  const themeColors = resolvedTheme === 'dark' ? colors.dark : colors.light;

  const clampedActual = Math.min(100, Math.max(0, actual));
  const clampedPlanned = planned !== undefined ? Math.min(100, Math.max(0, planned)) : undefined;

  let barColor: string = themeColors.accent.primary;
  if (status === 'completed' || status === 'completed-late' || clampedActual >= 100) {
    barColor = themeColors.status.success;
  } else if (status === 'delayed' || (clampedPlanned !== undefined && clampedActual < clampedPlanned - 10)) {
    barColor = themeColors.status.critical;
  } else if (status === 'blocked' || status === 'at-risk' || status === 'forecast-late' || (clampedPlanned !== undefined && clampedActual < clampedPlanned)) {
    barColor = themeColors.status.warning;
  } else if (status === 'on-track') {
    barColor = themeColors.status.success;
  } else if (status === 'in-progress') {
    barColor = themeColors.accent.primary;
  } else if (status === 'pending' || status === 'not-started') {
    barColor = resolvedTheme === 'dark' ? '#859688' : '#738A80';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  }[size];

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs text-[#52665D] dark:text-[#B5C1B5] mb-1 font-mono">
          <span className="font-sans font-medium text-[#1A2B25] dark:text-[#F2F4E9]">
            Actual: <strong className="font-mono text-[#1A2B25] dark:text-[#F2F4E9]">{clampedActual}%</strong>
          </span>
          {clampedPlanned !== undefined && (
            <span>
              Planned: <strong className="font-mono">{clampedPlanned}%</strong>
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-[#D9E2DA] dark:bg-[#243832] rounded-full overflow-hidden relative ${heightClasses}`}
        role="progressbar"
        aria-valuenow={clampedActual}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Planned target marker */}
        {clampedPlanned !== undefined && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#103F39] dark:bg-[#E5C185] z-10 opacity-70"
            style={{ left: `${clampedPlanned}%` }}
            title={`Planned Target: ${clampedPlanned}%`}
          />
        )}
        {/* Actual progress fill */}
        <div
          className="h-full rounded-full"
          style={{
            width: `${clampedActual}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
}
