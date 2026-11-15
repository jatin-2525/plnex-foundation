import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Schedule Logic & System Health',
  description: 'DCMA 14-point schedule health diagnostics inspecting missing logic links, excessive constraints, negative float, and lead/lag integrity.',
};

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
