import { DisciplineType } from '../../types';

export interface ReportTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  category: 'Daily Progress' | 'Progress Summary' | 'Delay Report' | 'Risk Report' | 'Exception Report' | 'Evidence-linked Activity Report';
  icon: string;
  badge: string;
  formatsSupported: Array<'PDF' | 'XLSX' | 'CSV'>;
  defaultTimeframe: string;
}

export interface ReportBuilderConfig {
  reportId: string;
  project: string;
  startDate: string;
  endDate: string;
  scheduleVersion: string;
  area: string;
  discipline: string;
  status: string;
  includeEvidenceThumbnails: boolean;
  includeAuditSignatures: boolean;
  includeCpmCriticalPath: boolean;
}

export type MemoryCategory =
  | 'Historical Execution'
  | 'Actual Durations'
  | 'Delay Causes'
  | 'Verified Progress'
  | 'Past Decisions'
  | 'Evidence';

export interface HistoricalMemoryRecord {
  id: string;
  title: string;
  category: MemoryCategory;
  projectCode: string;
  projectName: string;
  year: string;
  date: string;
  discipline: DisciplineType;
  activityType: 'Erection' | 'Welding' | 'Concreting' | 'Cable Laying' | 'Alignment' | 'Testing' | 'Commissioning';
  plannedDurationDays: number;
  actualDurationDays: number;
  varianceDurationDays: number;
  verifiedProgress: number; // 0-100%
  delayCauses: string[];
  delayCategory: 'Weather / Monsoon' | 'Logistics / Access' | 'Equipment Breakdown' | 'Quality / NCR' | 'Inspection Backlog' | 'None (Ahead)';
  pastDecision?: {
    summary: string;
    rationale: string;
    authorizedBy: string;
    date: string;
  };
  productivityObservation: {
    metricName: string;
    achievedRate: string;
    benchmarkRate: string;
    equipmentCrewUsed: string;
    efficiencyDelta: string;
  };
  disciplinePattern: string;
  mitigationLearned: string;
  sourceVerifiedRecord: {
    recordType: 'EXECUTION_EVENT' | 'EVIDENCE_ARTIFACT' | 'AUDIT_LOG' | 'HISTORIC_CONTRACT' | 'ENGINEERING_DIRECTIVE';
    recordId: string;
    title: string;
    hashOrStamp: string;
    linkUrl?: string;
  };
  evidenceLink: {
    evidenceId: string;
    title: string;
    linkUrl: string;
  };
  verifiedBy: string;
  verifiedAt: string;
  confidenceScore: number;
}

// 6 Canonical Report Types
export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'REP-DPR',
    name: 'Daily Progress',
    title: 'Daily Site Execution & Manpower Report (DPR)',
    description: 'Comprehensive daily log of completed quantities, shift manpower, equipment utilization, site weather conditions, and verified field photos.',
    category: 'Daily Progress',
    icon: 'FileText',
    badge: 'Daily Operational',
    formatsSupported: ['PDF', 'XLSX', 'CSV'],
    defaultTimeframe: 'Single Day / Shift',
  },
  {
    id: 'REP-PROGRESS-SUM',
    name: 'Progress Summary',
    title: 'Executive Physical S-Curve & Milestone Tracker',
    description: 'High-level physical completion percentage across WBS levels, comparing baseline planned progress against actual verified progress without EVM distortion.',
    category: 'Progress Summary',
    icon: 'TrendingUp',
    badge: 'Executive',
    formatsSupported: ['PDF', 'XLSX'],
    defaultTimeframe: 'Month-to-Date / Cumulative',
  },
  {
    id: 'REP-DELAY',
    name: 'Delay Report',
    title: 'CPM Variance, Predecessor Delay & Float Slip Audit',
    description: 'Itemized register of all activities running behind planned baseline dates, distinguishing total float absorption from irreversible Critical Path milestone slippage.',
    category: 'Delay Report',
    icon: 'Clock',
    badge: 'Critical Path',
    formatsSupported: ['PDF', 'XLSX', 'CSV'],
    defaultTimeframe: 'Cumulative Lookahead',
  },
  {
    id: 'REP-RISK',
    name: 'Risk Report',
    title: 'Dependency Impact & Downstream Successor Exposure',
    description: 'Translates physical field variances into probabilistic downstream critical path impacts, identifying exposed handover gates and mitigation action statuses.',
    category: 'Risk Report',
    icon: 'AlertTriangle',
    badge: 'Predictive Impact',
    formatsSupported: ['PDF', 'XLSX'],
    defaultTimeframe: 'Lookahead 60 Days',
  },
  {
    id: 'REP-EXCEPTION',
    name: 'Exception Report',
    title: 'Schedule Network Structural Flaws & Execution Mismatches',
    description: 'Flags inverted start/finish dates, unassigned WBS parents, dangling logic links, duplicate field updates, and conflicting quantities reported by engineers.',
    category: 'Exception Report',
    icon: 'AlertCircle',
    badge: 'Quality & Audit',
    formatsSupported: ['PDF', 'XLSX', 'CSV'],
    defaultTimeframe: 'Full Network Scan',
  },
  {
    id: 'REP-EVIDENCE-LINKED',
    name: 'Evidence-linked Activity Report',
    title: 'Statutory Verification Dossier with Cryptographic Signatures',
    description: 'Compliance binder tying every reported percentage progress update directly to timestamped photos, GPS coordinates, and verified inspection certificates.',
    category: 'Evidence-linked Activity Report',
    icon: 'ShieldCheck',
    badge: 'Audit Certified',
    formatsSupported: ['PDF', 'XLSX'],
    defaultTimeframe: 'Project Inception to Date',
  },
];

