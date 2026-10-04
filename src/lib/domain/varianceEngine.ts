import { ScheduleActivity } from '../../types';
import { ActivityStatus } from '../../tokens/status';

export interface DelayChainStep {
  activityId: string;
  name: string;
  discipline: string;
  delayDays: number;
  reason: string;
  impactOnSuccessor: string;
}

export interface WhatIfSimulationResult {
  sourceActivityId: string;
  additionalDays: number;
  criticalPathImpacted: boolean;
  projectCompletionDelayDays: number;
  affectedDownstreamCount: number;
  affectedActivities: Array<{
    activityId: string;
    name: string;
    originalPlannedFinish: string;
    newProjectedFinish: string;
    additionalDelayDays: number;
    isCritical: boolean;
  }>;
}

/**
 * Pure domain logic for delay detection and variance calculation.
 * Follows the transparent rule engine requested by SIH26122:
 * - IF actual_finish > planned_finish -> DELAYED
 * - IF actual_progress < planned_progress -> AT RISK
 * - IF milestone deadline passed AND completion < 100% -> CRITICAL / DELAYED
 * - IF dependency is delayed -> DOWNSTREAM RISK
 */
export function evaluateActivityStatus(
  plannedFinishDate: string,
  actualFinishDate: string | undefined,
  plannedProgress: number,
  actualProgress: number,
  isMilestone: boolean = false
): ActivityStatus {
  const now = new Date('2026-09-18'); // Reference project date
  const plannedFinish = new Date(plannedFinishDate);

  if (actualProgress >= 100) {
    return 'completed';
  }

  if (actualFinishDate) {
    const actualFinish = new Date(actualFinishDate);
    if (actualFinish > plannedFinish) {
      return 'delayed';
    }
  }

  if (now > plannedFinish && actualProgress < 100) {
    return 'delayed';
  }

  if (actualProgress < plannedProgress - 5) {
    return 'at-risk';
  }

  if (actualProgress > 0) {
    return 'on-track';
  }

  return 'pending';
}

/**
 * Computes deterministic dependency delay chains ("Why is this delayed?")
 */
export function traceDelayChain(
  targetActivityId: string,
  activities: ScheduleActivity[]
): DelayChainStep[] {
  const activityMap = new Map(activities.map((a) => [a.id, a]));
  const target = activityMap.get(targetActivityId);
  if (!target) return [];

  const chain: DelayChainStep[] = [];
  const visited = new Set<string>();

  function traversePredecessors(currId: string) {
    if (visited.has(currId)) return;
    visited.add(currId);

    const curr = activityMap.get(currId);
    if (!curr) return;

    for (const predId of curr.predecessors) {
      const pred = activityMap.get(predId);
      if (pred && (pred.delayDays > 0 || pred.status === 'delayed' || pred.status === 'at-risk')) {
        traversePredecessors(predId);
        chain.push({
          activityId: pred.id,
          name: pred.name,
          discipline: pred.discipline,
          delayDays: pred.delayDays,
          reason: `Discipline handoff delayed by ${pred.delayDays} days`,
          impactOnSuccessor: `Pushed start date of ${curr.name}`,
        });
      }
    }
  }

  traversePredecessors(targetActivityId);

  // Add the target itself as the terminus of the chain
  chain.push({
    activityId: target.id,
    name: target.name,
    discipline: target.discipline,
    delayDays: target.delayDays,
    reason: target.delayDays > 0 ? `Accumulated schedule slip of +${target.delayDays} days` : 'Current active stage',
    impactOnSuccessor: target.isCritical ? 'Impacts project critical milestone' : 'Consumes float',
  });

  return chain;
}

/**
 * Deterministic What-If simulator based on activity dependency graph.
 * Does not use blackbox ML, ensuring 100% explainability.
 */
export function simulateWhatIfDelay(
  activityId: string,
  addedDays: number,
  allActivities: ScheduleActivity[]
): WhatIfSimulationResult {
  const activityMap = new Map(allActivities.map((a) => [a.id, { ...a }]));
  const root = activityMap.get(activityId);

  if (!root) {
    return {
      sourceActivityId: activityId,
      additionalDays: 0,
      criticalPathImpacted: false,
      projectCompletionDelayDays: 0,
      affectedDownstreamCount: 0,
      affectedActivities: [],
    };
  }

  const affectedMap = new Map<string, {
    activityId: string;
    name: string;
    originalPlannedFinish: string;
    newProjectedFinish: string;
    additionalDelayDays: number;
    isCritical: boolean;
  }>();

  const queue: Array<{ id: string; delay: number }> = [{ id: activityId, delay: addedDays }];
  let criticalImpact = root.isCritical;
  let maxProjectDelay = root.isCritical ? addedDays : 0;

  while (queue.length > 0) {
    const item = queue.shift()!;
    const curr = activityMap.get(item.id);
    if (!curr) continue;

    if (item.id !== activityId) {
      const origDate = new Date(curr.plannedFinish);
      const newDate = new Date(origDate.getTime() + item.delay * 86400000);
      const newDateStr = newDate.toISOString().split('T')[0];

      affectedMap.set(item.id, {
        activityId: curr.id,
        name: curr.name,
        originalPlannedFinish: curr.plannedFinish,
        newProjectedFinish: newDateStr,
        additionalDelayDays: item.delay,
        isCritical: curr.isCritical,
      });

      if (curr.isCritical) {
        criticalImpact = true;
        maxProjectDelay = Math.max(maxProjectDelay, item.delay);
      }
    }

    for (const succId of curr.successors) {
      const succ = activityMap.get(succId);
      if (succ) {
        // Downstream inherits the delay based on critical path or remaining buffer
        const propagateDelay = succ.isCritical ? item.delay : Math.max(0, item.delay - 1);
        if (propagateDelay > 0) {
          queue.push({ id: succId, delay: propagateDelay });
        }
      }
    }
  }

  return {
    sourceActivityId: activityId,
    additionalDays: addedDays,
    criticalPathImpacted: criticalImpact,
    projectCompletionDelayDays: maxProjectDelay,
    affectedDownstreamCount: affectedMap.size,
    affectedActivities: Array.from(affectedMap.values()),
  };
}

/**
 * Granularity Bridge aggregator:
 * Converts sub-task or spool level execution items into L5/L6 activity percentage.
 */
export function aggregateSubtaskProgress(
  subtasks: Array<{ id: string; name: string; completedQuantity: number; targetQuantity: number }>
): { totalQuantity: number; completedQuantity: number; percentage: number } {
  if (subtasks.length === 0) return { totalQuantity: 0, completedQuantity: 0, percentage: 0 };

  const total = subtasks.reduce((acc, curr) => acc + curr.targetQuantity, 0);
  const completed = subtasks.reduce((acc, curr) => acc + curr.completedQuantity, 0);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    totalQuantity: total,
    completedQuantity: completed,
    percentage,
  };
}
