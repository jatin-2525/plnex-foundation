'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { ProcessingState } from './ProcessingState';
import { PermissionDenied } from './PermissionDenied';
import { DataState } from '../../types';

export interface StateWrapperProps {
  children: ReactNode;
  state?: DataState;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorMessage?: string;
  errorCode?: string;
  onRetry?: () => void;
  requiredPermission?: string;
}

export function StateWrapper({
  children,
  state,
  loadingMessage,
  emptyTitle,
  emptyDescription,
  errorTitle,
  errorMessage,
  errorCode,
  onRetry,
  requiredPermission,
}: StateWrapperProps) {
  const { simulatedState, setSimulatedState, userSession } = useApp();
  const pathname = usePathname() || '';

  const resolvedLoadingMessage =
    loadingMessage ||
    (pathname.includes('/execution')
      ? 'Loading execution events...'
      : pathname.includes('/reports')
      ? 'Preparing report...'
      : pathname.includes('/progress')
      ? 'Loading progress telemetry...'
      : pathname.includes('/review')
      ? 'Loading review queue...'
      : pathname.includes('/risks')
      ? 'Loading delay risks...'
      : pathname.includes('/evidence')
      ? 'Loading evidence records...'
      : pathname.includes('/sync')
      ? 'Loading synchronization queue...'
      : pathname.includes('/health')
      ? 'Loading schedule health metrics...'
      : pathname.includes('/what-if')
      ? 'Loading scenario simulation...'
      : pathname.includes('/projects')
      ? 'Loading project portfolio...'
      : pathname.includes('/dashboard')
      ? 'Loading dashboard overview...'
      : pathname.includes('/matching')
      ? 'Loading matching records...'
      : pathname.includes('/variance')
      ? 'Loading baseline variance...'
      : pathname.includes('/engineer')
      ? 'Loading engineer cockpit...'
      : pathname.includes('/field')
      ? 'Loading field operations...'
      : 'Loading schedule...');

  const resolvedEmptyTitle =
    emptyTitle ||
    (pathname.includes('/execution')
      ? 'No execution events found in this view'
      : pathname.includes('/reports')
      ? 'No report dossiers found in this view'
      : pathname.includes('/review')
      ? 'No review items found in this view'
      : pathname.includes('/risks')
      ? 'No delay risks found in this view'
      : pathname.includes('/evidence')
      ? 'No physical evidence found in this view'
      : pathname.includes('/sync')
      ? 'No synchronization records found in this view'
      : pathname.includes('/health')
      ? 'No schedule health issues found in this view'
      : pathname.includes('/what-if')
      ? 'No scenario simulations found in this view'
      : pathname.includes('/projects')
      ? 'No project records found in this view'
      : pathname.includes('/dashboard')
      ? 'No dashboard metrics found in this view'
      : 'No schedule activities found in this view');

  const resolvedEmptyDescription =
    emptyDescription ||
    (pathname.includes('/execution')
      ? 'Field reports submitted for this project will appear here after processing. Adjust your filters or submit a new execution report to populate this feed.'
      : pathname.includes('/reports')
      ? 'Engineering report dossiers generated for this project will appear here after compilation. Select a template and click Generate Report to create a report package.'
      : pathname.includes('/review')
      ? 'Candidate execution events pending engineer verification or manual rematch will appear here. Submit daily field reports or adjust filters to review unlinked records.'
      : pathname.includes('/risks')
      ? 'Activities on the critical path or with negative total float will appear here as delay warnings. Adjust filter criteria to inspect activities across all float bands.'
      : pathname.includes('/evidence')
      ? 'Time-stamped photos, inspection logs, and calibration certificates linked to activities will appear here. Upload evidence files or adjust your filter selection.'
      : pathname.includes('/sync')
      ? 'Records queued for two-way synchronization between field tablets and enterprise Primavera P6 will appear here. Reset your queue status filter to view all events.'
      : pathname.includes('/health')
      ? 'All DCMA 14-point schedule health integrity checks are in full compliance with zero integrity anomalies detected. Reset filters to inspect passed health criteria.'
      : pathname.includes('/what-if')
      ? 'What-if schedule impact simulations and mitigation forecasts saved to the vault will appear here. Create a new scenario in the simulator to assess float shifts.'
      : pathname.includes('/projects')
      ? 'No projects match the current search or status filter. Reset filters to view all active capital infrastructure projects.'
      : 'No activities match the current filters or baseline selection. Adjust your filter criteria or reset to view all project activities.');

  const resolvedErrorTitle =
    errorTitle ||
    (pathname.includes('/execution')
      ? 'Execution events could not be displayed.'
      : pathname.includes('/reports')
      ? 'Reports could not be displayed.'
      : pathname.includes('/progress')
      ? 'Progress telemetry could not be displayed.'
      : pathname.includes('/review')
      ? 'Review queue could not be displayed.'
      : pathname.includes('/risks')
      ? 'Delay risks could not be displayed.'
      : pathname.includes('/evidence')
      ? 'Evidence records could not be displayed.'
      : pathname.includes('/sync')
      ? 'Sync queue could not be displayed.'
      : pathname.includes('/health')
      ? 'Schedule health could not be displayed.'
      : pathname.includes('/what-if')
      ? 'Scenario simulation could not be displayed.'
      : pathname.includes('/projects')
      ? 'Project portfolio could not be displayed.'
      : pathname.includes('/dashboard')
      ? 'Dashboard could not be displayed.'
      : pathname.includes('/matching')
      ? 'Match records could not be displayed.'
      : pathname.includes('/variance')
      ? 'Variance analysis could not be displayed.'
      : pathname.includes('/engineer')
      ? 'Engineer cockpit could not be displayed.'
      : pathname.includes('/field')
      ? 'Field operations could not be displayed.'
      : 'Schedule could not be displayed.');

  const resolvedErrorMessage =
    errorMessage ||
    (pathname.includes('/execution')
      ? 'The execution data is temporarily unavailable. Check your connection or retry the operation.'
      : pathname.includes('/reports')
      ? 'The reporting service is temporarily unavailable. Check report parameters or retry the operation.'
      : pathname.includes('/progress')
      ? 'The progress data is temporarily unavailable. Check your connection or retry the operation.'
      : pathname.includes('/review')
      ? 'The review queue data is temporarily unavailable. Check your connection or retry the operation.'
      : pathname.includes('/risks')
      ? 'The delay analysis data is temporarily unavailable. Check your connection or retry the operation.'
      : pathname.includes('/evidence')
      ? 'The evidence vault data is temporarily unavailable. Check your connection or retry the operation.'
      : pathname.includes('/sync')
      ? 'The synchronization gateway is temporarily unavailable. Check your connection or retry the operation.'
      : pathname.includes('/health')
      ? 'The health integrity data is temporarily unavailable. Check your connection or retry the operation.'
      : pathname.includes('/what-if')
      ? 'The simulation engine data is temporarily unavailable. Check simulation parameters or retry the operation.'
      : pathname.includes('/projects')
      ? 'The project directory data is temporarily unavailable. Check your connection or retry the operation.'
      : pathname.includes('/dashboard')
      ? 'The dashboard overview data is temporarily unavailable. Check your connection or retry the operation.'
      : pathname.includes('/matching')
      ? 'The matching engine data is temporarily unavailable. Check your connection or retry the operation.'
      : pathname.includes('/variance')
      ? 'The variance data is temporarily unavailable. Check your connection or retry the operation.'
      : pathname.includes('/engineer')
      ? 'The field assignment data is temporarily unavailable. Check your connection or retry the operation.'
      : pathname.includes('/field')
      ? 'The field operations data is temporarily unavailable. Check your connection or retry the operation.'
      : 'The schedule data is temporarily unavailable. Check your network connection or retry the operation.');

  const resolvedErrorCode =
    errorCode ||
    (pathname.includes('/execution')
      ? 'ERR_EXECUTION_UNAVAILABLE'
      : pathname.includes('/reports')
      ? 'ERR_REPORTS_UNAVAILABLE'
      : pathname.includes('/progress')
      ? 'ERR_PROGRESS_UNAVAILABLE'
      : pathname.includes('/review')
      ? 'ERR_REVIEW_UNAVAILABLE'
      : pathname.includes('/risks')
      ? 'ERR_RISKS_UNAVAILABLE'
      : pathname.includes('/evidence')
      ? 'ERR_EVIDENCE_UNAVAILABLE'
      : pathname.includes('/sync')
      ? 'ERR_SYNC_UNAVAILABLE'
      : pathname.includes('/health')
      ? 'ERR_HEALTH_UNAVAILABLE'
      : pathname.includes('/what-if')
      ? 'ERR_SIMULATION_UNAVAILABLE'
      : pathname.includes('/projects')
      ? 'ERR_PROJECTS_UNAVAILABLE'
      : pathname.includes('/dashboard')
      ? 'ERR_DASHBOARD_UNAVAILABLE'
      : pathname.includes('/matching')
      ? 'ERR_MATCHING_UNAVAILABLE'
      : pathname.includes('/variance')
      ? 'ERR_VARIANCE_UNAVAILABLE'
      : pathname.includes('/engineer')
      ? 'ERR_ENGINEER_UNAVAILABLE'
      : pathname.includes('/field')
      ? 'ERR_FIELD_UNAVAILABLE'
      : 'ERR_P6_SYNC_FAILURE');

  // If a simulated state is chosen from the top header simulator, prioritize it
  const effectiveState = (simulatedState !== 'success' ? simulatedState : state) || 'success';

  if (effectiveState === 'loading') {
    return <LoadingState message={resolvedLoadingMessage} rows={5} />;
  }

  if (effectiveState === 'empty') {
    return (
      <EmptyState
        title={resolvedEmptyTitle}
        description={resolvedEmptyDescription}
        action={{
          label: 'Reset Filters',
          onClick: () => setSimulatedState('success'),
        }}
      />
    );
  }

  if (effectiveState === 'error') {
    return (
      <ErrorState
        title={resolvedErrorTitle}
        message={resolvedErrorMessage}
        code={resolvedErrorCode}
        onRetry={onRetry || (() => setSimulatedState('success'))}
        retryLabel="Retry"
      />
    );
  }

  if (effectiveState === 'processing') {
    return (
      <ProcessingState
        title="Recalculating Downstream Critical Path"
        currentStep="Propagating Line 24-XX delay to instrumentation successors..."
        progressPercent={68}
        stepIndex={3}
        totalSteps={5}
        notes="Evaluated 12 predecessors. 2 milestones shifted. Critical path recalculated."
        onCancel={() => setSimulatedState('success')}
      />
    );
  }

  if (effectiveState === 'permission-denied') {
    return (
      <PermissionDenied
        requiredPermission={requiredPermission || 'plan:write'}
        role={userSession?.role || 'engineer'}
        message="Your role cannot modify schedule baselines or approve match overrides."
        onGoBack={() => setSimulatedState('success')}
      />
    );
  }

  return <>{children}</>;
}