// 6 Canonical Project Memory Facets
export const HISTORICAL_MEMORY_RECORDS: HistoricalMemoryRecord[] = [
  // 1. Historical Execution
  {
    id: 'MEM-2026-001',
    title: 'Line 24 HP Gas Header 24" Prefabricated Spool Erection',
    category: 'Historical Execution',
    projectCode: 'OIL-DUL-01',
    projectName: 'Duliajan Gas Processing & Pipeline Interconnect',
    year: '2026',
    date: '14 Sep 2026',
    discipline: 'Piping',
    activityType: 'Erection',
    plannedDurationDays: 5,
    actualDurationDays: 4,
    varianceDurationDays: -1,
    verifiedProgress: 100,
    delayCauses: ['None (Completed 1 day ahead of planned baseline)'],
    delayCategory: 'None (Ahead)',
    productivityObservation: {
      metricName: 'Heavy Pipe Spool Erection Rate',
      achievedRate: '12 spools / 7.5 hrs',
      benchmarkRate: '8 spools / 8 hrs',
      equipmentCrewUsed: '75T Mobile Crane + 6-man certified rigging crew',
      efficiencyDelta: '+50% productivity boost',
    },
    disciplinePattern: 'Prefabricated 24" spools consistently install 30% faster when rigging pads are pre-compacted to 220 kPa and crane outrigger mats are deployed before shift start.',
    mitigationLearned: 'Pre-inspect ground bearing compaction 24 hours prior to heavy crane staging to avoid morning setup stalls.',
    sourceVerifiedRecord: {
      recordType: 'EVIDENCE_ARTIFACT',
      recordId: 'EVD-002',
      title: 'Site Photo: Spool 24-XX Erection on Piperack Section B',
      hashOrStamp: 'SHA-256: a1b2c3d4e5f60718293a4b5c6d7e8f901234567890abcdef',
      linkUrl: '/evidence',
    },
    evidenceLink: {
      evidenceId: 'EVD-002',
      title: 'Geolocated Site Photograph - Line 24 Hoisting',
      linkUrl: '/evidence',
    },
    verifiedBy: 'Debajit Borah (Lead Site Execution Engineer)',
    verifiedAt: '2026-09-14 18:00 IST',
    confidenceScore: 96,
  },

  // 2. Actual Durations
  {
    id: 'MEM-2025-002',
    title: 'Gas Dehydration Unit Centrifugal Skids Precision Laser Alignment',
    category: 'Actual Durations',
    projectCode: 'OIL-OGS-2025',
    projectName: 'Duliajan Oil Gathering Station 3 Revamp (2025)',
    year: '2025',
    date: '24 Sep 2025',
    discipline: 'Mechanical',
    activityType: 'Alignment',
    plannedDurationDays: 14,
    actualDurationDays: 12,
    varianceDurationDays: -2,
    verifiedProgress: 100,
    delayCauses: ['None (Precision laser coupling kit reduced dial gauge iteration)'],
    delayCategory: 'None (Ahead)',
    productivityObservation: {
      metricName: 'Centrifugal Compressor Dual Shaft Alignment',
      achievedRate: '1 skid train / 6 days',
      benchmarkRate: '1 skid train / 7 days',
      equipmentCrewUsed: 'Optalign Smart RS laser system + 4 millwright technicians',
      efficiencyDelta: '+14% duration compression',
    },
    disciplinePattern: 'Dual-axis laser alignment achieves hot-condition thermal growth offset tolerances in 2 passes vs 5 passes required by traditional reverse indicator dial gauges.',
    mitigationLearned: 'Standardize electronic thermal growth compensation inputs before cold alignment commences.',
    sourceVerifiedRecord: {
      recordType: 'HISTORIC_CONTRACT',
      recordId: 'QA-MEC-OGS-ALN-03',
      title: 'Final Shaft Alignment Certificate & Laser Runout Ledger',
      hashOrStamp: 'OEM Approved: Dresser-Rand / Siemens Energy Spec M-401',
    },
    evidenceLink: {
      evidenceId: 'EVD-001',
      title: 'Foundation Block A NABL Calibration & Alignment Certificate',
      linkUrl: '/evidence',
    },
    verifiedBy: 'M. Bordoloi (Superintending Mechanical Engineer)',
    verifiedAt: '2025-09-24 16:30 IST',
    confidenceScore: 95,
  },

  // 3. Delay Causes
  {
    id: 'MEM-2026-002',
    title: 'Line 24 Field Butt Welding & TIG Root Run Inspections Monsoon Delay',
    category: 'Delay Causes',
    projectCode: 'OIL-DUL-01',
    projectName: 'Duliajan Gas Processing & Pipeline Interconnect',
    year: '2026',
    date: '16 Sep 2026',
    discipline: 'Piping',
    activityType: 'Welding',
    plannedDurationDays: 6,
    actualDurationDays: 8,
    varianceDurationDays: 2,
    verifiedProgress: 70,
    delayCauses: [
      'Heavy afternoon monsoon drizzle forced 3.5h welding suspension (high humidity risk for hydrogen cracking)',
      'Preheating coil cable short circuit required replacement (1.5h stall)',
    ],
    delayCategory: 'Weather / Monsoon',
    productivityObservation: {
      metricName: '24" Pipe Field Butt Weld Joint Completion',
      achievedRate: '4 joints / day (monsoon shift)',
      benchmarkRate: '6 joints / day (dry shift)',
      equipmentCrewUsed: '2 TIG/SMAW welding rigs + 4 coded welders',
      efficiencyDelta: '-33% weather productivity loss',
    },
    disciplinePattern: 'Monsoon humidity in Upper Assam (>85% RH) drops field welding output by ~35% due to mandatory joint drying shelters and constant preheating verifications.',
    mitigationLearned: 'Erect sealed portable welding tents with induction preheating jackets to maintain production during intermittent rain.',
    sourceVerifiedRecord: {
      recordType: 'EXECUTION_EVENT',
      recordId: 'EVT-2026-002',
      title: 'DPR Execution Log: 8 welds completed on Line 24-XX',
      hashOrStamp: 'Verified Match: PIP-24-002 (86% confidence)',
      linkUrl: '/execution',
    },
    evidenceLink: {
      evidenceId: 'EVD-004',
      title: 'Welding Inspection Sheet & NDT Radiography Clearance Dossier',
      linkUrl: '/evidence',
    },
    verifiedBy: 'Rajesh Sharma (Project Controls Manager)',
    verifiedAt: '2026-09-17 09:30 IST',
    confidenceScore: 92,
  },

  // 4. Verified Progress
  {
    id: 'MEM-2026-003',
    title: 'Foundation Block A Compressor Pedestal Concrete Pour & 28-day Strength',
    category: 'Verified Progress',
    projectCode: 'OIL-DUL-01',
    projectName: 'Duliajan Gas Processing & Pipeline Interconnect',
    year: '2026',
    date: '14 Sep 2026',
    discipline: 'Civil',
    activityType: 'Concreting',
    plannedDurationDays: 9,
    actualDurationDays: 9,
    varianceDurationDays: 0,
    verifiedProgress: 100,
    delayCauses: ['None (Curing cycle completed exactly on planned schedule)'],
    delayCategory: 'None (Ahead)',
    productivityObservation: {
      metricName: 'Mass Concrete Monolithic Pour Rate',
      achievedRate: '45 m³ / 6 hrs',
      benchmarkRate: '40 m³ / 8 hrs',
      equipmentCrewUsed: 'Transit concrete mixer + 32m boom pump + dual vibrators',
      efficiencyDelta: '+12.5% volumetric placement speed',
    },
    disciplinePattern: 'Continuous mass pours on compressor blocks succeed with 0 thermal cracking when ice-flaked batching water is used to keep core temp under 28°C.',
    mitigationLearned: 'Mandate night pours between 20:00 and 04:00 during summer months to control hydration heat and accelerate curing release.',
    sourceVerifiedRecord: {
      recordType: 'EVIDENCE_ARTIFACT',
      recordId: 'EVD-001',
      title: 'Compressor Pedestal Foundation Pour Certificate (28-day)',
      hashOrStamp: 'NABL Certified: 38.2 N/mm² achieved',
      linkUrl: '/evidence',
    },
    evidenceLink: {
      evidenceId: 'EVD-001',
      title: 'DPR Batching Plant Delivery Slip & Pour Log',
      linkUrl: '/evidence',
    },
    verifiedBy: 'S. Ramanathan (Civil Quality Inspector)',
    verifiedAt: '2026-09-14 17:00 IST',
    confidenceScore: 98,
  },

  // 5. Past Decisions
  {
    id: 'MEM-2024-001',
    title: 'Trunk Pipeline River Crossing Horizontal Directional Drilling (HDD) Reroute',
    category: 'Past Decisions',
    projectCode: 'OIL-NHK-2024',
    projectName: 'Naharkatiya-Duliajan 16" Gas Trunk Pipeline',
    year: '2024',
    date: '12 Nov 2024',
    discipline: 'Piping',
    activityType: 'Erection',
    plannedDurationDays: 45,
    actualDurationDays: 40,
    varianceDurationDays: -5,
    verifiedProgress: 100,
    delayCauses: ['None (Decision compressed wet-crossing schedule by 5 days)'],
    delayCategory: 'None (Ahead)',
    pastDecision: {
      summary: 'Authorized change from open-trench river crossing to 680m HDD under Burhi Dihing riverbed.',
      rationale: 'Avoided seasonal bank scouring and monsoon flooding environmental stop-work orders.',
      authorizedBy: 'Technical Advisory Committee & OIL Executive Director (Projects)',
      date: '2024-10-15',
    },
    productivityObservation: {
      metricName: '16" Pullback Speed via Directional Rig',
      achievedRate: '680 m / 14 hrs pullback',
      benchmarkRate: '500 m / 18 hrs pullback',
      equipmentCrewUsed: '250T HDD Rig + polymer bentonite continuous recycling plant',
      efficiencyDelta: '+35% continuous pullback velocity',
    },
    disciplinePattern: 'Deep geotechnical core borings every 100m are essential before pilot bore drilling in Brahmaputra alluvial silt beds to prevent tool bit seizure.',
    mitigationLearned: 'Include heavy reamer swivel safety shear pins to safeguard drill stem against sudden gravel pocket torque spikes.',
    sourceVerifiedRecord: {
      recordType: 'ENGINEERING_DIRECTIVE',
      recordId: 'OIL-DIR-2024-HDD-09',
      title: 'Project Steering Committee Minute 14: HDD Approval Resolution',
      hashOrStamp: 'Executive Resolution #2024-11-OIL-BOARD',
    },
    evidenceLink: {
      evidenceId: 'EVD-002',
      title: 'Hydrostatic Section Pressure Chart & As-Built Geotechnical Profile',
      linkUrl: '/evidence',
    },
    verifiedBy: 'Arunav Hazarika (Chief Project Manager)',
    verifiedAt: '2024-11-12 11:00 IST',
    confidenceScore: 99,
  },

  // 6. Evidence
  {
    id: 'MEM-2025-001',
    title: 'Oil Gathering Station 3 Foundation Pocket Grouting Lab Strength Retest',
    category: 'Evidence',
    projectCode: 'OIL-OGS-2025',
    projectName: 'Duliajan Oil Gathering Station 3 Revamp (2025)',
    year: '2025',
    date: '18 Aug 2025',
    discipline: 'Civil',
    activityType: 'Concreting',
    plannedDurationDays: 90,
    actualDurationDays: 96,
    varianceDurationDays: 6,
    verifiedProgress: 100,
    delayCauses: [
      'Mortar strength verification delayed by remote testing lab turnaround (4 days)',
      'High ambient heat caused flash setting on initial epoxy grout batch (2 days)',
    ],
    delayCategory: 'Quality / NCR',
    productivityObservation: {
      metricName: 'Skid Foundation Pocket Grouting',
      achievedRate: '3 foundations / week',
      benchmarkRate: '5 foundations / week',
      equipmentCrewUsed: 'High-flow non-shrink epoxy grout team (6 specialists)',
      efficiencyDelta: '-40% lab delay penalty',
    },
    disciplinePattern: 'Third-party concrete cube strength testing takes 5-7 days when sent to offsite labs, delaying successor mechanical package handoff.',
    mitigationLearned: 'Engage NABL accredited mobile testing laboratory on site to obtain validated 7-day strength results in under 2 hours.',
    sourceVerifiedRecord: {
      recordType: 'HISTORIC_CONTRACT',
      recordId: 'CERT-OGS-2025-CUBE-09',
      title: 'OGS-3 Closeout Audit Package: Section 4 Civil QC Dossier',
      hashOrStamp: 'OIL Corporate Archive: DOC-2025-8812-C',
    },
    evidenceLink: {
      evidenceId: 'EVD-003',
      title: 'Laboratory Cube Test Certificate & Non-Shrink Compressive Test Dossier',
      linkUrl: '/evidence',
    },
    verifiedBy: 'Pranab Phukan (Quality Control Lead)',
    verifiedAt: '2025-08-25 14:00 IST',
    confidenceScore: 94,
  },
];
