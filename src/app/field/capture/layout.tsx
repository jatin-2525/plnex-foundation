import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Field Progress Measurement',
  description: 'Mobile-optimized field measurement portal for logging daily quantities installed, inspection notes, and GPS-tagged site media.',
};

export default function FieldCaptureLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
