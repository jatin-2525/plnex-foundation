import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'User registration request portal for authorized contractor and engineering representatives.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
