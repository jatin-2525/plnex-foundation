import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Site Engineer Workspace',
  description: 'Dedicated workspace for lead site engineers to track assigned workfronts, unverified field claims, and daily shift targets.',
};

export default function EngineerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
