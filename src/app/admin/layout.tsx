import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administration Console',
  description: 'System administration dashboard for platform governance, tenant configuration, and security monitoring.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
