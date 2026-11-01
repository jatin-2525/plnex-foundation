import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '../context/AppContext';
import { ToastProvider } from '../context/ToastContext';
import { NotificationProvider } from '../context/NotificationContext';
import { OfflineProvider } from '../context/OfflineContext';
import { AppShell } from '../components/shell/AppShell';

export const metadata: Metadata = {
  title: 'PLnEX — Planning-to-Execution Bridge | Oil India Limited',
  description: 'Enterprise schedule linking and real-time actual progress tracking platform for infrastructure project controls.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F3F6FA] text-[#142C3F] antialiased font-sans">
        <AppProvider>
          <OfflineProvider>
            <ToastProvider>
              <NotificationProvider>
                <AppShell>{children}</AppShell>
              </NotificationProvider>
            </ToastProvider>
          </OfflineProvider>
        </AppProvider>
      </body>
    </html>
  );
}
