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
  onRetry?: () => void;
  requiredPermission?: string;
}

export function StateWrapper({
  children,
  state,
  loadingMessage,
  emptyTitle,
  emptyDescription,
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
        title="Unable to load schedule."
        message="Failed to synchronize with Primavera P6 schedule bridge. Check connection and retry."
        code="ERR_P6_SYNC_FAILURE"
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
