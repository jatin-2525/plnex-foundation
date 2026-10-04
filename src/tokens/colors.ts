export const colors = {
  bg: {
    page: '#F7F8FA',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    surfaceSunken: '#F0F2F5',
    overlay: 'rgba(23, 32, 51, 0.5)',
  },
  text: {
    primary: '#172033',
    secondary: '#596579',
    tertiary: '#8A94A6',
    disabled: '#B0B8C9',
    inverse: '#FFFFFF',
    link: '#176B87',
  },
  accent: {
    primary: '#176B87',
    primaryHover: '#135A72',
    primaryActive: '#0F4A5E',
  },
  status: {
    success: '#2E7D5B',
    successBg: '#EDF7F2',
    successBorder: '#B8DCC9',
    warning: '#D98B32',
    warningBg: '#FDF6ED',
    warningBorder: '#F0D4A6',
    critical: '#B5473C',
    criticalBg: '#FBEFEE',
    criticalBorder: '#E4B0AA',
    info: '#3B6EA8',
    infoBg: '#EDF2F8',
    infoBorder: '#B3CBE0',
  },
  border: {
    default: '#D9DEE5',
    strong: '#B0B8C9',
    focus: '#176B87',
    subtle: '#E8EBF0',
  },
  interactive: {
    hover: '#F0F2F5',
    active: '#E8EBF0',
    selected: '#EDF5F8',
    selectedStrong: '#D6EBF0',
  },
} as const;

export type Colors = typeof colors;
