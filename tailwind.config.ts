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
            page: '#F3F6FA',
            surface: '#FFFFFF',
            surfaceRaised: '#FFFFFF',
            surfaceSunken: '#EAF0F5',
            overlay: 'rgba(20, 44, 63, 0.4)'
          },
          text: {
            primary: '#142C3F',
            secondary: '#526779',
            muted: '#526779',
            tertiary: '#526779',
            disabled: '#A0ABBA',
            inverse: '#FFFFFF',
            link: '#4066C8'
          },
          accent: {
            primary: '#0F6B68',
            primaryHover: '#0C5754',
            primaryActive: '#094341'
          },
          brand: {
            primary: '#0F6B68',
            link: '#4066C8',
            warm: '#C98925',
            forecast: '#8057B7'
          },
          status: {
            verified: '#176B53',
            verifiedBg: '#E4F4EC',
            verifiedBorder: '#BDE4D0',
            onTrack: '#176F7A',
            onTrackBg: '#E2F2F4',
            onTrackBorder: '#BCE1E5',
            atRisk: '#845006',
            atRiskBg: '#FFF1D3',
            atRiskBorder: '#F8DDA2',
            delayed: '#A24335',
            delayedBg: '#FCE8E4',
            delayedBorder: '#F6C7BE',
            blocked: '#8D3143',
            blockedBg: '#F8E6EA',
            blockedBorder: '#EEC4CE',
            pendingReview: '#3B55A3',
            pendingReviewBg: '#E9EEFF',
            pendingReviewBorder: '#C5D2FC',
            unmatched: '#66528F',
            unmatchedBg: '#F0EBF8',
            unmatchedBorder: '#DACFF0',
            // Aliases
            success: '#176B53',
            successBg: '#E4F4EC',
            successBorder: '#BDE4D0',
            warning: '#845006',
            warningBg: '#FFF1D3',
            warningBorder: '#F8DDA2',
            critical: '#A24335',
            criticalBg: '#FCE8E4',
            criticalBorder: '#F6C7BE',
            info: '#3B55A3',
            infoBg: '#E9EEFF',
            infoBorder: '#C5D2FC'
          },
          border: {
            default: '#D8E2EA',
            strong: '#526779',
            focus: '#0F6B68',
            subtle: '#D8E2EA'
          },
          interactive: {
            hover: '#EAF0F5',
            active: '#D8E2EA',
            selected: '#EAF0F5',
            selectedStrong: '#DCE7EE'
          }
        }
      },
      spacing: {
        'sidebar': '15.5rem', // 248px
        'sidebar-collapsed': '4rem', // 64px
        'header': '3.5rem', // 56px
      },
      maxWidth: {
        'content': '84rem',
      },
      fontFamily: {
        sans: ["'Manrope'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        mono: ["'IBM Plex Mono'", "'Cascadia Code'", "Consolas", "monospace"],
      },
      fontSize: {
        'page-title': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }], // 30px (28-32px)
        'section-heading': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }], // 20px (18-20px)
        'body': ['0.9375rem', { lineHeight: '1.5rem', fontWeight: '400' }], // 15px (14-16px)
        'table-dense': ['0.8125rem', { lineHeight: '1.25rem', fontWeight: '500' }], // 13px (at least 13px)
        'tech-id': ['0.8125rem', { lineHeight: '1.25rem', fontWeight: '600' }], // 13px IBM Plex Mono
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
