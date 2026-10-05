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
            surfaceSunken: '#F1F3F5',
            overlay: 'rgba(23, 32, 51, 0.4)'
          },
          text: {
            primary: '#172033',
            secondary: '#596579',
            muted: '#7B8798',
            tertiary: '#7B8798',
            disabled: '#A0ABBA',
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
            infoBg: '#EDF5F8',
            infoBorder: '#B3CBE0'
          },
          border: {
            default: '#D9DEE5',
            strong: '#7B8798',
            focus: '#176B87',
            subtle: '#E8EBF0'
          },
          interactive: {
            hover: '#F1F3F5',
            active: '#E8EBF0',
            selected: '#EDF5F8',
            selectedStrong: '#D6EBF0'
          }
        }
      },
      spacing: {
        'sidebar': '16.25rem', // 260px
        'sidebar-collapsed': '4rem', // 64px
        'header': '3.5rem', // 56px
        'gutter': '1.5rem',
      },
      maxWidth: {
        'content': '84rem',
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "'Helvetica Neue'", "Arial", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Cascadia Code'", "Consolas", "monospace"],
      },
      borderRadius: {
        none: '0',
        xs: '2px',
        sm: '4px',
        md: '6px',
        DEFAULT: '8px',
        lg: '8px',
        xl: '10px',
        '2xl': '10px',
        full: '9999px',
      },
      borderWidth: {
        DEFAULT: '1px',
        '2': '2px',
      },
      boxShadow: {
        none: 'none',
        xs: '0 1px 2px 0 rgba(23, 32, 51, 0.04)',
        sm: '0 1px 3px 0 rgba(23, 32, 51, 0.05), 0 1px 2px -1px rgba(23, 32, 51, 0.03)',
        md: '0 2px 4px -1px rgba(23, 32, 51, 0.06), 0 1px 2px -1px rgba(23, 32, 51, 0.04)',
        lg: '0 4px 8px -2px rgba(23, 32, 51, 0.08), 0 2px 4px -2px rgba(23, 32, 51, 0.04)',
        xl: '0 8px 16px -4px rgba(23, 32, 51, 0.1)',
        '2xl': '0 8px 16px -4px rgba(23, 32, 51, 0.1)',
        overlay: '0 12px 24px -4px rgba(23, 32, 51, 0.12)',
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
