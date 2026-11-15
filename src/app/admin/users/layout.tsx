import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Management',
  description: 'Enterprise user directory and role-based access control management console.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminUsersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
