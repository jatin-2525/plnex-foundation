'use client';

import React from 'react';
import { ActivityStatus, EventStatus, getActivityStatusConfig, getEventStatusConfig } from '../../tokens/status';

export interface StatusBadgeProps {
  status: ActivityStatus | EventStatus;
  type?: 'activity' | 'event';
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, type = 'activity', size = 'md', className = '' }: StatusBadgeProps) {
  const config = type === 'event' 
    ? getEventStatusConfig(status as EventStatus) 
    : getActivityStatusConfig(status as ActivityStatus);

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border transition-colors ${sizeClasses} ${className}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        borderColor: config.borderColor,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.color }}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </span>
  );
}
