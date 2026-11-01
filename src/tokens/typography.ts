/**
 * Standardized PLnEX Typography System
 *
 * Strict Design Scale:
 * - Page Title:    28–32px (Manrope font-semibold or bold, tracking-tight, leading-tight)
 * - Section Title: 18–20px (Manrope font-semibold, tracking-tight, leading-snug)
 * - Card Title:    15–16px (Manrope font-medium to font-semibold, leading-snug)
 * - Body:          14–16px (Manrope font-normal, leading-normal)
 * - Dense Table:   at least 13px (Manrope, never smaller than 13px)
 * - Technical IDs: 12–13px (IBM Plex Mono font-mono, codes such as PIP-24-002 and WBS references)
 * - KPI:           28–32px (Manrope font-bold or font-semibold, leading-none)
 *
 * Palette Mappings:
 * - Main text: #142C3F
 * - Secondary text: #526779
 * - Brand / Primary: #0F6B68
 * - Borders: #D8E2EA
 * - Background: #F3F6FA
 */

export const TYPOGRAPHY_SCALE = {
  pageTitle: {
    min: '28px',
    max: '32px',
    lineHeight: '1.2',
    fontWeight: '600',
    color: '#142C3F',
    classes: 'text-[28px] sm:text-[30px] lg:text-[32px] font-semibold text-[#142C3F] tracking-tight leading-tight',
  },
  sectionTitle: {
    min: '18px',
    max: '20px',
    lineHeight: '1.35',
    fontWeight: '600',
    color: '#142C3F',
    classes: 'text-[18px] sm:text-[20px] font-semibold text-[#142C3F] tracking-tight leading-snug',
  },
  cardTitle: {
    min: '15px',
    max: '16px',
    lineHeight: '1.35',
    fontWeight: '500',
    color: '#142C3F',
    classes: 'text-[15px] sm:text-[16px] font-medium text-[#142C3F] leading-snug',
  },
  body: {
    size: '15px',
    lineHeight: '1.5',
    fontWeight: '400',
    color: '#142C3F',
    classes: 'text-[15px] text-[#142C3F] leading-normal font-normal',
  },
  secondary: {
    size: '13px',
    lineHeight: '1.4',
    fontWeight: '400',
    color: '#526779',
    classes: 'text-[13px] text-[#526779] leading-normal font-normal',
  },
  tableDense: {
    min: '13px',
    max: '14px',
    lineHeight: '1.4',
    fontWeight: '400',
    color: '#142C3F',
    classes: 'text-[13px] text-[#142C3F] leading-normal',
  },
  techId: {
    min: '12px',
    max: '13px',
    lineHeight: '1.3',
    fontWeight: '500',
    color: '#142C3F',
    classes: 'font-mono text-xs sm:text-[13px] text-[#142C3F]',
  },
  kpi: {
    min: '28px',
    max: '32px',
    lineHeight: '1.1',
    fontWeight: '700',
    color: '#142C3F',
    classes: 'text-[28px] sm:text-[30px] lg:text-[32px] font-bold font-sans text-[#142C3F] tracking-tight leading-none',
  },
} as const;

export const TYPOGRAPHY_CLASSES = {
  pageTitle: 'text-[28px] sm:text-[32px] font-semibold text-[#142C3F] tracking-tight leading-tight',
  sectionTitle: 'text-[18px] sm:text-[20px] font-semibold text-[#142C3F] tracking-tight leading-snug',
  cardTitle: 'text-[15px] sm:text-[16px] font-medium text-[#142C3F] leading-snug',
  body: 'text-[15px] text-[#142C3F] leading-normal font-normal',
  secondary: 'text-[13px] text-[#526779] leading-normal font-normal',
  tableDense: 'text-[13px] text-[#142C3F] leading-normal',
  techId: 'font-mono text-xs sm:text-[13px] text-[#142C3F]',
  kpi: 'text-[28px] sm:text-[32px] font-bold font-sans text-[#142C3F] tracking-tight leading-none',
  tableHeader: 'text-[12px] sm:text-[13px] font-semibold uppercase tracking-wider text-[#526779]',
  tableBody: 'text-[13px] sm:text-[14px] text-[#142C3F] leading-normal',
  tableSecondary: 'text-[13px] text-[#526779] leading-normal',
  tableMetadata: 'text-[12px] sm:text-[13px] font-mono text-[#526779]',
} as const;

export const typography = {
  fontFamily: {
    sans: "'Manrope', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "'IBM Plex Mono', 'Cascadia Code', Consolas, monospace",
  },
  fontSize: {
    xs: '0.75rem',         // 12px
    tableDense: '0.8125rem',// 13px
    body: '0.9375rem',     // 15px
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
