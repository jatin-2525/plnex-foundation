import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Organization Management',
  description: 'Multi-tenant organization and contractor partner governance portal.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminOrganizationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
