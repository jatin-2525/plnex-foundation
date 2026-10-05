'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  AlertTriangle,
  Copy,
  History,
  Loader2,
  XCircle,
  WifiOff,
  CloudOff,
  CheckCheck,
} from 'lucide-react';
import { ActivityStatus, EventStatus } from '../../tokens/status';
import { CanonicalDataState } from '../../lib/domain/canonicalModels';

export type StandardizedStatus =
  | 'Verified'
  | 'Pending Review'
  | 'Unmatched'
  | 'Conflict'
  | 'Duplicate'
  | 'Stale'
  | 'Processing'
  | 'Failed'
  | 'Offline'
  | 'Queued'
  | 'Server Confirmed';

export interface StatusConfig {
  key: StandardizedStatus;
  label: StandardizedStatus;
  description: string;
  badgeClass: string;
  dotColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const STANDARDIZED_STATUS_CONFIGS: Record<StandardizedStatus, StatusConfig> = {
  Verified: {
    key: 'Verified',
    label: 'Verified',
    description: 'Confirmed against physical site evidence and approved by engineer/planner.',
    badgeClass: 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]',
    dotColor: '#2E7D5B',
    icon: CheckCircle2,
  },
  'Pending Review': {
    key: 'Pending Review',
    label: 'Pending Review',
    description: 'Awaiting human verification by planner or site engineer.',
    badgeClass: 'bg-[#FDF6ED] text-[#D98B32] border-[#F0D4A6]',
    dotColor: '#D98B32',
    icon: Clock,
  },
  Unmatched: {
    key: 'Unmatched',
    label: 'Unmatched',
    description: 'Field observation has no direct counterpart in master schedule baseline.',
    badgeClass: 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5]',
    dotColor: '#596579',
    icon: HelpCircle,
  },
  Conflict: {
    key: 'Conflict',
    label: 'Conflict',
    description: 'Discrepancy detected between site update and master schedule logic.',
    badgeClass: 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]',
    dotColor: '#B5473C',
    icon: AlertTriangle,
  },
  Duplicate: {
    key: 'Duplicate',
    label: 'Duplicate',
    description: 'Identical record already received in current reporting cycle.',
    badgeClass: 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5]',
    dotColor: '#596579',
    icon: Copy,
  },
  Stale: {
    key: 'Stale',
    label: 'Stale',
    description: 'Record timestamp exceeds the daily reporting cutoff window.',
    badgeClass: 'bg-[#F1F3F5] text-[#7B8798] border-[#D9DEE5]',
    dotColor: '#7B8798',
    icon: History,
  },
  Processing: {
    key: 'Processing',
    label: 'Processing',
    description: 'Entity is undergoing NLP parameter extraction or CPM analysis.',
    badgeClass: 'bg-[#EDF5F8] text-[#176B87] border-[#B3CBE0]',
    dotColor: '#176B87',
    icon: Loader2,
  },
  Failed: {
    key: 'Failed',
    label: 'Failed',
    description: 'Processing or transmission failed and requires correction or retry.',
    badgeClass: 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]',
    dotColor: '#B5473C',
    icon: XCircle,
  },
  Offline: {
    key: 'Offline',
    label: 'Offline',
    description: 'Operating in local offline cache mode; awaiting network connection.',
    badgeClass: 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5]',
    dotColor: '#596579',
    icon: WifiOff,
  },
  Queued: {
    key: 'Queued',
    label: 'Queued',
    description: 'Buffered in local device storage; queued for transmission to central server.',
    badgeClass: 'bg-[#EDF5F8] text-[#3B6EA8] border-[#B3CBE0]',
    dotColor: '#3B6EA8',
    icon: CloudOff,
  },
  'Server Confirmed': {
    key: 'Server Confirmed',
    label: 'Server Confirmed',
    description: 'Successfully acknowledged and persisted in central database.',
    badgeClass: 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]',
    dotColor: '#2E7D5B',
    icon: CheckCheck,
  },
};

/**
 * Normalizes any raw status string into one of the 11 standardized statuses
 */
export function normalizeStatus(raw: string | undefined | null): StandardizedStatus {
  if (!raw) return 'Queued';

  const cleaned = raw.trim().toUpperCase().replace(/[-\s]/g, '_');

  // Exact mappings
  switch (cleaned) {
    case 'VERIFIED':
    case 'COMPLETED':
    case 'APPROVED':
    case 'RESOLVED':
    case 'DONE':
      return 'Verified';

    case 'PENDING_REVIEW':
    case 'PENDING':
    case 'NEEDS_REVIEW':
    case 'IN_REVIEW':
    case 'OPEN':
    case 'AT_RISK':
    case 'WAITING':
      return 'Pending Review';

    case 'UNMATCHED':
    case 'UNKNOWN':
    case 'NO_MATCH':
      return 'Unmatched';

    case 'CONFLICT':
    case 'DISCREPANCY':
    case 'DELAYED':
    case 'CRITICAL':
      return 'Conflict';

    case 'DUPLICATE':
    case 'REDUNDANT':
      return 'Duplicate';

    case 'STALE':
    case 'EXPIRED':
    case 'OUTDATED':
      return 'Stale';

    case 'PROCESSING':
    case 'IN_PROGRESS':
    case 'EXTRACTING':
    case 'MATCHING':
    case 'ON_TRACK':
      return 'Processing';

    case 'FAILED':
    case 'ERROR':
    case 'REJECTED':
      return 'Failed';

    case 'OFFLINE':
    case 'DISCONNECTED':
      return 'Offline';

    case 'QUEUED':
    case 'SYNC_PENDING':
    case 'DRAFT':
    case 'NOT_STARTED':
    case 'PENDING_SYNC':
      return 'Queued';

    case 'SERVER_CONFIRMED':
    case 'SYNCED':
    case 'CONFIRMED':
    case 'COMMITTED':
      return 'Server Confirmed';

    default:
      if (raw in STANDARDIZED_STATUS_CONFIGS) {
        return raw as StandardizedStatus;
      }
      return 'Queued';
  }
}

export interface StatusBadgeProps {
  status: StandardizedStatus | ActivityStatus | EventStatus | CanonicalDataState | string;
  type?: 'activity' | 'event';
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  showDot?: boolean;
  customLabel?: string;
  className?: string;
  showTooltip?: boolean;
}

export function StatusBadge({
  status,
  size = 'sm',
  showIcon = false,
  showDot = true,
  customLabel,
  className = '',
  showTooltip = true,
}: StatusBadgeProps) {
  const normalized = normalizeStatus(status);
  const config = STANDARDIZED_STATUS_CONFIGS[normalized] || STANDARDIZED_STATUS_CONFIGS.Queued;

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

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-md transition-colors select-none ${config.badgeClass} ${sizeClasses} ${className}`}
      title={showTooltip ? `${config.label}: ${config.description}` : undefined}
      role="status"
    >
      {showIcon ? (
        <Icon className={`${iconSizes} flex-shrink-0`} />
      ) : showDot ? (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.dotColor }}
          aria-hidden="true"
        />
      ) : null}
      <span className="truncate">{customLabel || config.label}</span>
    </span>
  );
}
