/**
 * Standardized PLnEX Chart Colors & Visual Semantic Tokens
 *
 * Strict Design System Rules:
 * 1. Restrained Palette:
 *    - Planned:  neutral/primary (#176B87 / #E0EEF2)
 *    - Actual:   primary/semantic contrast (#2E7D5B)
 *    - Forecast: dashed neutral/secondary (#7B8798, dashArray: "5,4")
 *    - Positive: green (#2E7D5B)
 *    - Warning:  amber (#D98B32)
 *    - Critical: red (#B5473C)
 * 2. Do not use random colors per page.
 * 3. Do not use gradients (flat, solid SVG fills and strokes only).
 * 4. Do not use 8–12 colors in one chart (max 3–4 restrained tokens per chart).
 * 5. Do not use color alone to communicate status:
 *    Every visualization MUST pair color with text labels, status glyphs (✓, ▲, ✕),
 *    stroke patterns (solid vs dashed), or numerical signs (+ / -).
 */

export const CHART_TOKENS = {
  // Planned: neutral / primary
  planned: {
    stroke: '#176B87',        // Primary Teal / Slate
    fill: '#E0EEF2',          // Soft primary background for bars
    text: '#176B87',
    label: 'Planned Baseline',
    glyph: '■',               // Square node / marker
    strokeWidth: 2.5,
  },

  // Actual: primary / semantic contrast
  actual: {
    stroke: '#2E7D5B',        // High-contrast semantic green
    fill: '#2E7D5B',
    text: '#2E7D5B',
    label: 'Verified Actual',
    glyph: '●',               // Solid circle node / marker
    strokeWidth: 3.5,
  },

  // Forecast: dashed neutral / secondary
  forecast: {
    stroke: '#7B8798',        // Neutral secondary slate
    strokeAlt: '#D98B32',     // Secondary amber-slate
    dashArray: '5,4',         // Strictly dashed
    fill: '#FFFFFF',
    text: '#596579',
    label: 'Forecast Trajectory',
    glyph: '▲',               // Secondary triangle / dashed marker
    strokeWidth: 2.5,
  },

  // Positive: green
  positive: {
    stroke: '#2E7D5B',
    fill: '#2E7D5B',
    bg: '#EDF7F2',
    border: '#B8DCC9',
    text: '#2E7D5B',
    label: 'Ahead of Schedule',
    glyph: '✓',
    prefix: '+',
  },

  // Warning: amber
  warning: {
    stroke: '#D98B32',
    fill: '#D98B32',
    bg: '#FDF6ED',
    border: '#F0D4A6',
    text: '#D98B32',
    label: 'Buffer Consumed',
    glyph: '▲',
    prefix: '▲',
  },

  // Critical: red
  critical: {
    stroke: '#B5473C',
    fill: '#B5473C',
    bg: '#FBEFEE',
    border: '#E4B0AA',
    text: '#B5473C',
    label: 'Critical Path Slip',
    glyph: '✕',
    prefix: '-',
  },

  // Neutral / Axis / Grid lines
  neutral: {
    grid: '#E5E9F0',
    gridDark: '#172033',
    axis: '#7B8798',
    text: '#596579',
    heading: '#172033',
    bg: '#F7F8FA',
    border: '#D9DEE5',
    dataDate: '#172033',
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
    bg: '#F7F8FA',
    border: '#D9DEE5',
    label: 'In Progress',
    glyph: '●',
    textDisplay: `${value.toFixed(0)}% [● In Progress]`,
  };
}
