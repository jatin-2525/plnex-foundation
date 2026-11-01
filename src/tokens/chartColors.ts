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
  // Planned: blue series (#3D73B5)
  planned: {
    stroke: '#3D73B5',        // Planned schedule blue
    fill: '#EDF5FC',          // Soft blue fill for bars
    text: '#3D73B5',
    label: 'Planned Target',
    glyph: '■',               // Square node / marker
    strokeWidth: 2.5,
  },

  // Actual: verified teal/green (#187A6A)
  actual: {
    stroke: '#187A6A',        // High-contrast verified teal
    fill: '#187A6A',
    text: '#187A6A',
    label: 'Verified Actual',
    glyph: '●',               // Solid circle node / marker
    strokeWidth: 3.5,
  },

  // Forecast: dashed violet series (#7655A6)
  forecast: {
    stroke: '#7655A6',        // Forecast violet
    strokeAlt: '#7655A6',     // Consistent violet marker
    dashArray: '5,4',         // Strictly dashed
    fill: '#FFFFFF',
    text: '#7655A6',
    label: 'Forecast Trajectory',
    glyph: '▲',               // Secondary triangle / dashed marker
    strokeWidth: 2.5,
  },

  // Positive: green (#187A6A)
  positive: {
    stroke: '#187A6A',
    fill: '#187A6A',
    bg: '#E8F5F2',
    border: '#B1DBD2',
    text: '#105B4F',
    label: 'Ahead of Schedule',
    glyph: '✓',
    prefix: '+',
  },

  // Warning: amber (#9C5A08)
  warning: {
    stroke: '#9C5A08',
    fill: '#9C5A08',
    bg: '#FDF6ED',
    border: '#F0D4A6',
    text: '#7B4504',
    label: 'Buffer Consumed',
    glyph: '▲',
    prefix: '▲',
  },

  // Critical: red (#B43D47)
  critical: {
    stroke: '#B43D47',
    fill: '#B43D47',
    bg: '#FBEFEE',
    border: '#E8B6BA',
    text: '#922E37',
    label: 'Critical Path Slip',
    glyph: '✕',
    prefix: '-',
  },

  // Neutral / Axis / Grid lines
  neutral: {
    grid: '#E2EAF0',
    gridDark: '#172B3A',
    axis: '#526779',
    text: '#526779',
    heading: '#172B3A',
    bg: '#F4F7FA',
    border: '#D7E1E8',
    dataDate: '#172B3A',
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
