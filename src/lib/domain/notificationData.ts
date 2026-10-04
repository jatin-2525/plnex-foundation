/**
 * PLnEX Notification Center Data Model & Realistic Project Feed
 * 
 * Strict construction project controls events. Zero decorative/fake items.
 * Required Notification Types:
 *   1. New review required
 *   2. Activity delayed
 *   3. Dependency impacted
 *   4. Match conflict
 *   5. DPR confirmation required
 *   6. Evidence uploaded
 *   7. Processing failed
 *   8. Sync conflict
 */

import { ActivityDrawerTab } from './activityDetailData';

export type NotificationType =
  | 'New review required'
  | 'Activity delayed'
  | 'Dependency impacted'
  | 'Match conflict'
  | 'DPR confirmation required'
  | 'Evidence uploaded'
  | 'Processing failed'
  | 'Sync conflict';

export type NotificationSeverity = 'critical' | 'warning' | 'medium' | 'info';

export interface NotificationDestination {
  /** Target Next.js application route */
  route: string;
  /** Optional drawer action if notification can trigger a slide-over directly */
  drawerType?: 'activity' | 'dependency' | 'evidence' | 'review';
  /** Target entity ID (e.g., 'PIP-24-001', 'EVT-2026-002', 'RSK-001') */
  targetId?: string;
  /** Initial tab to activate in target drawer */
  tab?: ActivityDrawerTab | string;
  /** Human-readable action label (e.g. 'Open in Review Queue', 'Inspect in Activity Drawer') */
  actionLabel: string;
}

export interface PLnEXNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string; // ISO 8601 string
  relativeTime: string; // e.g. '18m ago'
  severity: NotificationSeverity;
  isRead: boolean;
  destination: NotificationDestination;
  sourceEntity?: {
    category: 'Activity' | 'Event' | 'Risk' | 'DPR' | 'Evidence' | 'SyncItem' | 'Document';
    id: string;
    label?: string;
  };
  metadata?: Record<string, string | number | boolean>;
}

/**
 * 8 Core Production Notifications grounded in actual construction project records
 */
