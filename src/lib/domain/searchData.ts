/**
 * PLnEX Unified Global Search Service & Multi-Entity Index
 * 
 * Searches across:
 *   1. Projects
 *   2. Activities
 *   3. Execution Events
 *   4. Evidence
 *   5. Review Items
 *   6. Risks
 *   7. Reports
 * 
 * Each Result displays:
 *   - Type
 *   - ID
 *   - Title
 *   - Project
 *   - Status
 */

import { MOCK_ACTIVITIES, MOCK_PROJECTS, MOCK_EXECUTION_EVENTS, MOCK_EVIDENCE_ITEMS } from '../api/mockData';
import { REPORT_TEMPLATES } from './reportsAndMemory';

export type SearchResultType =
  | 'Project'
  | 'Activity'
  | 'Execution Event'
  | 'Evidence'
  | 'Review Item'
  | 'Risk'
  | 'Report';

export interface SearchResultItem {
  type: SearchResultType;
  id: string;
  title: string;
  project: string;
  status: string;
  description?: string;
  destination: {
    route: string;
    drawerType?: 'activity' | 'risk' | 'evidence' | 'review';
    targetId?: string;
    tab?: string;
  };
  tags?: string[];
}

export interface RecentSearchEntry {
  id: string;
  query: string;
  timestamp: string;
  relativeTime: string;
  resultItem?: SearchResultItem;
}

/**
 * Static Master Search Index compiling all 7 domain datasets
 */
export function buildMasterSearchIndex(): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  // 1. Projects
  MOCK_PROJECTS.forEach((p) => {
    items.push({
      type: 'Project',
      id: p.id,
      title: p.name,
      project: p.code || p.id,
      status: p.status.replace('-', ' '),
      description: `${p.organization} · Location: ${p.location} · Target finish: ${p.targetCompletionDate}`,
      destination: {
        route: `/projects/${p.id}`,
      },
      tags: ['portfolio', 'oil-india', p.location, p.code],
    });
  });

  // 2. Activities (Primavera L5/L6 Schedule)
  MOCK_ACTIVITIES.forEach((a) => {
    items.push({
      type: 'Activity',
      id: a.id,
      title: a.name,
      project: 'Duliajan Unit A (PRJ-OIL-2026-01)',
      status: a.status.replace('-', ' '),
      description: `WBS ${a.wbs} (${a.wbsLevel}) · ${a.discipline} · Planned: ${a.plannedStart} → ${a.plannedFinish}`,
      destination: {
        route: `/activities`,
        drawerType: 'activity',
        targetId: a.id,
        tab: 'overview',
      },
      tags: [a.discipline, a.wbs, a.line || '', a.area],
    });
  });

  // 3. Execution Events
  MOCK_EXECUTION_EVENTS.forEach((e) => {
    items.push({
      type: 'Execution Event',
      id: e.id,
      title: e.rawText,
      project: 'Duliajan Unit A (PRJ-OIL-2026-01)',
      status: e.status.replace('-', ' '),
      description: `Discipline: ${e.discipline} · Qty: ${e.quantity} ${e.unit} · Matched: ${e.matchedActivityId || 'Unassigned'} (${e.confidence}%)`,
      destination: {
        route: `/execution`,
        drawerType: 'activity',
        targetId: e.matchedActivityId || undefined,
        tab: 'execution',
      },
      tags: [e.discipline, e.source, e.line, e.area],
    });
  });

  // 4. Evidence Items
  MOCK_EVIDENCE_ITEMS.forEach((ev) => {
    items.push({
      type: 'Evidence',
      id: ev.id,
      title: ev.title,
      project: 'Duliajan Unit A (PRJ-OIL-2026-01)',
      status: ev.verifiedStatus ? 'Verified' : 'Pending Sign-off',
      description: `File: ${ev.filename} (${ev.fileSize}) · Linked to ${ev.activityId || 'Unlinked'} · By: ${ev.uploader}`,
      destination: {
        route: `/evidence?id=${ev.id}`,
        drawerType: 'activity',
        targetId: ev.activityId || undefined,
        tab: 'evidence',
      },
      tags: [ev.type, ev.filename, ev.uploader],
    });
  });

  // 5. Review Items (Review Queue Events)
  const reviewEvents = [
    {
      id: 'EVT-2026-001',
      title: 'Spool erection completed on Line 24 (12 spools)',
      status: 'High Confidence',
      candId: 'PIP-24-001',
      score: '94%',
    },
    {
      id: 'EVT-2026-002',
      title: 'Line 24 spool welding completed 8 joints today',
      status: 'Manager Review',
      candId: 'PIP-24-002',
      score: '86%',
    },
    {
      id: 'EVT-2026-003',
      title: 'Cable ladder tray installation overhead gallery 45m',
      status: 'Manager Review',
      candId: 'ELE-11-032',
      score: '78%',
    },
    {
      id: 'EVT-2026-004',
      title: 'Pipe installation near Unit B drain line',
      status: 'Unmatched',
      candId: 'None',
      score: '47%',
    },
    {
      id: 'EVT-2026-005',
      title: 'Hydrostatic test section Line 24-XX weather stoppage',
      status: 'Conflicts',
      candId: 'PIP-24-003',
      score: '62%',
    },
  ];

  reviewEvents.forEach((r) => {
    items.push({
      type: 'Review Item',
      id: r.id,
      title: r.title,
      project: 'Duliajan Unit A (PRJ-OIL-2026-01)',
      status: r.status,
      description: `Match Candidate: ${r.candId} (Confidence: ${r.score}) · Verification Gate`,
      destination: {
        route: `/review?eventId=${r.id}`,
        drawerType: 'review',
        targetId: r.id,
      },
      tags: ['review-queue', r.candId, r.status],
    });
  });

  // 6. Risks & Dependency Impact
  const risksList = [
    {
      id: 'RSK-001',
      title: 'Header Delivery Delay Impacts Gas Compression Critical Path',
      status: 'Critical',
      actId: 'PIP-24-001',
      impact: 'Shifts downstream commissioning by +4 days',
    },
    {
      id: 'RSK-002',
      title: 'Compressor Foundation Grouting Waiting on 28-day Lab Cure',
      status: 'High Severity',
      actId: 'CIV-11-001',
      impact: 'Hold point on mechanical bedplate skid alignment',
    },
    {
      id: 'RSK-003',
      title: 'Overhead Electrical Cable Tray Delivery Logistics Hold',
      status: 'Medium Severity',
      actId: 'ELE-11-032',
      impact: 'Precludes instrument cable pull shift handover',
    },
    {
      id: 'RSK-004',
      title: 'Monsoon Flooding Risk on Offsite Drainage Trenching',
      status: 'Warning',
      actId: 'PIP-24-003',
      impact: 'Requires mobile dewatering pumps for manifold access',
    },
  ];

  risksList.forEach((r) => {
    items.push({
      type: 'Risk',
      id: r.id,
      title: r.title,
      project: 'Duliajan Unit A (PRJ-OIL-2026-01)',
      status: r.status,
      description: `Source Activity: ${r.actId} · Impact: ${r.impact}`,
      destination: {
        route: `/risks?riskId=${r.id}`,
        drawerType: 'risk',
        targetId: r.id,
      },
      tags: ['risk', 'cpm-impact', r.actId],
    });
  });

  // 7. Reports & Project Memory Templates
  REPORT_TEMPLATES.forEach((rep) => {
    items.push({
      type: 'Report',
      id: rep.id,
      title: rep.name,
      project: 'Duliajan Unit A (PRJ-OIL-2026-01)',
      status: 'Available',
      description: `${rep.title} · ${rep.description}`,
      destination: {
        route: `/reports?reportId=${rep.id}`,
      },
      tags: ['reports', rep.category, rep.badge],
    });
  });

  return items;
}

