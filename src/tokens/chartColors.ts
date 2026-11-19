/**
 * Standardized PLnEX Chart Colors & Visual Semantic Tokens
 * "Evergreen, Mineral + Warm Neutral" Direction
 *
 * Strict Design System Rules:
 * 1. Series Colors:
 *    - Planned baseline: Warm gold (#C8963E light / #E5C185 dark, glyph: ■)
 *    - Verified actual:  Mint (#08786A light / #72C6AD dark, glyph: ●)
 *    - Forecast:         Dashed Muted Lavender (#7872A8 light / #A9A3D8 dark, dashArray: "5,4", glyph: ▲)
 *    - Variance:         Warm Accent / Critical (#C7522A light / #FF9E94 dark, glyph: ▼)
 * 2. WCAG 2.2 Level AA Contrast compliant in both themes.
 * 3. Never use color alone: pair with labels, markers, or dashed patterns.
 * 4. Subtle readable grids and axes in both themes (#D9E2DA light / #3A5146 dark).
 */

export const CHART_TOKENS_LIGHT = {
  planned: {
    stroke: '#C8963E',         // Warm gold planned baseline
    fill: '#FBF5E8',
    text: '#825700',
    label: 'Planned Baseline',
    glyph: '■',
    strokeWidth: 2.5,
  },
  actual: {
    stroke: '#08786A',         // Mint verified actual
    fill: '#08786A',
    text: '#08786A',
    label: 'Verified Actual',
    glyph: '●',
    strokeWidth: 3.5,
  },
  forecast: {
    stroke: '#7872A8',         // Muted lavender forecast trajectory
    strokeAlt: '#A9A3D8',
    dashArray: '5,4',
    fill: '#F4F3FA',
    text: '#544E85',
    label: 'Forecast Trajectory',
    glyph: '▲',
    strokeWidth: 2.5,
  },
  variance: {
    stroke: '#C7522A',
    fill: '#C7522A',
    bg: '#F6E4E1',
    border: '#DCABA7',
    text: '#A43B36',
    label: 'Variance / Slip',
    glyph: '▼',
  },
  critical: {
    fill: '#A43B36',
    stroke: '#A43B36',
    bg: '#F6E4E1',
    border: '#DCABA7',
    text: '#A43B36',
  },
  positive: {
    fill: '#1F6B4E',
    stroke: '#1F6B4E',
    bg: '#E4F1E9',
    border: '#B7DAC3',
    text: '#1F6B4E',
  },
  warning: {
    fill: '#825700',
    stroke: '#825700',
    bg: '#F8EFDA',
    border: '#E5C185',
    text: '#825700',
  },
  neutral: {
    grid: '#D9E2DA',
    bg: '#F5F7F3',
    heading: '#182920',
    text: '#52665D',
    border: '#D9E2DA',
  },
  grid: '#D9E2DA',
  textMuted: '#52665D',
  surface: '#FFFFFF',
  dataDateLine: '#182920',
  forecastZoneBg: '#F5F7F3',
};

export const CHART_TOKENS_DARK = {
  planned: {
    stroke: '#E5C185',         // Warm gold planned baseline (dark)
    fill: '#3D2D14',
    text: '#E5C185',
    label: 'Planned Baseline',
    glyph: '■',
    strokeWidth: 2.5,
  },
  actual: {
    stroke: '#72C6AD',         // Mint verified actual (dark)
    fill: '#72C6AD',
    text: '#72C6AD',
    label: 'Verified Actual',
    glyph: '●',
    strokeWidth: 3.5,
  },
  forecast: {
    stroke: '#A9A3D8',         // Muted lavender forecast trajectory (dark)
    strokeAlt: '#C7C2EA',
    dashArray: '5,4',
    fill: '#28253D',
    text: '#A9A3D8',
    label: 'Forecast Trajectory',
    glyph: '▲',
    strokeWidth: 2.5,
  },
  variance: {
    stroke: '#FF9E94',
    fill: '#FF9E94',
    bg: '#3B2422',
    border: '#5B3734',
    text: '#FF9E94',
    label: 'Variance / Slip',
    glyph: '▼',
  },
  critical: {
    fill: '#FF9E94',
    stroke: '#FF9E94',
    bg: '#3B2422',
    border: '#5B3734',
    text: '#FF9E94',
  },
  positive: {
    fill: '#9AD5AF',
    stroke: '#9AD5AF',
    bg: '#20382C',
    border: '#315442',
    text: '#9AD5AF',
  },
  warning: {
    fill: '#F3D27E',
    stroke: '#F3D27E',
    bg: '#3A3120',
    border: '#5B4A2B',
    text: '#F3D27E',
  },
  neutral: {
    grid: '#3A5146',
    bg: '#101815',
    heading: '#F2F4E9',
    text: '#B5C1B5',
    border: '#3A5146',
  },
  grid: '#3A5146',
  textMuted: '#B5C1B5',
  surface: '#17221D',
  dataDateLine: '#72C6AD',
  forecastZoneBg: '#131F1A',
};

export const CHART_TOKENS = CHART_TOKENS_LIGHT;
