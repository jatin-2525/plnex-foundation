import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Progress Report (DPR) Logs',
  description: 'Official shift-end Daily Progress Reports containing weather logs, equipment operational hours, workforce tallies, and sign-offs.',
};

export default function FieldDprLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
