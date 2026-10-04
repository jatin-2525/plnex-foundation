import {
  PortfolioProject,
  ScheduleActivity,
  ExecutionEvent,
  EvidenceItem,
  AuditEntry,
  ScheduleHealthScore,
  DataQualityScore,
  ProjectMemoryCase,
  ApiResponse,
  QueryParams,
} from '../../types';
import {
  MOCK_PROJECTS,
  MOCK_ACTIVITIES,
  MOCK_EXECUTION_EVENTS,
  MOCK_EVIDENCE_ITEMS,
  MOCK_AUDIT_LOGS,
  MOCK_HEALTH_SCORE,
  MOCK_DATA_QUALITY_SCORE,
  MOCK_PROJECT_MEMORY,
} from './mockData';
import { parseFieldText, evaluateScheduleMatch } from '../domain/matchingEngine';
import { simulateWhatIfDelay, WhatIfSimulationResult } from '../domain/varianceEngine';
import { authService } from './authService';
import { hasPermission, Permission } from '../../types/permissions';
import { UserSession, UserRole } from '../../types';

class ProjectApiService {
  private projects: PortfolioProject[] = [...MOCK_PROJECTS];
  private activities: ScheduleActivity[] = [...MOCK_ACTIVITIES];
  private events: ExecutionEvent[] = [...MOCK_EXECUTION_EVENTS];
  private evidence: EvidenceItem[] = [...MOCK_EVIDENCE_ITEMS];
  private auditLogs: AuditEntry[] = [...MOCK_AUDIT_LOGS];

  /**
   * Enforces backend authorization: verifies authenticated user, organization, role, and permission.
   */
  private verifyAuthorization(options?: { permission?: Permission; allowedRoles?: UserRole[] }): UserSession | null {
    if (typeof window === 'undefined') return null;
    const session = authService.getCurrentSession();
    if (!session || !session.user) {
      throw new Error('401 Unauthorized: Valid authenticated session required to execute this operation.');
    }
    const user = session.user;
    if (options?.allowedRoles && !options.allowedRoles.includes(user.role) && user.role !== 'admin') {
      throw new Error(`403 Forbidden: Current role "${user.role}" is not authorized for this operation.`);
    }
    if (options?.permission && !hasPermission(user.role, options.permission) && user.role !== 'admin') {
      throw new Error(`403 Forbidden: Missing required privilege "${options.permission}".`);
    }
    return user;
  }

  async getProjects(): Promise<ApiResponse<PortfolioProject[]>> {
    return {
      data: this.projects,
      meta: { total: this.projects.length, page: 1, pageSize: 10, totalPages: 1 },
      timestamp: new Date().toISOString(),
    };
  }

  async getProject(id: string): Promise<ApiResponse<PortfolioProject | null>> {
    const prj = this.projects.find((p) => p.id === id) || this.projects[0];
    return {
      data: prj || null,
      timestamp: new Date().toISOString(),
    };
  }

  async createProject(projectData: Partial<PortfolioProject>): Promise<ApiResponse<PortfolioProject>> {
    this.verifyAuthorization({ permission: 'project:manage', allowedRoles: ['manager', 'admin'] });
    const newProject: PortfolioProject = {
      id: projectData.id || `PRJ-OIL-2026-${String(this.projects.length + 1).padStart(2, '0')}`,
      code: projectData.code || `OIL-NEW-${String(this.projects.length + 1).padStart(2, '0')}`,
      name: projectData.name || 'New Infrastructure Project',
      location: projectData.location || 'Assam Field Asset',
      organization: projectData.organization || 'Oil India Limited',
      contractor: projectData.contractor || 'Contractor Consortium Pending',
      projectManager: projectData.projectManager || 'Rajesh Sharma, Chief Project Manager',
      siteEngineer: projectData.siteEngineer || 'Debajit Borah, Lead Site Engineer',
      startDate: projectData.startDate || new Date().toISOString().split('T')[0],
      targetCompletionDate: projectData.targetCompletionDate || '2027-06-30',
      budget: projectData.budget || '₹ 50.00 Cr',
      overallProgress: 0,
      plannedProgress: 0,
      variance: 0,
      delayedCount: 0,
      atRiskCount: 0,
      completedCount: 0,
      status: 'on-track',
      scheduleVersion: projectData.scheduleVersion || 'Rev 1.0 (P6 XML)',
      openReviews: 0,
      openRisks: 0,
      lastUpdated: new Date().toISOString(),
      scheduleHealth: 'healthy',
      ...projectData,
    };
    this.projects.unshift(newProject);
    return {
      data: newProject,
      timestamp: new Date().toISOString(),
    };
  }

