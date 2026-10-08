'use client';

import React, { useEffect } from 'react';
import { ErrorState } from '../components/shared/ErrorState';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client error to diagnostic stream
    console.error('PLnEX application error caught:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6">
      <ErrorState
        title="Page could not be displayed."
        message="An unexpected condition prevented this page from rendering. Check your network connection or retry the operation."
        code={error.digest ? `DIGEST_${error.digest.slice(0, 8)}` : 'ERR_CLIENT_RENDER'}
        onRetry={reset}
        retryLabel="Retry"
      />
    </div>
  );
}
