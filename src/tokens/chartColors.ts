/**
 * Standardized PLnEX Chart Colors & Visual Semantic Tokens
 *
 * Strict Design System Rules:
 * 1. Restrained Palette:
 *    - Planned:  neutral/primary (#0F6B68 / #E0EEF2)
 *    - Actual:   primary/semantic contrast (#2E7D5B)
 *    - Forecast: dashed neutral/secondary (#7B8798, dashArray: "5,4")
 *    - Positive: green (#2E7D5B)
 *    - Warning:  amber (#965E0D)
 *    - Critical: red (#A44339)
 * 2. Do not use random colors per page.
 * 3. Do not use gradients (flat, solid SVG fills and strokes only).
 * 4. Do not use 8–12 colors in one chart (max 3–4 restrained tokens per chart).
 * 5. Do not use color alone to communicate status:
 *    Every visualization MUST pair color with text labels, status glyphs (✓, ▲, ✕),
 *    stroke patterns (solid vs dashed), or numerical signs (+ / -).
 */

export const CHART_TOKENS = {
  // Planned: blue series (#5273C6)
  planned: {
    stroke: '#5273C6',        // Planned schedule baseline blue
    fill: '#EBF1FA',          // Soft blue fill for bars
    text: '#5273C6',
    label: 'Planned Baseline',
    glyph: '■',               // Square node / marker
    strokeWidth: 2.5,
  },

  // Actual: verified actual teal/green (#176B53)
  actual: {
    stroke: '#176B53',        // High-contrast verified actual
    fill: '#176B53',
    text: '#176B53',
    label: 'Verified Actual',
    glyph: '●',               // Solid circle node / marker
    strokeWidth: 3.5,
  },

  // Forecast: dashed violet series (#7055A4)
  forecast: {
    stroke: '#7055A4',        // Forecast accent violet
    strokeAlt: '#7055A4',     // Consistent violet marker
    dashArray: '5,4',         // Strictly dashed
    fill: '#FFFFFF',
    text: '#7055A4',
    label: 'Forecast Trajectory',
    glyph: '▲',               // Secondary triangle / dashed marker
    strokeWidth: 2.5,
  },

  // Variance / slip: (#A44339)
  variance: {
    stroke: '#A44339',
    fill: '#A44339',
    bg: '#FDEEED',
    border: '#FAC7C3',
    text: '#A44339',
    label: 'Variance / Slip',
    glyph: '✕',
    prefix: '-',
  },

  // Milestones: (#965E0D)
  milestone: {
    stroke: '#965E0D',
    fill: '#965E0D',
    bg: '#FEF4E6',
    border: '#FCD9A8',
    text: '#965E0D',
    label: 'Milestones',
    glyph: '◆',
  },

  // Positive: green (#176B53)
  positive: {
    stroke: '#176B53',
    fill: '#176B53',
    bg: '#E5F6EE',
    border: '#BCE7D2',
    text: '#176B53',
    label: 'Ahead of Schedule',
    glyph: '✓',
    prefix: '+',
  },

  // Warning / At Risk: amber (#965E0D)
  warning: {
    stroke: '#965E0D',
    fill: '#965E0D',
    bg: '#FEF4E6',
    border: '#FCD9A8',
    text: '#965E0D',
    label: 'Buffer Consumed',
    glyph: '▲',
    prefix: '▲',
  },

  // Critical / slip: (#A44339)
  critical: {
    stroke: '#A44339',
    fill: '#A44339',
    bg: '#FDEEED',
    border: '#FAC7C3',
    text: '#A44339',
    label: 'Critical Path Slip',
    glyph: '✕',
    prefix: '-',
  },

  // Neutral / Axis / Grid lines (#D6E1E9)
  neutral: {
    grid: '#D6E1E9',
    gridDark: '#1A2E42',
    axis: '#52687B',
    text: '#52687B',
    heading: '#1A2E42',
    bg: '#F4F7FB',
    border: '#D6E1E9',
    dataDate: '#1A2E42',
  },
} as const;

export type ChartTokens = typeof CHART_TOKENS;

/**
 * Multi-channel status descriptor ensuring color is NEVER used alone.
 * Always returns color + text label + accessibility glyph + formatted sign.
 */
export function getChartStatusDescriptor(
  value: number,
  type: 'variance' | 'delay' | 'completion'
): {
  color: string;
  bg: string;
  border: string;
  label: string;
  glyph: string;
  textDisplay: string;
} {
  if (type === 'variance') {
    if (value > 0) {
      return {
        color: CHART_TOKENS.positive.text,
        bg: CHART_TOKENS.positive.bg,
        border: CHART_TOKENS.positive.border,
        label: 'Ahead of Schedule',
        glyph: '✓',
        textDisplay: `+${value.toFixed(1)}% [✓ Ahead]`,
      };
    }
    if (value >= -5) {
      return {
        color: CHART_TOKENS.warning.text,
        bg: CHART_TOKENS.warning.bg,
        border: CHART_TOKENS.warning.border,
        label: 'Moderate Lag',
        glyph: '▲',
        textDisplay: `${value.toFixed(1)}% [▲ Buffer]`,
      };
    }
    return {
      color: CHART_TOKENS.critical.text,
      bg: CHART_TOKENS.critical.bg,
      border: CHART_TOKENS.critical.border,
      label: 'Critical Path Slip',
      glyph: '✕',
      textDisplay: `${value.toFixed(1)}% [✕ Critical]`,
    };
  }

  if (type === 'delay') {
    if (value <= 0) {
      return {
        color: CHART_TOKENS.positive.text,
        bg: CHART_TOKENS.positive.bg,
        border: CHART_TOKENS.positive.border,
        label: 'On Schedule / 0d Slip',
        glyph: '✓',
        textDisplay: '0 Days [✓ On Track]',
      };
    }
    if (value <= 2) {
      return {
        color: CHART_TOKENS.warning.text,
        bg: CHART_TOKENS.warning.bg,
        border: CHART_TOKENS.warning.border,
        label: 'Secondary Buffer Slip',
        glyph: '▲',
        textDisplay: `+${value}d [▲ Buffer Consumed]`,
      };
    }
    return {
      color: CHART_TOKENS.critical.text,
      bg: CHART_TOKENS.critical.bg,
      border: CHART_TOKENS.critical.border,
      label: 'Critical Path Slip (Zero Float)',
      glyph: '✕',
      textDisplay: `+${value}d [✕ Critical Path]`,
    };
  }

  // Completion / progress
  if (value >= 100) {
    return {
      color: CHART_TOKENS.positive.text,
      bg: CHART_TOKENS.positive.bg,
      border: CHART_TOKENS.positive.border,
      label: 'Completed',
      glyph: '✓',
      textDisplay: `${value.toFixed(0)}% [✓ Complete]`,
    };
  }
  return {
    color: CHART_TOKENS.planned.text,
    bg: '#F4F7FB',
    border: '#D6E1E9',
    label: 'In Progress',
    glyph: '●',
    textDisplay: `${value.toFixed(0)}% [● In Progress]`,
  };
}
