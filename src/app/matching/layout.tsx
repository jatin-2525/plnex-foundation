import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Schedule Linking & Mapping Engine',
  description: 'Automated schedule linking engine mapping unstructured field progress notes to formal Primavera P6 and SAP WBS line items.',
};

export default function MatchingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
