import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Communications & Field Notices',
  description: 'Unified messaging channel for engineering clarifications, delay notifications, site change directives, and safety alerts.',
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
