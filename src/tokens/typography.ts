/**
 * Standardized PLnEX Typography System
 *
 * Strict Design Scale:
 * - Page Title:    28–32px (font-semibold, tracking-tight, leading-tight)
 * - Section Title: 18–20px (font-semibold, tracking-tight, leading-snug)
 * - Card Title:    15–16px (font-medium to font-semibold, leading-snug)
 * - Body:          14px    (font-normal, leading-normal)
 * - Secondary:     13px    (font-normal, leading-normal)
 * - Metadata:      11–12px (font-normal to font-medium, leading-tight)
 * - KPI:           26–32px (font-bold or font-semibold, font-mono, leading-none)
 *
 * Hierarchy & Accessibility Rules:
 * 1. Use Inter across all pages and components.
 * 2. Do NOT make every heading bold: use size, color, and medium/semibold weights to create hierarchy.
 * 3. Avoid excessive bolding (no gratuitous font-black or font-extrabold).
 * 4. Table body text must be readable 14px body or 13px secondary, never tiny 10–12px cells.
 * 5. High-contrast typography: #172033 (primary), #596579 (secondary), #7B8798 (metadata).
 */

export const TYPOGRAPHY_SCALE = {
  pageTitle: {
    min: '28px',
    max: '32px',
    lineHeight: '1.2',
    fontWeight: '600',
    color: '#172033',
    classes: 'text-[28px] sm:text-[30px] lg:text-[32px] font-semibold text-[#172033] tracking-tight leading-tight',
  },
  sectionTitle: {
    min: '18px',
    max: '20px',
    lineHeight: '1.35',
    fontWeight: '600',
    color: '#172033',
    classes: 'text-[18px] sm:text-[20px] font-semibold text-[#172033] tracking-tight leading-snug',
  },
  cardTitle: {
    min: '15px',
    max: '16px',
    lineHeight: '1.35',
    fontWeight: '500',
    color: '#172033',
    classes: 'text-[15px] sm:text-[16px] font-medium text-[#172033] leading-snug',
  },
  body: {
    size: '14px',
    lineHeight: '1.5',
    fontWeight: '400',
    color: '#172033',
    classes: 'text-[14px] text-[#172033] leading-normal font-normal',
  },
  secondary: {
    size: '13px',
    lineHeight: '1.4',
    fontWeight: '400',
    color: '#596579',
    classes: 'text-[13px] text-[#596579] leading-normal font-normal',
  },
  metadata: {
    min: '11px',
    max: '12px',
    lineHeight: '1.35',
    fontWeight: '400',
    color: '#596579',
    classes: 'text-[11px] sm:text-[12px] text-[#596579] leading-tight font-normal',
  },
  kpi: {
    min: '26px',
    max: '32px',
    lineHeight: '1.1',
    fontWeight: '700',
    color: '#172033',
    classes: 'text-[28px] sm:text-[30px] lg:text-[32px] font-bold font-mono text-[#172033] tracking-tight leading-none',
  },
} as const;

export const TYPOGRAPHY_CLASSES = {
  pageTitle: 'text-[28px] sm:text-[30px] font-semibold text-[#172033] tracking-tight leading-tight',
  sectionTitle: 'text-[18px] sm:text-[20px] font-semibold text-[#172033] tracking-tight leading-snug',
  cardTitle: 'text-[15px] sm:text-[16px] font-medium text-[#172033] leading-snug',
  body: 'text-[14px] text-[#172033] leading-normal font-normal',
  secondary: 'text-[13px] text-[#596579] leading-normal font-normal',
  metadata: 'text-[11px] sm:text-[12px] text-[#596579] leading-tight font-normal',
  kpi: 'text-[28px] sm:text-[30px] font-bold font-mono text-[#172033] tracking-tight leading-none',
  tableHeader: 'text-[11px] sm:text-[12px] font-semibold uppercase tracking-wider text-[#596579]',
  tableBody: 'text-[14px] text-[#172033] leading-normal',
  tableSecondary: 'text-[13px] text-[#596579] leading-normal',
  tableMetadata: 'text-[11px] sm:text-[12px] font-mono text-[#7B8798]',
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
  },
  fontSize: {
    metadata: '0.6875rem', // 11px
    xs: '0.75rem',         // 12px
    secondary: '0.8125rem',// 13px
    body: '0.875rem',      // 14px
    cardTitle: '1rem',     // 16px
    sectionTitle: '1.25rem',// 20px
    kpi: '1.75rem',        // 28px
    pageTitle: '1.875rem', // 30px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.2',
    snug: '1.35',
    normal: '1.5',
    relaxed: '1.625',
  },
  letterSpacing: {
    tight: '-0.01em',
    normal: '0',
    wide: '0.01em',
    wider: '0.04em',
    widest: '0.08em',
  },
} as const;

export type Typography = typeof typography;
export type TypographyScale = typeof TYPOGRAPHY_SCALE;
