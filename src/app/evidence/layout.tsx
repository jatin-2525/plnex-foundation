import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Field Evidence & Verification Vault',
  description: 'Immutable site evidence repository for timestamped inspection photos, material test certificates, and signed lift tickets.',
  openGraph: {
    title: 'Field Evidence & Verification Vault | PLnEX',
    description: 'Immutable site evidence repository for timestamped inspection photos, material test certificates, and signed lift tickets.',
    url: 'https://plnex.oilindia.in/evidence/',
    type: 'website',
    images: [
      {
        url: '/og-evidence.png',
        width: 1200,
        height: 630,
        alt: 'Cryptographically verified field evidence ledger displaying geotagged site inspection records and DPRs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Field Evidence & Verification Vault | PLnEX',
    description: 'Immutable site evidence repository for timestamped inspection photos, material test certificates, and signed lift tickets.',
    images: ['/og-evidence.png'],
  },
};

export default function EvidenceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
