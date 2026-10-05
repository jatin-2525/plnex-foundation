'use client';

import React from 'react';
import Link from 'next/link';
import { BreadcrumbItem } from '../../types/navigation';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-[#596579] mb-4 ${className}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1 text-[#596579] hover:text-[#172033] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-[#7B8798]" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-[#596579] hover:text-[#172033] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'font-semibold text-[#172033]' : 'text-[#596579]'}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
