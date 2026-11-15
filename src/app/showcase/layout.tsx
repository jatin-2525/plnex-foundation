import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design System Showcase',
  description: 'Internal UI component library, design token documentation, and interactive widget tests.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
