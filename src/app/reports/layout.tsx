import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Controls Reports & Exports',
  description: 'Executive project controls report generation portal for PDF, Excel, and CSV exports of monthly progress and variance records.',
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
