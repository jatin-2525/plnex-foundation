export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'SYNCING';

export type SyncItemType =
  | 'Field Update'
  | 'DPR'
  | 'Photo'
  | 'Evidence'
  | 'Execution Event';

// 7 Clear Status States
export type ClearSyncStatus =
  | 'Saved Locally'
  | 'Queued'
  | 'Uploading'
  | 'Uploaded'
  | 'Processing'
  | 'Confirmed'
  | 'Needs Attention';

export type SyncItemStatus =
  | ClearSyncStatus
  | 'Local Draft'
  | 'Server Confirmed'
  | 'Failed'
  | 'Conflict';

// Backward compatibility states for test suites
export type CanonicalSyncState =
  | 'LOCAL_DRAFT'
  | 'QUEUED'
  | 'UPLOADING'
  | 'SERVER_CONFIRMED'
  | 'FAILED'
  | 'CONFLICT';

export interface SyncPayload {
  activityId?: string;
  activityName?: string;
  quantity?: number;
  unit?: string;
  date?: string;
  area?: string;
  notes?: string;
  filename?: string;
  fileSize?: string;
  sha256?: string;
}

export interface ConflictData {
  localVersion: {
    timestamp: string;
    engineer: string;
    quantity: number;
    unit: string;
    progressPercent: number;
    notes: string;
  };
  serverVersion: {
    timestamp: string;
    engineer: string;
    quantity: number;
    unit: string;
    progressPercent: number;
    notes: string;
  };
  differenceSummary: string;
}

export interface SyncQueueItem {
  id: string;
  type: SyncItemType;
  title: string;
  localCreatedAt: string;
  status: SyncItemStatus;
  clearStatus?: ClearSyncStatus;
  retryCount: number;
  lastAttempt: string | null;
  error: string | null;
  payload: SyncPayload;
  conflictData?: ConflictData;
}

export function getClearStatus(status: SyncItemStatus | string): ClearSyncStatus {
  switch (status) {
    case 'Local Draft':
    case 'Saved Locally':
      return 'Saved Locally';
    case 'Queued':
      return 'Queued';
    case 'Uploading':
      return 'Uploading';
    case 'Uploaded':
      return 'Uploaded';
    case 'Processing':
      return 'Processing';
    case 'Server Confirmed':
    case 'Confirmed':
      return 'Confirmed';
    case 'Failed':
    case 'Conflict':
    case 'Needs Attention':
    default:
      return 'Needs Attention';
  }
}

