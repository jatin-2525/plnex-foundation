import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        plnex: {
          bg: {
            page: '#F7F8FA',
            surface: '#FFFFFF',
            surfaceRaised: '#FFFFFF',
            surfaceSunken: '#F0F2F5',
            overlay: 'rgba(23, 32, 51, 0.5)'
          },
          text: {
            primary: '#172033',
            secondary: '#596579',
            tertiary: '#8A94A6',
            disabled: '#B0B8C9',
            inverse: '#FFFFFF',
            link: '#176B87'
          },
          accent: {
            primary: '#176B87',
            primaryHover: '#135A72',
            primaryActive: '#0F4A5E'
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
            infoBorder: '#B3CBE0'
          },
          border: {
            default: '#D9DEE5',
            strong: '#B0B8C9',
            focus: '#176B87',
            subtle: '#E8EBF0'
          },
          interactive: {
            hover: '#F0F2F5',
            active: '#E8EBF0',
            selected: '#EDF5F8',
            selectedStrong: '#D6EBF0'
          }
        }
      },
      spacing: {
        'sidebar': '15rem',
        'sidebar-collapsed': '3.75rem',
        'header': '3.5rem',
        'gutter': '1.5rem',
      },
      maxWidth: {
        'content': '84rem',
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "'Helvetica Neue'", "Arial", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Cascadia Code'", "Consolas", "monospace"],
      },
      fontSize: {
        xs: '0.6875rem',
        sm: '0.75rem',
        base: '0.8125rem',
        md: '0.875rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      borderRadius: {
        none: '0',
        sm: '4px',
        md: '6px',
        DEFAULT: '8px',
        lg: '10px',
        xl: '12px',
        full: '9999px',
      },
      borderWidth: {
        DEFAULT: '1px',
        '2': '2px',
      },
      boxShadow: {
        none: 'none',
        xs: '0 1px 2px 0 rgba(23, 32, 51, 0.04)',
        sm: '0 1px 3px 0 rgba(23, 32, 51, 0.06), 0 1px 2px -1px rgba(23, 32, 51, 0.04)',
        md: '0 4px 6px -1px rgba(23, 32, 51, 0.06), 0 2px 4px -2px rgba(23, 32, 51, 0.04)',
        lg: '0 10px 15px -3px rgba(23, 32, 51, 0.06), 0 4px 6px -4px rgba(23, 32, 51, 0.04)',
        overlay: '0 16px 32px -4px rgba(23, 32, 51, 0.12)',
      },
      lineHeight: {
        tight: '1.2',
        snug: '1.35',
        normal: '1.5',
        relaxed: '1.625'
      }
    },
  },
  plugins: [],
};
export default config;
