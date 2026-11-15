import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '../context/AppContext';
import { ThemeProvider } from '../context/ThemeContext';
import { PreferencesProvider } from '../context/PreferencesContext';
import { ToastProvider } from '../context/ToastContext';
import { NotificationProvider } from '../context/NotificationContext';
import { OfflineProvider } from '../context/OfflineContext';
import { AppShell } from '../components/shell/AppShell';
import { SettingsModal } from '../components/shell/SettingsModal';
import { GoogleAnalytics } from '../components/analytics/GoogleAnalytics';
import { CookieConsentBanner } from '../components/analytics/CookieConsentBanner';

export const metadata: Metadata = {
  metadataBase: new URL('https://plnex.oilindia.in'),
  title: {
    default: 'Enterprise Project Controls Platform | PLnEX',
    template: '%s | PLnEX',
  },
  description: 'Enterprise schedule linking, baseline variance tracking, and real-time field progress verification platform for Oil India Limited capital projects.',
  openGraph: {
    title: 'Enterprise Project Controls Platform | PLnEX',
    description: 'Enterprise schedule linking, baseline variance tracking, and real-time field progress verification platform for Oil India Limited capital projects.',
    url: 'https://plnex.oilindia.in',
    siteName: 'PLnEX — Project Controls & Planning',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PLnEX Enterprise Project Controls Platform - Planning to Execution Bridge interface banner',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Enterprise Project Controls Platform | PLnEX',
    description: 'Enterprise schedule linking, baseline variance tracking, and real-time field progress verification platform for Oil India Limited capital projects.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased font-sans transition-colors duration-150">
        <ThemeProvider>
          <PreferencesProvider>
            <AppProvider>
              <OfflineProvider>
                <ToastProvider>
                  <NotificationProvider>
                    <AppShell>{children}</AppShell>
                    <SettingsModal />
                    <CookieConsentBanner />
                  </NotificationProvider>
                </ToastProvider>
              </OfflineProvider>
            </AppProvider>
          </PreferencesProvider>
        </ThemeProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
