import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Master Gantt & Baseline Schedule',
  description: 'Interactive Critical Path Method (CPM) Gantt schedule displaying project baselines, active delay chains, and activity dependencies.',
  openGraph: {
    title: 'Master Gantt & Baseline Schedule | PLnEX',
    description: 'Interactive Critical Path Method (CPM) Gantt schedule displaying project baselines, active delay chains, and activity dependencies.',
    url: 'https://plnex.oilindia.in/schedule/',
    type: 'website',
    images: [
      {
        url: '/og-schedule.png',
        width: 1200,
        height: 630,
        alt: 'Interactive CPM Gantt schedule and critical path logic network visualization',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Master Gantt & Baseline Schedule | PLnEX',
    description: 'Interactive Critical Path Method (CPM) Gantt schedule displaying project baselines, active delay chains, and activity dependencies.',
    images: ['/og-schedule.png'],
  },
};

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
