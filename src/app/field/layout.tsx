import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Field Operations Hub',
  description: 'Field supervisor coordination hub for shift logs, work package tracking, workforce readiness, and physical inspection sign-offs.',
};

export default function FieldLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
