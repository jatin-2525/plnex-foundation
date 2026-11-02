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
            page: '#F4F7FB',
            surface: '#FFFFFF',
            surfaceRaised: '#FFFFFF',
            surfaceSunken: '#EAF1F5',
            overlay: 'rgba(26, 46, 66, 0.4)'
          },
          text: {
            primary: '#1A2E42',
            secondary: '#52687B',
            muted: '#52687B',
            tertiary: '#52687B',
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
            planned: '#5273C6',
            actual: '#176B53',
            forecast: '#7055A4',
            warm: '#965E0D',
            link: '#4066C8'
          },
          status: {
            verified: '#176B53',
            verifiedBg: '#E5F6EE',
            verifiedBorder: '#BCE7D2',
            onTrack: '#176B53',
            onTrackBg: '#E5F6EE',
            onTrackBorder: '#BCE7D2',
            atRisk: '#965E0D',
            atRiskBg: '#FEF4E6',
            atRiskBorder: '#FCD9A8',
            delayed: '#A44339',
            delayedBg: '#FDEEED',
            delayedBorder: '#FAC7C3',
            blocked: '#7B2857',
            blockedBg: '#F8EAF1',
            blockedBorder: '#ECC4DA',
            pendingReview: '#3B55A3',
            pendingReviewBg: '#EBF2FF',
            pendingReviewBorder: '#C6D8FF',
            unmatched: '#52687B',
            unmatchedBg: '#EDF1F5',
            unmatchedBorder: '#D4DDE6',
            // Aliases
            success: '#176B53',
            successBg: '#E5F6EE',
            successBorder: '#BCE7D2',
            warning: '#965E0D',
            warningBg: '#FEF4E6',
            warningBorder: '#FCD9A8',
            critical: '#A44339',
            criticalBg: '#FDEEED',
            criticalBorder: '#FAC7C3',
            info: '#3B55A3',
            infoBg: '#EBF2FF',
            infoBorder: '#C6D8FF'
          },
          border: {
            default: '#D6E1E9',
            strong: '#52687B',
            focus: '#0F6B68',
            subtle: '#D6E1E9'
          },
          interactive: {
            hover: '#EAF1F5',
            active: '#D6E1E9',
            selected: '#EAF1F5',
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
        '2xs': '0 1px 2px 0 rgba(26, 46, 66, 0.04)',
        xs: '0 1px 2px 0 rgba(26, 46, 66, 0.05)',
        sm: '0 1px 3px 0 rgba(26, 46, 66, 0.08), 0 1px 2px -1px rgba(26, 46, 66, 0.04)',
        md: '0 4px 10px -1px rgba(26, 46, 66, 0.08), 0 2px 4px -2px rgba(26, 46, 66, 0.05)',
        lg: '0 8px 20px -3px rgba(26, 46, 66, 0.10), 0 3px 6px -3px rgba(26, 46, 66, 0.06)',
        xl: '0 12px 28px -4px rgba(26, 46, 66, 0.12)',
        '2xl': '0 16px 36px -4px rgba(26, 46, 66, 0.14)',
        card: '0 1px 3px 0 rgba(26, 46, 66, 0.07), 0 2px 8px -1px rgba(26, 46, 66, 0.06)',
        'card-hover': '0 6px 18px -2px rgba(26, 46, 66, 0.10), 0 3px 6px -2px rgba(26, 46, 66, 0.05)',
        overlay: '0 16px 32px -4px rgba(26, 46, 66, 0.16)',
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
