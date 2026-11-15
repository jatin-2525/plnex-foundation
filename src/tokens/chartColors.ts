/**
 * Standardized PLnEX Chart Colors & Visual Semantic Tokens
 * "Mineral + Evergreen" Direction
 *
 * Strict Design System Rules:
 * 1. Series Colors:
 *    - Planned baseline: Teal (#006B61 light / #72C6AD dark, glyph: ■)
 *    - Verified actual:  Copper (#AC4B31 light / #E58567 dark, glyph: ●)
 *    - Forecast:         Dashed Amber (#D99B26 light / #E9C46A dark, dashArray: "5,4", glyph: ▲)
 *    - Variance:         Copper (#AC4B31 light / #E58567 dark, glyph: ▼)
 * 2. WCAG 2.2 Level AA Contrast compliant in both themes.
 * 3. Never use color alone: pair with labels, markers, or dashed patterns.
 * 4. Subtle readable grids and axes in both themes (#D9E2DA light / #3A5146 dark).
 */

export const CHART_TOKENS_LIGHT = {
  planned: {
    stroke: '#006B61',         // Teal planned baseline
    fill: '#E4F1E9',
    text: '#006B61',
    label: 'Planned Baseline',
    glyph: '■',
    strokeWidth: 2.5,
  },
  actual: {
    stroke: '#AC4B31',         // Copper verified actual
    fill: '#AC4B31',
    text: '#AC4B31',
    label: 'Verified Actual',
    glyph: '●',
    strokeWidth: 3.5,
  },
  forecast: {
    stroke: '#D99B26',         // Amber forecast trajectory
    strokeAlt: '#E5C185',
    dashArray: '5,4',
    fill: '#FFFFFF',
    text: '#825700',
    label: 'Forecast Trajectory',
    glyph: '▲',
    strokeWidth: 2.5,
  },
  variance: {
    stroke: '#AC4B31',
    fill: '#AC4B31',
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
    bg: '#F6F7F3',
    heading: '#1A2B25',
    text: '#52665D',
    border: '#D9E2DA',
  },
  grid: '#D9E2DA',
  textMuted: '#52665D',
  surface: '#FFFFFF',
  dataDateLine: '#1A2B25',
  forecastZoneBg: '#F6F7F3',
};

export const CHART_TOKENS_DARK = {
  planned: {
    stroke: '#72C6AD',         // Teal planned baseline (dark)
    fill: '#20353A',
    text: '#72C6AD',
    label: 'Planned Baseline',
    glyph: '■',
    strokeWidth: 2.5,
  },
  actual: {
    stroke: '#E58567',         // Copper verified actual (dark)
    fill: '#E58567',
    text: '#E58567',
    label: 'Verified Actual',
    glyph: '●',
    strokeWidth: 3.5,
  },
  forecast: {
    stroke: '#E9C46A',         // Amber forecast trajectory (dark)
    strokeAlt: '#E9C46A',
    dashArray: '5,4',
    fill: '#17221D',
    text: '#F3D27E',
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
    bg: '#17221D',
    heading: '#F2F4E9',
    text: '#B5C1B5',
    border: '#3A5146',
  },
  grid: '#3A5146',
  textMuted: '#B5C1B5',
  surface: '#17221D',
  dataDateLine: '#F2F4E9',
  forecastZoneBg: '#101815',
};

// Default export uses light tokens for direct access
export const CHART_TOKENS = CHART_TOKENS_LIGHT;
