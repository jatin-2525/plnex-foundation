/**
 * PLnEX 8px Spacing System Design Tokens
 *
 * Spacing Scale:
 *   - 8px  (Tailwind 2)  - Micro gaps (icons, labels, compact items)
 *   - 16px (Tailwind 4)  - Standard card padding, interior gaps, input spacing
 *   - 24px (Tailwind 6)  - Section gaps, major card padding, page gutters
 *   - 32px (Tailwind 8)  - Macro gaps between major modules
 *   - 40px (Tailwind 10) - Extended module separation
 *   - 48px (Tailwind 12) - Page bottom clearance, major break points
 *
 * Target: Dense but breathable.
 */

export const SPACING_SYSTEM_8PX = {
  grid: 8,
  scale: {
    xs: '0.5rem',  // 8px  (Tailwind 2)
    sm: '1rem',    // 16px (Tailwind 4)
    md: '1.5rem',  // 24px (Tailwind 6)
    lg: '2rem',    // 32px (Tailwind 8)
    xl: '2.5rem',  // 40px (Tailwind 10)
    '2xl': '3rem', // 48px (Tailwind 12)
  },
  layout: {
    pagePadding: '1.5rem',       // 24px (p-4 md:p-6)
    pageBottomPadding: '3rem',   // 48px (pb-12)
    sectionGap: '1.5rem',        // 24px (space-y-6, gap-6)
    cardPadding: '1rem',         // 16px (p-4)
    cardPaddingLarge: '1.5rem',   // 24px (p-6)
    cardInternalGap: '1rem',     // 16px (space-y-4, gap-4)
    elementGap: '0.5rem',        // 8px  (space-y-2, gap-2)
    microGap: '0.25rem',         // 4px  (space-y-1, gap-1)
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px (micro step for borders & badges)
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  layout: {
    sidebarWidth: '15.5rem',       // 248px
    sidebarCollapsed: '4rem',      // 64px
    headerHeight: '3.5rem',        // 56px (14)
    pageGutter: '1.5rem',          // 24px (p-6)
    contentMaxWidth: '90rem',      // 1440px
  },
} as const;

export type Spacing = typeof spacing;
