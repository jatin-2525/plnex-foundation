import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Capital Projects Registry',
  description: 'Comprehensive registry of Oil India exploration, drilling, pipeline, and refinery development projects with real-time budget and schedule status.',
  openGraph: {
    title: 'Capital Projects Registry | PLnEX',
    description: 'Comprehensive registry of Oil India exploration, drilling, pipeline, and refinery development projects with real-time budget and schedule status.',
    url: 'https://plnex.oilindia.in/projects/',
    type: 'website',
    images: [
      {
        url: '/og-projects.png',
        width: 1200,
        height: 630,
        alt: 'Oil India Limited capital infrastructure projects directory with budget and schedule completion statuses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Capital Projects Registry | PLnEX',
    description: 'Comprehensive registry of Oil India exploration, drilling, pipeline, and refinery development projects with real-time budget and schedule status.',
    images: ['/og-projects.png'],
  },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
