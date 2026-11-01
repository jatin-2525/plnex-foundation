/**
 * Standardized PLnEX Chart Colors & Visual Semantic Tokens
 *
 * Strict Design System Rules:
 * 1. Restrained Palette:
 *    - Planned:  neutral/primary (#0F6B68 / #E0EEF2)
 *    - Actual:   primary/semantic contrast (#2E7D5B)
 *    - Forecast: dashed neutral/secondary (#7B8798, dashArray: "5,4")
 *    - Positive: green (#2E7D5B)
 *    - Warning:  amber (#845006)
 *    - Critical: red (#A24335)
 * 2. Do not use random colors per page.
 * 3. Do not use gradients (flat, solid SVG fills and strokes only).
 * 4. Do not use 8–12 colors in one chart (max 3–4 restrained tokens per chart).
 * 5. Do not use color alone to communicate status:
 *    Every visualization MUST pair color with text labels, status glyphs (✓, ▲, ✕),
 *    stroke patterns (solid vs dashed), or numerical signs (+ / -).
 */

export const CHART_TOKENS = {
  // Planned: blue series (#5274B8)
  planned: {
    stroke: '#5274B8',        // Planned schedule baseline blue
    fill: '#EBF1FA',          // Soft blue fill for bars
    text: '#5274B8',
    label: 'Planned Baseline',
    glyph: '■',               // Square node / marker
    strokeWidth: 2.5,
  },

  // Actual: verified actual teal/green (#0D8879)
  actual: {
    stroke: '#0D8879',        // High-contrast verified actual
    fill: '#0D8879',
    text: '#0D8879',
    label: 'Verified Actual',
    glyph: '●',               // Solid circle node / marker
    strokeWidth: 3.5,
  },

  // Forecast: dashed violet series (#8057B7)
  forecast: {
    stroke: '#8057B7',        // Forecast accent violet
    strokeAlt: '#8057B7',     // Consistent violet marker
    dashArray: '5,4',         // Strictly dashed
    fill: '#FFFFFF',
    text: '#8057B7',
    label: 'Forecast Trajectory',
    glyph: '▲',               // Secondary triangle / dashed marker
    strokeWidth: 2.5,
  },

  // Variance / slip: (#A24335)
  variance: {
    stroke: '#A24335',
    fill: '#A24335',
    bg: '#FCE8E4',
    border: '#F6C7BE',
    text: '#A24335',
    label: 'Variance / Slip',
    glyph: '✕',
    prefix: '-',
  },

  // Milestones: (#C98925)
  milestone: {
    stroke: '#C98925',
    fill: '#C98925',
    bg: '#FFF1D3',
    border: '#F8DDA2',
    text: '#C98925',
    label: 'Milestones',
    glyph: '◆',
  },

  // Positive: green (#0D8879 / #176B53)
  positive: {
    stroke: '#0D8879',
    fill: '#0D8879',
    bg: '#E4F4EC',
    border: '#BDE4D0',
    text: '#176B53',
    label: 'Ahead of Schedule',
    glyph: '✓',
    prefix: '+',
  },

  // Warning: amber (#C98925 / #845006)
  warning: {
    stroke: '#C98925',
    fill: '#C98925',
    bg: '#FFF1D3',
    border: '#F8DDA2',
    text: '#845006',
    label: 'Buffer Consumed',
    glyph: '▲',
    prefix: '▲',
  },

  // Critical / slip: (#A24335)
  critical: {
    stroke: '#A24335',
    fill: '#A24335',
    bg: '#FCE8E4',
    border: '#F6C7BE',
    text: '#A24335',
    label: 'Critical Path Slip',
    glyph: '✕',
    prefix: '-',
  },

  // Neutral / Axis / Grid lines (#DFE7EE)
  neutral: {
    grid: '#DFE7EE',
    gridDark: '#142C3F',
    axis: '#526779',
    text: '#526779',
    heading: '#142C3F',
    bg: '#F3F6FA',
    border: '#D8E2EA',
    dataDate: '#142C3F',
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
    bg: '#F3F6FA',
    border: '#D8E2EA',
    label: 'In Progress',
    glyph: '●',
    textDisplay: `${value.toFixed(0)}% [● In Progress]`,
  };
}
