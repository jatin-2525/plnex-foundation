import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center & Technical Support',
  description: 'Knowledge base, operational guides, frequently asked questions, and direct support desk for PLnEX project controls personnel.',
  openGraph: {
    title: 'Help Center & Technical Support | PLnEX',
    description: 'Knowledge base, operational guides, frequently asked questions, and direct support desk for PLnEX project controls personnel.',
    url: 'https://plnex.oilindia.in/support/',
    type: 'website',
    images: [
      {
        url: '/og-support.png',
        width: 1200,
        height: 630,
        alt: 'PLnEX knowledge base, standard operating procedures, and user guide directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Help Center & Technical Support | PLnEX',
    description: 'Knowledge base, operational guides, frequently asked questions, and direct support desk for PLnEX project controls personnel.',
    images: ['/og-support.png'],
  },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
