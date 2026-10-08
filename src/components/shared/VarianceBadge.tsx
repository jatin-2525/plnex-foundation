'use client';

import React from 'react';
import { getVarianceSeverity, getVarianceSeverityConfig } from '../../tokens/status';

export interface VarianceBadgeProps {
  daysDelay: number;
  suffix?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function VarianceBadge({
  daysDelay,
  suffix = 'days',
  size = 'md',
  className = '',
}: VarianceBadgeProps) {
  const severity = getVarianceSeverity(daysDelay);
  const config = getVarianceSeverityConfig(severity);

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs';

  let formattedValue = '';
  if (daysDelay > 0) {
    formattedValue = `+${daysDelay} ${suffix}`;
  } else if (daysDelay < 0) {
    formattedValue = `${daysDelay} ${suffix}`;
  } else {
    formattedValue = `0 ${suffix}`;
  }

  return (
    <span
      className={`inline-flex items-center gap-2 font-medium rounded-md border font-mono tracking-tight ${sizeClasses} ${className}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        borderColor: config.borderColor,
      }}
      title={`Schedule Variance: ${daysDelay > 0 ? `+${daysDelay}` : daysDelay} ${suffix} (${config.label})`}
    >
      <span className="font-semibold">{formattedValue}</span>
      <span className="font-sans font-normal opacity-90 border-l pl-1.5 ml-0.5 border-current">
        {daysDelay > 0 ? 'Slip' : daysDelay < 0 ? 'Ahead' : 'On Schedule'}
      </span>
    </span>
  );
}
