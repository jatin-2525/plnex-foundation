'use client';

import React, { ReactNode } from 'react';
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
  loadingMessage = 'Loading schedule data from Oil India WBS repository...',
  emptyTitle = 'No activities recorded',
  emptyDescription = 'There are no items matching this view or schedule filter.',
  onRetry,
  requiredPermission,
}: StateWrapperProps) {
  const { simulatedState, setSimulatedState, userSession } = useApp();

  // If a simulated state is chosen from the top header simulator, prioritize it
  const effectiveState = (simulatedState !== 'success' ? simulatedState : state) || 'success';

  if (effectiveState === 'loading') {
    return <LoadingState message={loadingMessage} rows={5} />;
  }

  if (effectiveState === 'empty') {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
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
        title="Schedule Service Unavailable"
        message="Failed to synchronize with Primavera P6 XML schedule bridge."
        code="ERR_P6_SYNC_FAILURE"
        onRetry={onRetry || (() => setSimulatedState('success'))}
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
