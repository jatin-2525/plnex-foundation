import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Settings',
  description: 'Global system configuration, integration thresholds, and audit logging parameters.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
