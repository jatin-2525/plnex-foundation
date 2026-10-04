'use client';

import React from 'react';
import {
  FileEdit,
  Loader2,
  Clock,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Copy,
  History,
  XCircle,
  CloudOff,
  CheckCheck,
} from 'lucide-react';
import { CanonicalDataState, CANONICAL_STATE_CONFIGS } from '../../lib/domain/canonicalModels';

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
  const config = CANONICAL_STATE_CONFIGS[state] || CANONICAL_STATE_CONFIGS.DRAFT;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-2',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  }[size];

  const renderIcon = () => {
    if (!showIcon) return null;
    switch (state) {
      case 'DRAFT':
        return <FileEdit className={iconSizes} />;
      case 'PROCESSING':
        return <Loader2 className={`${iconSizes} animate-spin`} />;
      case 'PENDING_REVIEW':
        return <Clock className={iconSizes} />;
      case 'VERIFIED':
        return <CheckCircle2 className={iconSizes} />;
      case 'UNMATCHED':
        return <HelpCircle className={iconSizes} />;
      case 'CONFLICT':
        return <AlertTriangle className={iconSizes} />;
      case 'DUPLICATE':
        return <Copy className={iconSizes} />;
      case 'STALE':
        return <History className={iconSizes} />;
      case 'FAILED':
        return <XCircle className={iconSizes} />;
      case 'SYNC_PENDING':
        return <CloudOff className={iconSizes} />;
      case 'SERVER_CONFIRMED':
        return <CheckCheck className={iconSizes} />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full transition-colors ${config.badgeClass} ${sizeClasses} ${className}`}
      title={showTooltip ? `${config.label}: ${config.description}` : undefined}
      role="status"
    >
      {renderIcon()}
      <span className="truncate">{customLabel || config.label}</span>
    </span>
  );
}
