import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Supervisor Review & Audit Queue',
  description: 'Supervisory verification queue for auditing contractor field claims, quantity overrides, and milestone payment approvals.',
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
