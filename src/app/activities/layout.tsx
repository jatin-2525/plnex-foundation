import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Activity Directory & WBS Tracker',
  description: 'Master Work Breakdown Structure (WBS) activity log detailing planned versus actual quantities, float values, and contractor scope.',
};

export default function ActivitiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
