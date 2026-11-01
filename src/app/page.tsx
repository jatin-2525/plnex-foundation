'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { Logo } from '../components/shared/Logo';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isAuthReady, userSession } = useApp();

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isAuthenticated || !userSession) {
      router.replace('/login');
      return;
    }

    // Role-based root routing
    switch (userSession.role) {
      case 'manager':
        router.replace('/dashboard');
        break;
      case 'engineer':
        router.replace('/engineer');
        break;
      case 'admin':
        router.replace('/admin');
        break;
      default:
        router.replace('/login');
        break;
    }
  }, [isAuthenticated, isAuthReady, userSession, router]);

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <Logo size="lg" />
        <div className="flex items-center gap-2 text-xs font-mono text-[#526779]">
          <Loader2 className="w-4 h-4 animate-spin text-[#0F6B68]" />
          <span>Verifying PLnEX session authority...</span>
        </div>
      </div>
    </div>
  );
}
