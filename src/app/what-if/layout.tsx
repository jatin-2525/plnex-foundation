import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scenario Planner & What-If Simulation',
  description: 'Predictive forward-pass simulation sandbox testing delay recoveries, resource shifts, and acceleration schedules.',
};

export default function WhatIfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
