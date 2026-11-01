'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6">
      <div
        className="bg-white border border-[#D8E2EA] rounded-lg p-6 sm:p-8 flex flex-col items-center text-center max-w-lg mx-auto shadow-xs"
        role="alert"
      >
        <div className="w-10 h-10 rounded-full bg-[#FCE8E4] border border-[#E4B0AA] flex items-center justify-center text-[#A24335] mb-3 shrink-0">
          <AlertCircle className="w-5 h-5 stroke-[2]" />
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-[#142C3F] mb-1.5">
          Page could not be found.
        </h3>
        <p className="text-xs text-[#526779] max-w-sm mb-4 leading-relaxed">
          The requested URL does not match any active project route. Verify the address or return to the project dashboard.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F6B68] hover:bg-[#135A72] text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
