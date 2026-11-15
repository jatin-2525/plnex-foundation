import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Access Restricted',
  description: 'Restricted permission notice for unauthorized roles or missing security clearance.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccessDeniedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
