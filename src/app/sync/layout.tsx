import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Primavera P6 & ERP Integration Sync',
  description: 'Bidirectional synchronization engine connecting field progress with Primavera P6 EPPM, SAP S/4HANA, and offline caches.',
};

export default function SyncLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