export const INITIAL_SYNC_QUEUE_ITEMS: SyncQueueItem[] = [
  {
    id: 'SYNC-0918-001',
    type: 'Field Update',
    title: 'Weld Line 24-XX Field Joints (8 welds claimed)',
    localCreatedAt: '18 Sep 2026, 14:15:22',
    status: 'Conflict',
    clearStatus: 'Needs Attention',
    retryCount: 0,
    lastAttempt: '18 Sep 2026, 14:20:05',
    error: 'Version discrepancy: Server version updated by QA Inspector at 13:45 (5 welds confirmed vs local draft 8 welds)',
    payload: {
      activityId: 'PIP-24-002',
      activityName: 'Weld Line 24-XX Field Joints & NDT',
      quantity: 8,
      unit: 'welds',
      date: '2026-09-18',
      area: 'Unit A - Gas Processing',
      notes: '8 butt welds completed on joints J-01 through J-08.',
    },
    conflictData: {
      localVersion: {
        timestamp: '18 Sep 2026, 14:15',
        engineer: 'Debajit Borah (Lead Site Execution)',
        quantity: 8,
        unit: 'welds',
        progressPercent: 65,
        notes: '8 butt welds completed on joints J-01 through J-08 with initial visual root inspection.',
      },
      serverVersion: {
        timestamp: '18 Sep 2026, 13:45',
        engineer: 'S. Ramanathan (Quality Assurance)',
        quantity: 5,
        unit: 'welds',
        progressPercent: 50,
        notes: '5 welds passed visual root pass. 3 joints marked for minor root re-grinding before hot pass.',
      },
      differenceSummary: 'Discrepancy of +3 welds (+15% progress) between site contractor report and OIL QC inspection memo.',
    },
  },
  {
    id: 'SYNC-0918-002',
    type: 'Photo',
    title: 'Site Photo: IMG_20260918_Joint09_RootPass.jpg',
    localCreatedAt: '18 Sep 2026, 13:50:11',
    status: 'Failed',
    clearStatus: 'Needs Attention',
    retryCount: 3,
    lastAttempt: '18 Sep 2026, 14:10:45',
    error: 'HTTP 504 Gateway Timeout: Cellular tower link dropped during multipart chunk transmission',
    payload: {
      activityId: 'PIP-24-002',
      filename: 'IMG_20260918_Joint09_RootPass.jpg',
      fileSize: '4.2 MB',
      sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdef',
    },
  },
  {
    id: 'SYNC-0918-003',
    type: 'Execution Event',
    title: 'Spool Erection rigging sign-off on Section B (12 spools)',
    localCreatedAt: '18 Sep 2026, 14:02:18',
    status: 'Queued',
    clearStatus: 'Queued',
    retryCount: 0,
    lastAttempt: null,
    error: null,
    payload: {
      activityId: 'PIP-24-001',
      activityName: 'Erect Line 24-XX High Pressure Gas Header',
      quantity: 12,
      unit: 'spools',
      area: 'Unit A - Piperack Section B',
      notes: 'All 12 spools staged and set on spring hangers.',
    },
  },
  {
    id: 'SYNC-0918-004',
    type: 'Evidence',
    title: 'Flange Torque Inspection Memo PDF (CIV-PED-QC-20260918.pdf)',
    localCreatedAt: '18 Sep 2026, 14:25:00',
    status: 'Queued',
    clearStatus: 'Queued',
    retryCount: 0,
    lastAttempt: null,
    error: null,
    payload: {
      activityId: 'CIV-11-001',
      filename: 'CIV-PED-QC-20260918.pdf',
      fileSize: '1.4 MB',
      sha256: 'f4e3d2c1b0a99887766554433221100ffeeddccbbaa99887766554433221100a',
    },
  },
  {
    id: 'SYNC-0918-005',
    type: 'DPR',
    title: 'Daily Progress Report Draft (DPR-OIL-DUL-20260918)',
    localCreatedAt: '18 Sep 2026, 14:35:10',
    status: 'Local Draft',
    clearStatus: 'Saved Locally',
    retryCount: 0,
    lastAttempt: null,
    error: null,
    payload: {
      date: '2026-09-18',
      notes: 'Draft persisted in local device memory. Awaiting site engineer submission.',
    },
  },
  {
    id: 'SYNC-0918-006',
    type: 'Field Update',
    title: 'Compressor Skid A foundation clearance verification',
    localCreatedAt: '18 Sep 2026, 09:15:00',
    status: 'Server Confirmed',
    clearStatus: 'Confirmed',
    retryCount: 0,
    lastAttempt: '18 Sep 2026, 09:20:12',
    error: null,
    payload: {
      activityId: 'MEC-08-003',
      quantity: 1,
      unit: 'clearance inspection',
      notes: 'Pedestal top elevation and anchor bolt centerlines accepted.',
    },
  },
  {
    id: 'SYNC-0918-007',
    type: 'Photo',
    title: 'Site Photo: IMG_20260918_Pedestal_AnchorBolts.jpg',
    localCreatedAt: '18 Sep 2026, 09:30:15',
    status: 'Server Confirmed',
    clearStatus: 'Confirmed',
    retryCount: 0,
    lastAttempt: '18 Sep 2026, 09:35:40',
    error: null,
    payload: {
      activityId: 'CIV-11-001',
      filename: 'IMG_20260918_Pedestal_AnchorBolts.jpg',
      fileSize: '3.1 MB',
      sha256: '9876543210abcdef0123456789abcdef9876543210abcdef0123456789abcdef',
    },
  },
  {
    id: 'SYNC-0918-008',
    type: 'Field Update',
    title: 'Hydrotest manifold gauge calibration verification',
    localCreatedAt: '18 Sep 2026, 14:40:02',
    status: 'Uploading',
    clearStatus: 'Uploading',
    retryCount: 0,
    lastAttempt: '18 Sep 2026, 14:40:15',
    error: null,
    payload: {
      activityId: 'PIP-24-003',
      quantity: 1,
      unit: 'manifold test',
      notes: 'Digital pressure transmitter zeroed to 0.00 bar.',
    },
  },
  {
    id: 'SYNC-0918-009',
    type: 'Evidence',
    title: 'Piperack Weld NDT Clearance Packet (NDT-RAD-24-0918.pdf)',
    localCreatedAt: '18 Sep 2026, 14:41:20',
    status: 'Server Confirmed',
    clearStatus: 'Uploaded',
    retryCount: 0,
    lastAttempt: '18 Sep 2026, 14:41:50',
    error: null,
    payload: {
      activityId: 'PIP-24-002',
      filename: 'NDT-RAD-24-0918.pdf',
      fileSize: '2.8 MB',
      sha256: '887766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa99',
    },
  },
  {
    id: 'SYNC-0918-010',
    type: 'Execution Event',
    title: 'Daily Shift Manpower & Equipment Deployment Log',
    localCreatedAt: '18 Sep 2026, 14:42:00',
    status: 'Queued',
    clearStatus: 'Processing',
    retryCount: 0,
    lastAttempt: '18 Sep 2026, 14:42:10',
    error: null,
    payload: {
      activityId: 'GEN-SITE-001',
      quantity: 48,
      unit: 'manpower headcount',
      notes: 'Validating shift allocation against daily work breakdown structure.',
    },
  },
];
