import { DisciplineType } from '../../types';

export interface ReportTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  category: 'Operational' | 'Executive' | 'Risk & Delay' | 'Compliance';
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

export interface HistoricalMemoryRecord {
  id: string;
  title: string;
  projectCode: string;
  projectName: string;
  year: string;
  date: string;
  discipline: DisciplineType;
  activityType: 'Erection' | 'Welding' | 'Concreting' | 'Cable Laying' | 'Alignment' | 'Testing' | 'Commissioning';
  plannedDurationDays: number;
  actualDurationDays: number;
  varianceDurationDays: number;
  delayCauses: string[];
  delayCategory: 'Weather / Monsoon' | 'Logistics / Access' | 'Equipment Breakdown' | 'Quality / NCR' | 'Inspection Backlog' | 'None (Ahead)';
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
    recordType: 'EXECUTION_EVENT' | 'EVIDENCE_ARTIFACT' | 'AUDIT_LOG' | 'HISTORIC_CONTRACT';
    recordId: string;
    title: string;
    hashOrStamp: string;
    linkUrl?: string;
  };
  verifiedBy: string;
  verifiedAt: string;
  confidenceScore: number;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'REP-DPR',
    name: 'Daily Progress Report (DPR)',
    title: 'Daily Site Execution & Manpower Report',
    description: 'Comprehensive daily log of completed quantities, shift manpower, equipment utilization, site weather conditions, and verified field photos.',
    category: 'Operational',
    icon: 'FileText',
    badge: 'Shift Level',
    formatsSupported: ['PDF', 'XLSX', 'CSV'],
    defaultTimeframe: 'Single Day / Shift',
  },
  {
    id: 'REP-PROGRESS-SUM',
    name: 'Project Progress Summary',
    title: 'Executive Physical S-Curve & Milestone Tracker',
    description: 'High-level physical completion percentage across WBS levels, comparing baseline planned progress against actual verified progress without EVM distortion.',
    category: 'Executive',
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
    category: 'Risk & Delay',
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
    category: 'Risk & Delay',
    icon: 'AlertTriangle',
    badge: 'Predictive',
    formatsSupported: ['PDF', 'XLSX'],
    defaultTimeframe: 'Lookahead 60 Days',
  },
  {
    id: 'REP-DISCIPLINE',
    name: 'Discipline Report',
    title: 'Multi-Discipline Engineering Handoff Breakdown',
    description: 'Disaggregated progress analysis across Civil foundations, Piping spools, Mechanical skids, Electrical cable trays, and Field Instrumentation.',
    category: 'Operational',
    icon: 'Layers',
    badge: 'Discipline',
    formatsSupported: ['PDF', 'XLSX', 'CSV'],
    defaultTimeframe: 'Current Schedule Cycle',
  },
  {
    id: 'REP-EXCEPTION',
    name: 'Exception Report',
    title: 'Schedule Network Structural Flaws & Execution Mismatches',
    description: 'Flags inverted start/finish dates, unassigned WBS parents, dangling logic links, duplicate field updates, and conflicting quantities reported by engineers.',
    category: 'Compliance',
    icon: 'AlertCircle',
    badge: 'Data Quality',
    formatsSupported: ['PDF', 'XLSX', 'CSV'],
    defaultTimeframe: 'Full Network Scan',
  },
  {
    id: 'REP-EVIDENCE-LINKED',
    name: 'Evidence-linked Activity Report',
    title: 'Audit Compliance Dossier with Cryptographic Signatures',
    description: 'Statutory compliance binder tying every reported percentage progress update directly to timestamped photos, GPS coordinates, and SHA-256 PDF certificates.',
    category: 'Compliance',
    icon: 'ShieldCheck',
    badge: 'Audit Grade',
    formatsSupported: ['PDF', 'XLSX'],
    defaultTimeframe: 'Project Inception to Date',
  },
];

