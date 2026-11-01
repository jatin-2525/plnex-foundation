'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  AlertTriangle,
  AlertCircle,
  CheckCheck,
  XCircle,
  Copy,
  History,
  Loader2,
  WifiOff,
  CloudOff,
} from 'lucide-react';
import { ActivityStatus, EventStatus } from '../../tokens/status';
import { CanonicalDataState } from '../../lib/domain/canonicalModels';

/**
 * The 8 Authoritative, Standardized Status States across PLnEX
 * No other status states may be created or rendered in status badges.
 */
export type RequiredStatus =
  | 'On Track'
  | 'At Risk'
  | 'Delayed'
  | 'Completed'
  | 'Blocked'
  | 'Pending Review'
  | 'Unmatched'
  | 'Verified';

/**
 * Standardized status alias (restricted to the 8 required canonical states)
 */
export type StandardizedStatus = RequiredStatus;

/**
 * Legacy statuses maintained for backward-compatibility string matching & normalization
 */
export type LegacyStatus =
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
  key: RequiredStatus;
  label: RequiredStatus;
  description: string;
  badgeClass: string;
  dotColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Explicit configuration map for the 8 canonical statuses
 */
export const REQUIRED_STATUS_CONFIGS: Record<RequiredStatus, StatusConfig> = {
  'On Track': {
    key: 'On Track',
    label: 'On Track',
    description: 'Work is progressing in accordance with approved baseline schedule logic and planned milestones.',
    badgeClass: 'bg-[#E2F2F4] text-[#176F7A] border-[#BCE1E5]',
    dotColor: '#176F7A',
    icon: CheckCircle2,
  },
  'At Risk': {
    key: 'At Risk',
    label: 'At Risk',
    description: 'Potential schedule delay, negative float encroachment, or variance threshold alert detected.',
    badgeClass: 'bg-[#FFF1D3] text-[#845006] border-[#F8DDA2]',
    dotColor: '#845006',
    icon: AlertTriangle,
  },
  Delayed: {
    key: 'Delayed',
    label: 'Delayed',
    description: 'Actual progress has breached planned schedule finish with critical path slippage.',
    badgeClass: 'bg-[#FCE8E4] text-[#A24335] border-[#F6C7BE]',
    dotColor: '#A24335',
    icon: AlertCircle,
  },
  Completed: {
    key: 'Completed',
    label: 'Completed',
    description: 'Activity or work package is 100% physically finished with actual finish recorded.',
    badgeClass: 'bg-[#E4F4EC] text-[#176B53] border-[#BDE4D0]',
    dotColor: '#176B53',
    icon: CheckCheck,
  },
  Blocked: {
    key: 'Blocked',
    label: 'Blocked',
    description: 'Execution is halted due to unmet predecessors, site conflicts, or validation failure.',
    badgeClass: 'bg-[#F8E6EA] text-[#8D3143] border-[#EEC4CE]',
    dotColor: '#8D3143',
    icon: XCircle,
  },
  'Pending Review': {
    key: 'Pending Review',
    label: 'Pending Review',
    description: 'Awaiting human verification, engineering review, or formal planner sign-off.',
    badgeClass: 'bg-[#E9EEFF] text-[#3B55A3] border-[#C5D2FC]',
    dotColor: '#3B55A3',
    icon: Clock,
  },
  Unmatched: {
    key: 'Unmatched',
    label: 'Unmatched',
    description: 'Field observation has no verified counterpart in the imported schedule baseline.',
    badgeClass: 'bg-[#F0EBF8] text-[#66528F] border-[#DACFF0]',
    dotColor: '#66528F',
    icon: HelpCircle,
  },
  Verified: {
    key: 'Verified',
    label: 'Verified',
    description: 'Confirmed against physical site evidence tickets and committed to the Schedule Twin.',
    badgeClass: 'bg-[#E4F4EC] text-[#176B53] border-[#BDE4D0]',
    dotColor: '#176B53',
    icon: CheckCircle2,
  },
};

/**
 * Backwards compatibility export: maps both the 8 canonical statuses and legacy keys
 */
export const STANDARDIZED_STATUS_CONFIGS: Record<string, StatusConfig> = {
  ...REQUIRED_STATUS_CONFIGS,
  // Backward compatibility aliases
  Conflict: REQUIRED_STATUS_CONFIGS.Blocked,
  Duplicate: REQUIRED_STATUS_CONFIGS.Blocked,
  Stale: REQUIRED_STATUS_CONFIGS['At Risk'],
  Processing: {
    ...REQUIRED_STATUS_CONFIGS['On Track'],
    description: 'Entity is undergoing field extraction and schedule analysis.',
  },
  Failed: REQUIRED_STATUS_CONFIGS.Blocked,
  Offline: REQUIRED_STATUS_CONFIGS.Blocked,
  Queued: REQUIRED_STATUS_CONFIGS['Pending Review'],
  'Server Confirmed': REQUIRED_STATUS_CONFIGS.Verified,
};

