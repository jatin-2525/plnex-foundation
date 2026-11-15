import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy and data protection practices for the PLnEX enterprise project controls platform at Oil India Limited.',
  openGraph: {
    title: 'Privacy Policy | PLnEX',
    description: 'Privacy policy and data protection practices for the PLnEX enterprise project controls platform at Oil India Limited.',
    url: 'https://plnex.oilindia.in/privacy/',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PLnEX Privacy Policy and data protection overview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | PLnEX',
    description: 'Privacy policy and data protection practices for the PLnEX enterprise project controls platform at Oil India Limited.',
    images: ['/og-image.png'],
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