export const INITIAL_NOTIFICATIONS: PLnEXNotification[] = [
  // 1. New review required
  {
    id: 'NTF-REV-001',
    type: 'New review required',
    title: 'New Match Review Required: EVT-2026-002',
    description:
      'Field welding report for Line 24 (8 joints) scored 86% confidence against PIP-24-002. Requires planner verification before Schedule Twin commit.',
    timestamp: '2026-09-16T18:22:00Z',
    relativeTime: '18m ago',
    severity: 'warning',
    isRead: false,
    destination: {
      route: '/review?eventId=EVT-2026-002',
      drawerType: 'review',
      targetId: 'EVT-2026-002',
      actionLabel: 'Open Review Queue',
    },
    sourceEntity: {
      category: 'Event',
      id: 'EVT-2026-002',
      label: 'Line 24 Joint Welding Log',
    },
    metadata: {
      confidence: 86,
      candidateActivity: 'PIP-24-002',
      discipline: 'Piping',
    },
  },

  // 2. Activity delayed
  {
    id: 'NTF-DEL-001',
    type: 'Activity delayed',
    title: 'Schedule Variance Slip: PIP-24-001 (+2 Days)',
    description:
      'Activity "Erect Line 24-XX High Pressure Gas Header" breached planned finish date (15 Sep vs 13 Sep). Actual progress 42% vs 100% planned.',
    timestamp: '2026-09-16T16:45:00Z',
    relativeTime: '2h ago',
    severity: 'critical',
    isRead: false,
    destination: {
      route: '/progress?activityId=PIP-24-001',
      drawerType: 'activity',
      targetId: 'PIP-24-001',
      tab: 'plan-vs-actual',
      actionLabel: 'Inspect in Activity Drawer',
    },
    sourceEntity: {
      category: 'Activity',
      id: 'PIP-24-001',
      label: 'Line 24 Erection',
    },
    metadata: {
      plannedFinish: '2026-09-13',
      forecastFinish: '2026-09-15',
      varianceDays: -2,
    },
  },

  // 3. Dependency impacted
  {
    id: 'NTF-DEP-001',
    type: 'Dependency impacted',
    title: 'Critical Path Impact: PIP-24-002 Successor Blocked',
    description:
      'Finish-to-Start dependency on PIP-24-001 has shifted downstream activity start by +2 days, reducing total project float to 1 day.',
    timestamp: '2026-09-16T16:50:00Z',
    relativeTime: '2h ago',
    severity: 'critical',
    isRead: false,
    destination: {
      route: '/risks?riskId=RSK-001',
      drawerType: 'dependency',
      targetId: 'RSK-001',
      actionLabel: 'View Dependency Impact',
    },
    sourceEntity: {
      category: 'Risk',
      id: 'RSK-001',
      label: 'Critical Path Header Blockage',
    },
    metadata: {
      predecessor: 'PIP-24-001',
      successor: 'PIP-24-002',
      dependencyType: 'FS_0',
    },
  },

  // 4. Match conflict
  {
    id: 'NTF-CNF-001',
    type: 'Match conflict',
    title: 'Match Conflict Detected: EVT-2026-005',
    description:
      'Monsoon squall stoppage and missing 150 bar blind flanges logged with 0 output conflicts with PIP-24-003. Predecessor joint welding RT incomplete.',
    timestamp: '2026-09-18T13:20:00Z',
    relativeTime: '4h ago',
    severity: 'warning',
    isRead: false,
    destination: {
      route: '/review?tab=Conflicts&eventId=EVT-2026-005',
      drawerType: 'review',
      targetId: 'EVT-2026-005',
      actionLabel: 'Resolve Conflict in Review',
    },
    sourceEntity: {
      category: 'Event',
      id: 'EVT-2026-005',
      label: 'Line 24 Hydrotest Preparation',
    },
    metadata: {
      predecessorActivity: 'PIP-24-002',
      conflictType: 'Unmet Predecessor Gate',
    },
  },

  // 5. DPR confirmation required
  {
    id: 'NTF-DPR-001',
    type: 'DPR confirmation required',
    title: 'DPR Sign-Off Required: Duliajan Unit A Shift Report',
    description:
      'Daily Progress Report DPR_OIL_DUL_20260914.pdf submitted by Debajit Borah requires Chief Project Controls Manager digital attestation.',
    timestamp: '2026-09-14T17:30:00Z',
    relativeTime: '1d ago',
    severity: 'medium',
    isRead: false,
    destination: {
      route: '/field/dpr?dprId=DPR-OIL-DUL-20260914',
      drawerType: 'evidence',
      targetId: 'EVD-002',
      actionLabel: 'Confirm Daily Progress Report',
    },
    sourceEntity: {
      category: 'DPR',
      id: 'DPR-2026-09-14-A',
      label: 'Duliajan Unit A Daily Log',
    },
    metadata: {
      author: 'Debajit Borah (Lead Site Engineer)',
      unitsReported: '12 spools',
    },
  },

  // 6. Evidence uploaded
  {
    id: 'NTF-EVD-001',
    type: 'Evidence uploaded',
    title: 'QA/QC Physical Proof Linked: EVD-001',
    description:
      'Compressor pedestal 28-day cube test pour certificate (CIV-PED-QC-20260914.pdf) verified and cryptographically attached to activity CIV-11-001.',
    timestamp: '2026-09-14T14:15:00Z',
    relativeTime: '1d ago',
    severity: 'info',
    isRead: true,
    destination: {
      route: '/evidence?id=EVD-001',
      drawerType: 'activity',
      targetId: 'CIV-11-001',
      tab: 'evidence',
      actionLabel: 'Open Evidence Certificate',
    },
    sourceEntity: {
      category: 'Evidence',
      id: 'EVD-001',
      label: 'Compressor Pour Certificate',
    },
    metadata: {
      fileSize: '1.4 MB',
      checksum: 'SHA256:8f3c7d...b291',
    },
  },

  // 7. Processing failed
  {
    id: 'NTF-ERR-001',
    type: 'Processing failed',
    title: 'Document OCR Pipeline Failed: ISS-EXEC-005',
    description:
      'Corrupted PDF raster header on field contractor slip DOC-SCAN-882 prevented OCR token extraction. Requires manual entry walkdown.',
    timestamp: '2026-09-17T11:00:00Z',
    relativeTime: '2d ago',
    severity: 'critical',
    isRead: false,
    destination: {
      route: '/health?issueId=ISS-EXEC-005',
      drawerType: 'evidence',
      targetId: 'ISS-EXEC-005',
      actionLabel: 'View Health Quality Issue',
    },
    sourceEntity: {
      category: 'Document',
      id: 'DOC-SCAN-882',
      label: 'Contractor Sub-contract Slip',
    },
    metadata: {
      errorCode: 'ERR_OCR_RASTER_CORRUPT',
      retryAttempts: 3,
    },
  },

  // 8. Sync conflict
  {
    id: 'NTF-SYN-001',
    type: 'Sync conflict',
    title: 'Offline Sync Conflict: SYNC-ITEM-004',
    description:
      'Local offline tablet reported 14 spools erected, but server master ledger recorded 12 spools. Merge resolution required in Sync Center.',
    timestamp: '2026-09-17T16:40:00Z',
    relativeTime: '2d ago',
    severity: 'critical',
    isRead: false,
    destination: {
      route: '/sync?conflictId=SYNC-ITEM-004',
      drawerType: 'evidence',
      targetId: 'SYNC-ITEM-004',
      actionLabel: 'Resolve in Sync Center',
    },
    sourceEntity: {
      category: 'SyncItem',
      id: 'SYNC-ITEM-004',
      label: 'Offline Tablet Queue Item 004',
    },
    metadata: {
      localValue: '14 spools',
      serverValue: '12 spools',
      lastAttempt: '2026-09-17 16:38:12',
    },
  },
];

/**
 * Helper to compute unread count
 */
export function getUnreadNotificationCount(notifications: PLnEXNotification[]): number {
  return notifications.filter((n) => !n.isRead).length;
}

/**
 * Filter notifications by severity or type
 */
export function filterNotifications(
  notifications: PLnEXNotification[],
  options: {
    typeFilter?: string;
    onlyUnread?: boolean;
    severityFilter?: string;
    searchQuery?: string;
  }
): PLnEXNotification[] {
  return notifications.filter((n) => {
    if (options.onlyUnread && n.isRead) return false;
    if (options.typeFilter && options.typeFilter !== 'ALL' && n.type !== options.typeFilter) {
      return false;
    }
    if (options.severityFilter && options.severityFilter !== 'ALL' && n.severity !== options.severityFilter) {
      return false;
    }
    if (options.searchQuery && options.searchQuery.trim() !== '') {
      const q = options.searchQuery.toLowerCase();
      const inTitle = n.title.toLowerCase().includes(q);
      const inDesc = n.description.toLowerCase().includes(q);
      const inType = n.type.toLowerCase().includes(q);
      const inId = n.id.toLowerCase().includes(q);
      if (!inTitle && !inDesc && !inType && !inId) return false;
    }
    return true;
  });
}
