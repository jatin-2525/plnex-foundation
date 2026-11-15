import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Executive Portfolio Dashboard',
  description: 'Executive portfolio overview of active capital projects, milestone completions, overall schedule health, and critical path variances.',
  openGraph: {
    title: 'Executive Portfolio Dashboard | PLnEX',
    description: 'Executive portfolio overview of active capital projects, milestone completions, overall schedule health, and critical path variances.',
    url: 'https://plnex.oilindia.in/dashboard/',
    type: 'website',
    images: [
      {
        url: '/og-dashboard.png',
        width: 1200,
        height: 630,
        alt: 'PLnEX Executive Portfolio Dashboard showing project health scores, milestones, and variance indicators',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Executive Portfolio Dashboard | PLnEX',
    description: 'Executive portfolio overview of active capital projects, milestone completions, overall schedule health, and critical path variances.',
    images: ['/og-dashboard.png'],
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
