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
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-[#52665D] dark:text-[#B5C1B5] mb-4 ${className}`}>
      <ol className="flex items-center gap-2 flex-wrap">
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1 text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-[#738A80] dark:text-[#859688]" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'font-semibold text-[#1A2B25] dark:text-[#F2F4E9]' : 'text-[#52665D] dark:text-[#B5C1B5]'}
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
