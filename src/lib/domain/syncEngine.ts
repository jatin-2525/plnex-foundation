export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'SYNCING';

export type SyncItemType =
  | 'Field Update'
  | 'DPR'
  | 'Photo'
  | 'Evidence'
  | 'Execution Event';

export type SyncItemStatus =
  | 'Local Draft'
  | 'Queued'
  | 'Uploading'
  | 'Server Confirmed'
  | 'Failed'
  | 'Conflict';

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
  retryCount: number;
  lastAttempt: string | null;
  error: string | null;
  payload: SyncPayload;
  conflictData?: ConflictData;
}

export const INITIAL_SYNC_QUEUE_ITEMS: SyncQueueItem[] = [
  {
    id: 'SYNC-0918-001',
    type: 'Field Update',
    title: 'Weld Line 24-XX Field Joints (8 welds claimed)',
    localCreatedAt: '18 Sep 2026, 14:15:22',
    status: 'Conflict',
    retryCount: 0,
    lastAttempt: '18 Sep 2026, 14:20:05',
    error: 'Conflict: Server version updated by QA Inspector at 13:45 (5 welds confirmed vs local draft 8 welds)',
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
    retryCount: 3,
    lastAttempt: '18 Sep 2026, 14:10:45',
    error: 'HTTP 504 Gateway Timeout: Cellular tower link dropped during multipart chunk transmission (Tower DUL-B-4)',
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
    retryCount: 0,
    lastAttempt: null,
    error: null,
    payload: {
      date: '2026-09-18',
      notes: 'Draft active in local IndexedDB storage. Awaiting site engineer signature.',
    },
  },
  {
    id: 'SYNC-0918-006',
    type: 'Field Update',
    title: 'Compressor Skid A foundation clearance verification',
    localCreatedAt: '18 Sep 2026, 09:15:00',
    status: 'Server Confirmed',
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
];