  async getActivities(projectId: string, params?: QueryParams): Promise<ApiResponse<ScheduleActivity[]>> {
    let result = this.activities.filter((a) => a.projectId === projectId);

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.discipline.toLowerCase().includes(q) ||
          (a.line && a.line.toLowerCase().includes(q))
      );
    }

    if (params?.filters) {
      for (const filter of params.filters) {
        if (filter.field === 'discipline' && filter.value) {
          result = result.filter((a) => a.discipline === filter.value);
        }
        if (filter.field === 'status' && filter.value) {
          result = result.filter((a) => a.status === filter.value);
        }
      }
    }

    return {
      data: result,
      meta: { total: result.length, page: 1, pageSize: result.length, totalPages: 1 },
      timestamp: new Date().toISOString(),
    };
  }

  async getExecutionEvents(projectId: string, params?: QueryParams): Promise<ApiResponse<ExecutionEvent[]>> {
    let result = this.events.filter((e) => e.projectId === projectId);

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.rawText.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          (e.matchedActivityName && e.matchedActivityName.toLowerCase().includes(q))
      );
    }

    if (params?.filters) {
      for (const filter of params.filters) {
        if (filter.field === 'status' && filter.value) {
          result = result.filter((e) => e.status === filter.value);
        }
      }
    }

    return {
      data: result,
      meta: { total: result.length, page: 1, pageSize: result.length, totalPages: 1 },
      timestamp: new Date().toISOString(),
    };
  }

  async getHealthScore(projectId: string): Promise<ApiResponse<ScheduleHealthScore>> {
    return {
      data: MOCK_HEALTH_SCORE,
      timestamp: new Date().toISOString(),
    };
  }

  async getDataQualityScore(projectId: string): Promise<ApiResponse<DataQualityScore>> {
    return {
      data: MOCK_DATA_QUALITY_SCORE,
      timestamp: new Date().toISOString(),
    };
  }

  async getEvidenceItems(projectId: string): Promise<ApiResponse<EvidenceItem[]>> {
    return {
      data: this.evidence,
      meta: { total: this.evidence.length, page: 1, pageSize: this.evidence.length, totalPages: 1 },
      timestamp: new Date().toISOString(),
    };
  }

  async getAuditLogs(projectId: string): Promise<ApiResponse<AuditEntry[]>> {
    return {
      data: this.auditLogs,
      meta: { total: this.auditLogs.length, page: 1, pageSize: this.auditLogs.length, totalPages: 1 },
      timestamp: new Date().toISOString(),
    };
  }

  async getProjectMemory(): Promise<ApiResponse<ProjectMemoryCase[]>> {
    return {
      data: MOCK_PROJECT_MEMORY,
      timestamp: new Date().toISOString(),
    };
  }

  async submitFieldReport(
    projectId: string,
    rawText: string,
    source: 'DPR_PDF' | 'EXCEL_SHEET' | 'SITE_DIARY' | 'FIELD_QUICK_FORM' | 'VOICE_AGENT' = 'FIELD_QUICK_FORM'
  ): Promise<ApiResponse<ExecutionEvent>> {
    const user = this.verifyAuthorization({ permission: 'field:write', allowedRoles: ['engineer', 'admin'] });
    const extracted = parseFieldText(rawText);
    const analysis = evaluateScheduleMatch(extracted, rawText, this.activities);

    const newEvent: ExecutionEvent = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      projectId,
      source,
      rawText,
      eventDate: extracted.eventDate || new Date().toISOString().split('T')[0],
      eventTime: extracted.eventTime || '16:00',
      quantity: extracted.quantity || 1,
      unit: extracted.unit || 'units',
      discipline: extracted.discipline || 'Piping',
      area: extracted.area || 'Unit A',
      line: extracted.line || '',
      workDescription: rawText,
      extractedFields: {
        quantity: extracted.quantity || 1,
        unit: extracted.unit || 'units',
        line: extracted.line || '',
        area: extracted.area || 'Unit A',
        discipline: extracted.discipline || 'Piping',
        workType: extracted.workType || 'Execution',
        eventDate: extracted.eventDate || new Date().toISOString().split('T')[0],
        eventTime: extracted.eventTime || '16:00',
        confidenceSignals: analysis.signals,
      },
      confidence: analysis.confidence,
      matchCategory: analysis.category,
      matchedActivityId: analysis.bestMatch ? analysis.bestMatch.activityId : null,
      matchedActivityName: analysis.bestMatch ? analysis.bestMatch.activityName : null,
      matchedReasons: analysis.reasons,
      alternativeCandidates: analysis.candidates,
      status: analysis.category === 'AUTO_LINK' ? 'auto-linked' : analysis.category === 'MANAGER_REVIEW' ? 'pending-review' : 'pending-verification',
      createdBy: user ? `${user.name} (${user.role.toUpperCase()})` : 'Site Engineer (Active Field Session)',
      createdAt: new Date().toISOString(),
      evidenceIds: [],
    };

    this.events.unshift(newEvent);

    // Add audit entry
    this.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: user?.name || 'PLnEX Intelligent Extraction Engine',
      role: (user?.role || 'SYSTEM') as UserRole | 'SYSTEM',
      action: 'INGEST_AND_MATCH',
      objectType: 'EXECUTION_EVENT',
      objectId: newEvent.id,
      objectTitle: rawText.slice(0, 40) + '...',
      newValue: `${analysis.bestMatch?.activityId || 'UNMATCHED'} (${analysis.confidence}%)`,
      details: `Discipline: ${extracted.discipline}, Confidence: ${analysis.confidence}%, Status: ${newEvent.status}`,
    });

    return {
      data: newEvent,
      timestamp: new Date().toISOString(),
    };
  }

  async approveMatch(eventId: string, managerNotes?: string): Promise<ApiResponse<ExecutionEvent>> {
    const user = this.verifyAuthorization({ permission: 'verify:approve', allowedRoles: ['manager', 'admin'] });
    const event = this.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event not found: ${eventId}`);

    event.status = 'approved';
    event.reviewedAt = new Date().toISOString();
    event.reviewedBy = user ? `${user.name} (${user.title})` : 'Rajesh Sharma (Project Manager)';
    event.managerNotes = managerNotes;

    // Synchronize to activity actuals
    if (event.matchedActivityId) {
      const act = this.activities.find((a) => a.id === event.matchedActivityId);
      if (act) {
        act.actualQuantity = Math.min(act.plannedQuantity, act.actualQuantity + event.quantity);
        act.actualProgress = Math.min(100, Math.round((act.actualQuantity / act.plannedQuantity) * 100));
        act.status = act.actualProgress >= 100 ? 'completed' : 'on-track';
      }
    }

    this.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: 'Rajesh Sharma',
      role: 'manager',
      action: 'APPROVE_SCHEDULE_LINK',
      objectType: 'EXECUTION_EVENT',
      objectId: event.id,
      objectTitle: event.matchedActivityName || event.id,
      previousValue: 'PENDING_REVIEW',
      newValue: 'APPROVED_AND_COMMITTED',
      details: managerNotes || 'Planner approved candidate activity match and committed actuals.',
    });

    return {
      data: event,
      timestamp: new Date().toISOString(),
    };
  }

  async rejectMatch(eventId: string, reason: string): Promise<ApiResponse<ExecutionEvent>> {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event not found: ${eventId}`);

    event.status = 'rejected';
    event.reviewedAt = new Date().toISOString();
    event.reviewedBy = 'Rajesh Sharma (Project Manager)';
    event.managerNotes = reason;

    this.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: 'Rajesh Sharma',
      role: 'manager',
      action: 'REJECT_SCHEDULE_LINK',
      objectType: 'EXECUTION_EVENT',
      objectId: event.id,
      objectTitle: event.matchedActivityName || event.id,
      previousValue: 'PENDING_REVIEW',
      newValue: 'REJECTED',
      details: reason,
    });

    return {
      data: event,
      timestamp: new Date().toISOString(),
    };
  }

  async rematchEvent(eventId: string, targetActivityId: string, reason: string): Promise<ApiResponse<ExecutionEvent>> {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event not found: ${eventId}`);

    const targetActivity = this.activities.find((a) => a.id === targetActivityId);
    if (!targetActivity) throw new Error(`Target activity not found: ${targetActivityId}`);

    const oldActivity = event.matchedActivityId;
    event.matchedActivityId = targetActivity.id;
    event.matchedActivityName = targetActivity.name;
    event.status = 'rematched';
    event.reviewedAt = new Date().toISOString();
    event.reviewedBy = 'Rajesh Sharma (Project Manager)';
    event.managerNotes = `Rematched from ${oldActivity || 'none'} to ${targetActivity.id}: ${reason}`;

    this.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: 'Rajesh Sharma',
      role: 'manager',
      action: 'MANUAL_REMATCH',
      objectType: 'EXECUTION_EVENT',
      objectId: event.id,
      objectTitle: targetActivity.name,
      previousValue: oldActivity || 'UNLINKED',
      newValue: targetActivity.id,
      details: reason,
    });

    return {
      data: event,
      timestamp: new Date().toISOString(),
    };
  }

  simulateWhatIf(activityId: string, addedDays: number): ApiResponse<WhatIfSimulationResult> {
    this.verifyAuthorization({ permission: 'variance:simulate', allowedRoles: ['manager', 'admin'] });
    const res = simulateWhatIfDelay(activityId, addedDays, this.activities);
    return {
      data: res,
      timestamp: new Date().toISOString(),
    };
  }
}

export const projectService = new ProjectApiService();
