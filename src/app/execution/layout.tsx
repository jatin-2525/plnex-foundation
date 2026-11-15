import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Field Execution & Milestones',
  description: 'Live site execution intelligence monitoring active workfront telemetry, daily milestone completions, and contractor productivity.',
};

export default function ExecutionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
