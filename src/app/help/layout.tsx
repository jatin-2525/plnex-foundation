import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Guides & System Documentation',
  description: 'Official user manuals, field engineering workflows, and system integration guides for Oil India Limited operations.',
  openGraph: {
    title: 'User Guides & System Documentation | PLnEX',
    description: 'Official user manuals, field engineering workflows, and system integration guides for Oil India Limited operations.',
    url: 'https://plnex.oilindia.in/help/',
    type: 'website',
    images: [
      {
        url: '/og-support.png',
        width: 1200,
        height: 630,
        alt: 'User manuals, field engineering SOPs, and system integration guides',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'User Guides & System Documentation | PLnEX',
    description: 'Official user manuals, field engineering workflows, and system integration guides for Oil India Limited operations.',
    images: ['/og-support.png'],
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