export const HISTORICAL_MEMORY_RECORDS: HistoricalMemoryRecord[] = [
  {
    id: 'MEM-2026-001',
    title: 'Line 24 HP Gas Header 24" Prefabricated Spool Erection',
    projectCode: 'OIL-DUL-01',
    projectName: 'Duliajan Gas Processing & Pipeline Interconnect',
    year: '2026',
    date: '14 Sep 2026',
    discipline: 'Piping',
    activityType: 'Erection',
    plannedDurationDays: 5,
    actualDurationDays: 4,
    varianceDurationDays: -1,
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
    verifiedBy: 'Debajit Borah (Lead Site Execution Engineer)',
    verifiedAt: '2026-09-14 18:00',
    confidenceScore: 96,
  },
  {
    id: 'MEM-2026-002',
    title: 'Line 24 Field Butt Welding & TIG Root Run Inspections',
    projectCode: 'OIL-DUL-01',
    projectName: 'Duliajan Gas Processing & Pipeline Interconnect',
    year: '2026',
    date: '16 Sep 2026',
    discipline: 'Piping',
    activityType: 'Welding',
    plannedDurationDays: 6,
    actualDurationDays: 8,
    varianceDurationDays: 2,
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
    verifiedBy: 'Rajesh Sharma (Project Controls Manager)',
    verifiedAt: '2026-09-17 09:30',
    confidenceScore: 92,
  },
  {
    id: 'MEM-2026-003',
    title: 'Foundation Block A Compressor Pedestal Concrete Pour',
    projectCode: 'OIL-DUL-01',
    projectName: 'Duliajan Gas Processing & Pipeline Interconnect',
    year: '2026',
    date: '14 Sep 2026',
    discipline: 'Civil',
    activityType: 'Concreting',
    plannedDurationDays: 9,
    actualDurationDays: 9,
    varianceDurationDays: 0,
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
      recordId: 'EVD-003',
      title: 'Compressor Pedestal Foundation Pour Certificate (28-day)',
      hashOrStamp: 'NABL Certified: 38.2 N/mm² achieved',
      linkUrl: '/evidence',
    },
    verifiedBy: 'S. Ramanathan (Civil Quality Inspector)',
    verifiedAt: '2026-09-14 17:00',
    confidenceScore: 98,
  },
  {
    id: 'MEM-2025-001',
    title: 'Oil Gathering Station 3 Foundation Grouting Mortar Setting',
    projectCode: 'OIL-OGS-2025',
    projectName: 'Duliajan Oil Gathering Station 3 Revamp (2025)',
    year: '2025',
    date: '18 Aug 2025',
    discipline: 'Civil',
    activityType: 'Concreting',
    plannedDurationDays: 90,
    actualDurationDays: 96,
    varianceDurationDays: 6,
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
    verifiedBy: 'Pranab Phukan (Project Lead)',
    verifiedAt: '2025-08-25 14:00',
    confidenceScore: 94,
  },
  {
    id: 'MEM-2025-002',
    title: 'Gas Dehydration Unit Centrifugal Skids Laser Alignment',
    projectCode: 'OIL-OGS-2025',
    projectName: 'Duliajan Oil Gathering Station 3 Revamp (2025)',
    year: '2025',
    date: '24 Sep 2025',
    discipline: 'Mechanical',
    activityType: 'Alignment',
    plannedDurationDays: 14,
    actualDurationDays: 12,
    varianceDurationDays: -2,
    delayCauses: ['None (Precision laser coupling kit reduced dial gauge iteration)'],
    delayCategory: 'None (Ahead)',
    productivityObservation: {
      metricName: 'Shaft-to-Motor Angular & Radial Alignment',
      achievedRate: '0.02 mm tolerance / 6 hrs',
      benchmarkRate: '0.05 mm tolerance / 16 hrs',
      equipmentCrewUsed: 'Prüftechnik ROTALIGN Ultra Laser Alignment System',
      efficiencyDelta: '+62% precision setup acceleration',
    },
    disciplinePattern: 'Digital laser alignment reduces cold-alignment duration by over 60% compared to traditional reverse dial gauge indicators on heavy turbine drives.',
    mitigationLearned: 'Standardize electronic shaft alignment equipment across all mechanical packages in vendor specifications.',
    sourceVerifiedRecord: {
      recordType: 'HISTORIC_CONTRACT',
      recordId: 'ALIGN-OGS-2025-SKID-A',
      title: 'Centrifugal Gas Compressor Skid A Mechanical Runoff Sign-Off',
      hashOrStamp: 'OIL Inspection Seal: MEC-PASS-2025-092',
    },
    verifiedBy: 'Biman Das (Head of Facilities)',
    verifiedAt: '2025-09-26 11:30',
    confidenceScore: 97,
  },
  {
    id: 'MEM-2024-001',
    title: 'River Dihing Pipeline HDD Crossing Monsoon Flash Flood Delay',
    projectCode: 'OIL-NHK-2024',
    projectName: 'Naharkatiya to Moran Gas Trunk Pipeline (2024)',
    year: '2024',
    date: '12 Jul 2024',
    discipline: 'Piping',
    activityType: 'Erection',
    plannedDurationDays: 180,
    actualDurationDays: 197,
    varianceDurationDays: 17,
    delayCauses: [
      'Monsoon flood breached temporary access bund at River Dihing crossing (8 days)',
      'Delayed civil foundation curing by subcontractor (5 days)',
      'High-pressure hydrotest manifold re-inspection (4 days)',
    ],
    delayCategory: 'Weather / Monsoon',
    productivityObservation: {
      metricName: 'Horizontal Directional Drilling (HDD) Pullback',
      achievedRate: '450m section pullback / 14 days',
      benchmarkRate: '450m section pullback / 6 days',
      equipmentCrewUsed: '350T HDD Rig + High Pressure Mud Circulation Unit',
      efficiencyDelta: '-57% flash flood interruption',
    },
    disciplinePattern: 'River crossings executed during July-August face a 70% probability of 10+ day work suspension from sudden water level surges in Upper Assam catchments.',
    mitigationLearned: 'Enforce contractual requirement that all major river HDD crossings must finish pilot hole and pullback before May 31 pre-monsoon deadline.',
    sourceVerifiedRecord: {
      recordType: 'HISTORIC_CONTRACT',
      recordId: 'NCR-NHK-2024-FLOOD-01',
      title: 'Force Majeure Weather Extension Claim Dossier (Dihing Crossing)',
      hashOrStamp: 'Approved Executive Council Minute #14-2024',
    },
    verifiedBy: 'Deepak Sengupta (GM Pipeline Projects)',
    verifiedAt: '2024-07-28 16:00',
    confidenceScore: 99,
  },
  {
    id: 'MEM-2024-002',
    title: '33kV Substation Cable Tray Installation & Main Feeder Pulling',
    projectCode: 'OIL-NHK-2024',
    projectName: 'Naharkatiya to Moran Gas Trunk Pipeline (2024)',
    year: '2024',
    date: '15 Oct 2024',
    discipline: 'Electrical',
    activityType: 'Cable Laying',
    plannedDurationDays: 20,
    actualDurationDays: 23,
    varianceDurationDays: 3,
    delayCauses: [
      'Cable drum jack breakdown delayed feeder pulling by 2 days',
      'Structural clash with HVAC duct required tray re-routing at gallery intersection (1 day)',
    ],
    delayCategory: 'Equipment Breakdown',
    productivityObservation: {
      metricName: 'Armored HT Cable Pulling Rate',
      achievedRate: '320m cable / day',
      benchmarkRate: '450m cable / day',
      equipmentCrewUsed: 'Motorized winch + 12 rollers + 8 electrical technicians',
      efficiencyDelta: '-28% winch breakdown impact',
    },
    disciplinePattern: 'Heavy armored 33kV cable pulling creates safety and schedule bottlenecks when executed without motorized winch cable feed tensioners.',
    mitigationLearned: 'Require contractor to maintain dual backup cable pulling winches and conduct 3D clash checks between cable trays and HVAC ducts in engineering model.',
    sourceVerifiedRecord: {
      recordType: 'HISTORIC_CONTRACT',
      recordId: 'TEST-NHK-2024-ELEC-44',
      title: 'Substation Feeder Insulation Resistance & High-Pot Test Log',
      hashOrStamp: 'Chief Electrical Inspectorate Approval #CEI-2024-918',
    },
    verifiedBy: 'S. K. Verma (Resident Engineer)',
    verifiedAt: '2024-10-20 18:00',
    confidenceScore: 93,
  },
  {
    id: 'MEM-2024-003',
    title: 'Section 4 High Pressure Hydrostatic Integrity Validation (165 bar)',
    projectCode: 'OIL-NHK-2024',
    projectName: 'Naharkatiya to Moran Gas Trunk Pipeline (2024)',
    year: '2024',
    date: '10 Nov 2024',
    discipline: 'Piping',
    activityType: 'Testing',
    plannedDurationDays: 7,
    actualDurationDays: 11,
    varianceDurationDays: 4,
    delayCauses: [
      'Test manifold bleed valve gland packing leak during initial pressurization (2 days)',
      'Calibrated dead-weight tester gauge certificate expired, required re-calibration (2 days)',
    ],
    delayCategory: 'Inspection Backlog',
    productivityObservation: {
      metricName: '24-hour Hydrostatic Pressure Hold Stability',
      achievedRate: '165 bar hold at 0.05 bar/hr fluctuation',
      benchmarkRate: '165 bar hold at <0.1 bar/hr fluctuation',
      equipmentCrewUsed: 'High-pressure triplex plunger pump + dead weight tester',
      efficiencyDelta: 'Pass with 4-day instrument delay',
    },
    disciplinePattern: 'Hydrotest prep stalls are 80% attributed to secondary manifold accessories (valves, fittings, uncalibrated gauges) rather than the parent pipeline.',
    mitigationLearned: 'Pre-assemble and hydrotest test manifold headers independently at shop fabrication yard before field tie-in.',
    sourceVerifiedRecord: {
      recordType: 'HISTORIC_CONTRACT',
      recordId: 'CERT-NHK-2024-HYDRO-03',
      title: 'OISD Statutory Hydrotest Clearance Certificate (Section 4)',
      hashOrStamp: 'OISD Inspector Signed Seal: HYD-2024-1103',
    },
    verifiedBy: 'Rajesh Sharma (Project Controls Lead)',
    verifiedAt: '2024-11-15 15:30',
    confidenceScore: 98,
  },
];
