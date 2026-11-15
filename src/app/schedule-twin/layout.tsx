import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '4D Schedule Digital Twin',
  description: 'Dynamic CPM digital twin synchronizing physical field progress with Primavera P6 baseline logic and automated variance detection.',
  openGraph: {
    title: '4D Schedule Digital Twin | PLnEX',
    description: 'Dynamic CPM digital twin synchronizing physical field progress with Primavera P6 baseline logic and automated variance detection.',
    url: 'https://plnex.oilindia.in/schedule-twin/',
    type: 'website',
    images: [
      {
        url: '/og-schedule.png',
        width: 1200,
        height: 630,
        alt: 'Interactive CPM Gantt schedule and 4D digital twin showing critical path logic and activity float',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '4D Schedule Digital Twin | PLnEX',
    description: 'Dynamic CPM digital twin synchronizing physical field progress with Primavera P6 baseline logic and automated variance detection.',
    images: ['/og-schedule.png'],
  },
};

export default function ScheduleTwinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
