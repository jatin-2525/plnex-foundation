import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Risk Matrix & Delay Management',
  description: 'Quantitative project risk registry and delay impact matrix monitoring float consumption, weather disruptions, and mitigation pathways.',
  openGraph: {
    title: 'Risk Matrix & Delay Management | PLnEX',
    description: 'Quantitative project risk registry and delay impact matrix monitoring float consumption, weather disruptions, and mitigation pathways.',
    url: 'https://plnex.oilindia.in/risks/',
    type: 'website',
    images: [
      {
        url: '/og-risks.png',
        width: 1200,
        height: 630,
        alt: 'Project delay impact matrix and risk register showing critical float consumption',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Risk Matrix & Delay Management | PLnEX',
    description: 'Quantitative project risk registry and delay impact matrix monitoring float consumption, weather disruptions, and mitigation pathways.',
    images: ['/og-risks.png'],
  },
};

export default function RisksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