/**
 * Seed Recent Searches list
 */
export const INITIAL_RECENT_SEARCHES: RecentSearchEntry[] = [
  {
    id: 'rec-1',
    query: 'Line 24',
    timestamp: '2026-09-18T10:15:00Z',
    relativeTime: '15m ago',
  },
  {
    id: 'rec-2',
    query: 'PIP-24-001',
    timestamp: '2026-09-18T08:30:00Z',
    relativeTime: '2h ago',
    resultItem: {
      type: 'Activity',
      id: 'PIP-24-001',
      title: 'Erect Line 24-XX High Pressure Gas Header',
      project: 'Duliajan Unit A (PRJ-OIL-2026-01)',
      status: 'delayed',
      destination: {
        route: '/activities',
        drawerType: 'activity',
        targetId: 'PIP-24-001',
        tab: 'overview',
      },
    },
  },
  {
    id: 'rec-3',
    query: 'Daily Progress Report',
    timestamp: '2026-09-17T17:00:00Z',
    relativeTime: 'Yesterday',
    resultItem: {
      type: 'Report',
      id: 'REP-DPR',
      title: 'Daily Progress Report (DPR)',
      project: 'Duliajan Unit A (PRJ-OIL-2026-01)',
      status: 'Available',
      destination: {
        route: '/reports?reportId=REP-DPR',
      },
    },
  },
  {
    id: 'rec-4',
    query: 'Compressor Pedestal',
    timestamp: '2026-09-16T12:00:00Z',
    relativeTime: '2d ago',
    resultItem: {
      type: 'Evidence',
      id: 'EVD-001',
      title: 'Compressor Pedestal Foundation Pour Certificate',
      project: 'Duliajan Unit A (PRJ-OIL-2026-01)',
      status: 'Verified',
      destination: {
        route: '/evidence?id=EVD-001',
        drawerType: 'activity',
        targetId: 'CIV-11-001',
        tab: 'evidence',
      },
    },
  },
];

/**
 * Filter Master Index by Query and Entity Type
 */
export async function executeGlobalSearch(
  query: string,
  filterType: SearchResultType | 'ALL' = 'ALL',
  simulateError: boolean = false
): Promise<SearchResultItem[]> {
  // Simulate network / indexing latency (120ms)
  await new Promise((resolve) => setTimeout(resolve, 120));

  if (simulateError || query.toLowerCase().startsWith('err:')) {
    throw new Error('Search index service encountered an unexpected database query timeout.');
  }

  const trimmed = query.trim().toLowerCase();
  const master = buildMasterSearchIndex();

  if (!trimmed) {
    if (filterType === 'ALL') {
      return master.slice(0, 8); // Top featured items if no query
    }
    return master.filter((item) => item.type === filterType).slice(0, 8);
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);

  const matched = master.filter((item) => {
    // Check type filter
    if (filterType !== 'ALL' && item.type !== filterType) {
      return false;
    }

    const searchableText = [
      item.id,
      item.title,
      item.project,
      item.status,
      item.description || '',
      ...(item.tags || []),
    ]
      .join(' ')
      .toLowerCase();

    // Must match all entered tokens (AND query)
    return tokens.every((token) => searchableText.includes(token));
  });

  return matched;
}