/**
 * Normalizes any raw status string into strictly one of the 8 required states:
 * On Track, At Risk, Delayed, Completed, Blocked, Pending Review, Unmatched, Verified.
 */
export function normalizeStatus(raw: string | undefined | null): RequiredStatus {
  if (!raw) return 'Pending Review';

  const cleaned = raw.trim().toUpperCase().replace(/[-\s]/g, '_');

  switch (cleaned) {
    // 1. On Track
    case 'ON_TRACK':
    case 'IN_PROGRESS':
    case 'PROCESSING':
    case 'ACTIVE':
    case 'AHEAD':
    case 'ON_SCHEDULE':
    case 'ACCELERATED':
      return 'On Track';

    // 2. At Risk
    case 'AT_RISK':
    case 'WARNING':
    case 'STALE':
    case 'MINOR_DELAY':
    case 'MODERATE_DELAY':
    case 'CAUTION':
      return 'At Risk';

    // 3. Delayed
    case 'DELAYED':
    case 'CRITICAL':
    case 'CRITICAL_DELAY':
    case 'CRITICAL_SLIP':
    case 'BEHIND':
    case 'LATE':
      return 'Delayed';

    // 4. Completed
    case 'COMPLETED':
    case 'DONE':
    case 'RESOLVED':
    case 'FINISHED':
    case 'CLOSED':
      return 'Completed';

    // 5. Blocked
    case 'BLOCKED':
    case 'CONFLICT':
    case 'DUPLICATE':
    case 'FAILED':
    case 'OFFLINE':
    case 'REJECTED':
    case 'ERROR':
    case 'HOLD':
      return 'Blocked';

    // 6. Pending Review
    case 'PENDING_REVIEW':
    case 'PENDING':
    case 'NEEDS_REVIEW':
    case 'REVIEW_REQUIRED':
    case 'PENDING_VERIFICATION':
    case 'MANAGER_REVIEW':
    case 'QUEUED':
    case 'DRAFT':
    case 'SAVED_LOCALLY':
    case 'NOT_STARTED':
    case 'OPEN':
    case 'WAITING':
    case 'UNREVIEWED':
    case 'HIGH_CONFIDENCE':
      return 'Pending Review';

    // 7. Unmatched
    case 'UNMATCHED':
    case 'UNKNOWN':
    case 'NO_MATCH':
    case 'UNASSIGNED':
      return 'Unmatched';

    // 8. Verified
    case 'VERIFIED':
    case 'APPROVED':
    case 'AUTO_LINKED':
    case 'CONFIRMED':
    case 'COMMITTED':
    case 'SERVER_CONFIRMED':
      return 'Verified';

    default: {
      const keys = Object.keys(REQUIRED_STATUS_CONFIGS) as RequiredStatus[];
      const match = keys.find((k) => k.toUpperCase().replace(/\s/g, '_') === cleaned);
      return match || 'Pending Review';
    }
  }
}

export interface StatusBadgeProps {
  status: RequiredStatus | ActivityStatus | EventStatus | CanonicalDataState | string;
  type?: 'activity' | 'event';
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  showDot?: boolean;
  customLabel?: string;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Standardized PLnEX Status Badge
 * - Enforces the 8 canonical statuses with consistent Title Case capitalization
 * - Uses accessible semantic color pairs (WCAG AAA compliant contrast)
 * - Multi-indicator: Always pairs functional icon or glyph with text (never color alone)
 * - Restrained compact sizing: Never dwarfs row text or controls
 */
export function StatusBadge({
  status,
  size = 'sm',
  showIcon = true,
  showDot = false,
  customLabel,
  className = '',
  showTooltip = true,
}: StatusBadgeProps) {
  const normalized = normalizeStatus(status);
  const config = REQUIRED_STATUS_CONFIGS[normalized] || REQUIRED_STATUS_CONFIGS['Pending Review'];

  // Compact, restrained sizing so badges are never visually larger than surrounding content
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  }[size];

  const Icon = config.icon;
  // Strictly enforce Title Case label from the 8 canonical states
  const displayLabel = customLabel ? normalizeStatus(customLabel) : config.label;

  return (
    <span
      className={`inline-flex items-center font-medium border rounded transition-colors select-none ${config.badgeClass} ${sizeClasses} ${className}`}
      title={showTooltip ? `${config.label}: ${config.description}` : undefined}
      role="status"
    >
      {/* Functional icon or dot: ensures color is never the only indicator */}
      {showIcon ? (
        <Icon className={`${iconSizes} shrink-0`} aria-hidden="true" />
      ) : showDot ? (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: config.dotColor }}
          aria-hidden="true"
        />
      ) : (
        <Icon className={`${iconSizes} shrink-0`} aria-hidden="true" />
      )}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}
