import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
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
            page: 'var(--background)',
            surface: 'var(--surface)',
            surfaceRaised: 'var(--surface-raised)',
            surfaceSunken: 'var(--surface-sunken)',
            sidebar: 'var(--hero-anchor)',
          },
          text: {
            primary: 'var(--foreground)',
            secondary: 'var(--muted)',
            muted: 'var(--muted)',
            tertiary: 'var(--subtle)',
            link: 'var(--link)',
          },
          accent: {
            primary: 'var(--primary)',
            primaryHover: 'var(--primary-hover)',
            primaryActive: 'var(--primary-active)',
            warm: 'var(--accent-warm)',
            brass: 'var(--accent-brass)',
          },
          brand: {
            primary: 'var(--primary)',
            planned: 'var(--planned)',
            actual: 'var(--actual)',
            forecast: 'var(--forecast)',
            link: 'var(--link)',
            warm: 'var(--accent-warm)',
            brass: 'var(--accent-brass)',
          },
          border: {
            default: 'var(--border)',
            strong: 'var(--border-strong)',
            focus: 'var(--primary)',
            subtle: 'var(--border)',
          },
        },
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
        heading: ["'IBM Plex Sans'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
        sans: ["'IBM Plex Sans'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "'Cascadia Code'", "Consolas", "monospace"],
      },
      fontSize: {
        'page-title': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }], // 30px
        'section-heading': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }], // 20px
        'body': ['0.9375rem', { lineHeight: '1.5rem', fontWeight: '400' }], // 15px (desktop >= 14px)
        'table-dense': ['0.8125rem', { lineHeight: '1.25rem', fontWeight: '500' }], // 13px
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
        '2xl': '12px',
        full: '9999px',
      },
      boxShadow: {
        none: 'none',
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        md: '0 4px 10px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        lg: '0 8px 20px -3px rgba(0, 0, 0, 0.10), 0 3px 6px -3px rgba(0, 0, 0, 0.06)',
        xl: '0 12px 28px -4px rgba(0, 0, 0, 0.12)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 6px 18px -2px rgba(0, 0, 0, 0.08), 0 3px 6px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
