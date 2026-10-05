'use client';

import React from 'react';
import { CanonicalDataState } from '../../lib/domain/canonicalModels';
import { StatusBadge } from './StatusBadge';

export interface CanonicalStateBadgeProps {
  state: CanonicalDataState;
  showIcon?: boolean;
  size?: 'xs' | 'sm' | 'md';
  customLabel?: string;
  className?: string;
  showTooltip?: boolean;
}

export function CanonicalStateBadge({
  state,
  showIcon = true,
  size = 'sm',
  customLabel,
  className = '',
  showTooltip = true,
}: CanonicalStateBadgeProps) {
  return (
    <StatusBadge
      status={state}
      showIcon={showIcon}
      size={size}
      customLabel={customLabel}
      className={className}
      showTooltip={showTooltip}
    />
  );
}
