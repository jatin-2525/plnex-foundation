export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(23, 32, 51, 0.04)',
  sm: '0 1px 3px 0 rgba(23, 32, 51, 0.06), 0 1px 2px -1px rgba(23, 32, 51, 0.04)',
  md: '0 4px 6px -1px rgba(23, 32, 51, 0.06), 0 2px 4px -2px rgba(23, 32, 51, 0.04)',
  lg: '0 10px 15px -3px rgba(23, 32, 51, 0.06), 0 4px 6px -4px rgba(23, 32, 51, 0.04)',
  overlay: '0 16px 32px -4px rgba(23, 32, 51, 0.12)',
} as const;

export type Shadows = typeof shadows;
