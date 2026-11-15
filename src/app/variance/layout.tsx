import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Baseline Variance & Delay Analysis',
  description: 'Root-cause variance tracking and critical path slippage analytics comparing engineering, procurement, and construction baselines.',
  openGraph: {
    title: 'Baseline Variance & Delay Analysis | PLnEX',
    description: 'Root-cause variance tracking and critical path slippage analytics comparing engineering, procurement, and construction baselines.',
    url: 'https://plnex.oilindia.in/variance/',
    type: 'website',
    images: [
      {
        url: '/og-progress.png',
        width: 1200,
        height: 630,
        alt: 'Baseline variance analysis and critical path delay decomposition charts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Baseline Variance & Delay Analysis | PLnEX',
    description: 'Root-cause variance tracking and critical path slippage analytics comparing engineering, procurement, and construction baselines.',
    images: ['/og-progress.png'],
  },
};

export default function VarianceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
