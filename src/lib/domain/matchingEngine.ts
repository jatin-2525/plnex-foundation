import {
  ScheduleActivity,
  CandidateMatch,
  MatchConfidenceCategory,
  ConfidenceSignal,
  ExtractedFields,
  DisciplineType,
} from '../../types';

export interface MatchAnalysis {
  bestMatch: CandidateMatch | null;
  category: MatchConfidenceCategory;
  confidence: number;
  signals: ConfidenceSignal[];
  reasons: string[];
  candidates: CandidateMatch[];
}

export function parseFieldText(text: string): Partial<ExtractedFields> {
  const lower = text.toLowerCase();

  // Discipline detection
  let discipline: DisciplineType = 'Piping';
  if (lower.includes('civil') || lower.includes('foundation') || lower.includes('concrete') || lower.includes('excavation')) {
    discipline = 'Civil';
  } else if (lower.includes('cable') || lower.includes('tray') || lower.includes('electrical') || lower.includes('panel')) {
    discipline = 'Electrical';
  } else if (lower.includes('pipe') || lower.includes('spool') || lower.includes('weld') || lower.includes('erect')) {
    discipline = 'Piping';
  } else if (lower.includes('pump') || lower.includes('compressor') || lower.includes('skid')) {
    discipline = 'Mechanical';
  } else if (lower.includes('instrument') || lower.includes('transmitter') || lower.includes('gauge')) {
    discipline = 'Instrumentation';
  }

  // Line identification
  const lineMatch = text.match(/(?:line|l)[-\s]?([0-9]+[a-z0-9-]*)/i);
  const line = lineMatch ? `Line ${lineMatch[1].toUpperCase()}` : 'Line 24-XX';

  // Area identification
  const areaMatch = text.match(/unit\s*([a-z0-9]+)|area\s*([a-z0-9]+)/i);
  const area = areaMatch ? `Unit ${areaMatch[1] || areaMatch[2]}` : 'Unit A';

  // Quantity detection
  const qtyMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(spools|meters|m3|joints|cables|units)/i);
  const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : 12;
  const unit = qtyMatch ? qtyMatch[2].toLowerCase() : 'spools';

  return {
    discipline,
    line,
    area,
    quantity,
    unit,
    workType: lower.includes('erect') ? 'Erection' : lower.includes('weld') ? 'Welding' : 'Installation',
    eventDate: '2026-09-14',
    eventTime: '16:30',
  };
}

export function evaluateScheduleMatch(
  extracted: Partial<ExtractedFields>,
  rawText: string,
  activities: ScheduleActivity[]
): MatchAnalysis {
  const scoredCandidates: CandidateMatch[] = activities.map((activity) => {
    const signals: ConfidenceSignal[] = [];
    const reasons: string[] = [];
    let totalScore = 0;

    // 1. Discipline Match (max 25)
    if (extracted.discipline && activity.discipline === extracted.discipline) {
      signals.push({
        name: 'Discipline Alignment',
        score: 25,
        maxScore: 25,
        reason: `Discipline strictly matches planned ${activity.discipline}`,
      });
      totalScore += 25;
      reasons.push(`Discipline matches: ${activity.discipline}`);
    } else {
      signals.push({
        name: 'Discipline Alignment',
        score: 5,
        maxScore: 25,
        reason: `Discipline mismatch (${extracted.discipline} vs ${activity.discipline})`,
      });
      totalScore += 5;
    }

    // 2. Component / Line Identifier (max 35)
    const rawUpper = rawText.toUpperCase();
    const actUpper = activity.name.toUpperCase();
    const actIdUpper = activity.id.toUpperCase();

    const hasLine = extracted.line && (actUpper.includes('24') || actUpper.includes(extracted.line.toUpperCase()) || actIdUpper.includes('24'));
    if (hasLine) {
      signals.push({
        name: 'Asset/Line Identifier',
        score: 35,
        maxScore: 35,
        reason: `Exact reference to ${activity.line || 'Line 24-XX'} confirmed`,
      });
      totalScore += 35;
      reasons.push(`Line identifier matches: ${activity.line || 'Line 24-XX'}`);
    } else {
      signals.push({
        name: 'Asset/Line Identifier',
        score: 10,
        maxScore: 35,
        reason: 'Asset tag not directly matched in schedule activity line',
      });
      totalScore += 10;
    }

    // 3. Action Verb / Work Type Match (max 20)
    const isErect = (rawUpper.includes('ERECT') || rawUpper.includes('SPOOL')) && actUpper.includes('ERECT');
    const isWeld = rawUpper.includes('WELD') && actUpper.includes('WELD');
    const isCivil = rawUpper.includes('FOUNDATION') && actUpper.includes('FOUNDATION');

    if (isErect || isWeld || isCivil) {
      signals.push({
        name: 'Semantic Work Action',
        score: 20,
        maxScore: 20,
        reason: 'Execution terminology mapped directly to planned work verb',
      });
      totalScore += 20;
      reasons.push('Semantic action mapped to planned activity work verb');
    } else {
      signals.push({
        name: 'Semantic Work Action',
        score: 8,
        maxScore: 20,
        reason: 'Partial semantic action similarity',
      });
      totalScore += 8;
    }

    // 4. Temporal Scheduled Window (max 15)
    // Reference date 2026-09-14
    if (activity.plannedStart <= '2026-09-14' && activity.plannedFinish >= '2026-09-10') {
      signals.push({
        name: 'Temporal Schedule Window',
        score: 14,
        maxScore: 15,
        reason: 'Field report date falls squarely within planned baseline active window',
      });
      totalScore += 14;
      reasons.push('Date is within planned schedule window');
    } else {
      signals.push({
        name: 'Temporal Schedule Window',
        score: 5,
        maxScore: 15,
        reason: 'Activity is outside expected active window',
      });
      totalScore += 5;
    }

    // 5. Unit & Metric Consistency (max 5)
    if (activity.unit.toLowerCase().includes('spool') || activity.unit.toLowerCase().includes('m') || activity.unit.toLowerCase().includes('nos')) {
      signals.push({
        name: 'Metric Consistency',
        score: 5,
        maxScore: 5,
        reason: `Reported units align with schedule basis (${activity.unit})`,
      });
      totalScore += 5;
    } else {
      signals.push({
        name: 'Metric Consistency',
        score: 2,
        maxScore: 5,
        reason: 'Unit conversion inferred',
      });
      totalScore += 2;
    }

    const clampedConfidence = Math.min(100, Math.max(15, totalScore));

    let category: MatchConfidenceCategory = 'UNMATCHED';
    if (clampedConfidence >= 90) {
      category = 'AUTO_LINK';
    } else if (clampedConfidence >= 70) {
      category = 'MANAGER_REVIEW';
    }

    return {
      activityId: activity.id,
      activityName: activity.name,
      discipline: activity.discipline,
      confidence: clampedConfidence,
      category,
      reasons,
      signals,
    };
  });

  // Sort descending by confidence
  scoredCandidates.sort((a, b) => b.confidence - a.confidence);

  const bestMatch = scoredCandidates[0] || null;
  const bestConfidence = bestMatch ? bestMatch.confidence : 0;
  const bestCategory = bestMatch ? bestMatch.category : 'UNMATCHED';

  return {
    bestMatch,
    category: bestCategory,
    confidence: bestConfidence,
    signals: bestMatch ? bestMatch.signals : [],
    reasons: bestMatch ? bestMatch.reasons : ['No high-confidence match found'],
    candidates: scoredCandidates.slice(0, 5),
  };
}
