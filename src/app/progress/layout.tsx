import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'S-Curve & Progress Tracking',
  description: 'Earned Value Management (EVM) analytics featuring planned versus actual S-curves, monthly burn rates, and forecast completion dates.',
  openGraph: {
    title: 'S-Curve & Progress Tracking | PLnEX',
    description: 'Earned Value Management (EVM) analytics featuring planned versus actual S-curves, monthly burn rates, and forecast completion dates.',
    url: 'https://plnex.oilindia.in/progress/',
    type: 'website',
    images: [
      {
        url: '/og-progress.png',
        width: 1200,
        height: 630,
        alt: 'Earned Value Management S-curve chart comparing planned progress against verified actual field execution',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'S-Curve & Progress Tracking | PLnEX',
    description: 'Earned Value Management (EVM) analytics featuring planned versus actual S-curves, monthly burn rates, and forecast completion dates.',
    images: ['/og-progress.png'],
  },
};

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
