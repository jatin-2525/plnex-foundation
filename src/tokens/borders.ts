export const borders = {
  radius: {
    none: '0',
    sm: '4px',
    md: '6px',
    DEFAULT: '8px',
    lg: '10px',
    xl: '12px',
    full: '9999px',
  },
  width: {
    DEFAULT: '1px',
    2: '2px',
  },
} as const;

export type Borders = typeof borders;
