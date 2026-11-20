'use client';

import React from 'react';
import { MessageSquareQuote, Building, Calendar, UserCheck } from 'lucide-react';

/**
 * Customer Testimonials & Reviews Section
 * [PLACEHOLDER TEMPLATE ONLY — NO INVENTED OR FABRICATED REVIEWS]
 *
 * NOTE FOR SITE OWNER:
 * Do not fabricate reviews. When real verified client feedback is collected,
 * replace the placeholder strings in `VERIFIED_CUSTOMER_REVIEWS` below.
 * No review schema markup is included, compliant with Google self-serving review guidelines.
 */

export interface CustomerReviewSlot {
  id: string;
  quotePlaceholder: string;
  authorPlaceholder: string;
  rolePlaceholder: string;
  organizationPlaceholder: string;
  datePlaceholder: string;
  projectPlaceholder: string;
}

export const VERIFIED_CUSTOMER_REVIEWS: CustomerReviewSlot[] = [
  {
    id: 'review-slot-1',
    quotePlaceholder:
      '[Customer Testimonial Placeholder: Awaiting verified client feedback]',
    authorPlaceholder: '[Customer Full Name Placeholder]',
    rolePlaceholder: '[Customer Job Title Placeholder]',
    organizationPlaceholder: '[Client Organization Placeholder]',
    datePlaceholder: '[Date Placeholder]',
    projectPlaceholder: '[Project Reference Placeholder]',
  },
  {
    id: 'review-slot-2',
    quotePlaceholder:
      '[Customer Testimonial Placeholder: Awaiting verified client feedback]',
    authorPlaceholder: '[Customer Full Name Placeholder]',
    rolePlaceholder: '[Customer Job Title Placeholder]',
    organizationPlaceholder: '[Client Organization Placeholder]',
    datePlaceholder: '[Date Placeholder]',
    projectPlaceholder: '[Project Reference Placeholder]',
  },
  {
    id: 'review-slot-3',
    quotePlaceholder:
      '[Customer Testimonial Placeholder: Awaiting verified client feedback]',
    authorPlaceholder: '[Customer Full Name Placeholder]',
    rolePlaceholder: '[Customer Job Title Placeholder]',
    organizationPlaceholder: '[Client Organization Placeholder]',
    datePlaceholder: '[Date Placeholder]',
    projectPlaceholder: '[Project Reference Placeholder]',
  },
];

export function TestimonialsSection() {
  return (
    <section
      aria-label="Customer Reviews and Testimonials"
      className="my-10 p-6 sm:p-8 bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-2xl shadow-xs transition-colors"
    >
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F1F2] dark:bg-[#3D1A10] text-[#006B61] dark:text-[#72C6AD] border border-[#006B61]/20 dark:border-[#72C6AD]/30 mb-3">
            <MessageSquareQuote className="w-3.5 h-3.5" />
            <span>Verified Customer Reviews</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A2B25] dark:text-[#F6ECE7]">
            What Project Controls Teams Say About PLnEX
          </h2>
          <p className="text-xs sm:text-sm text-[#52665D] dark:text-[#B5C1B5] max-w-xl mx-auto mt-2">
            Real feedback from capital project directors, planning engineers, and field site supervisors.
          </p>
        </div>

        {/* Reviews Grid (Placeholders only) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {VERIFIED_CUSTOMER_REVIEWS.map((review, idx) => (
            <div
              key={review.id}
              className="flex flex-col justify-between p-5 rounded-xl border border-dashed border-[#B7DAC3] dark:border-[#3A5146] bg-[#F6F7F3] dark:bg-[#101815] hover:border-[#006B61] dark:hover:border-[#72C6AD] transition-colors"
            >
              <div>
                {/* Slot Indicator */}
                <div className="flex items-center justify-between text-[11px] font-mono text-[#52665D] dark:text-[#B5C1B5] mb-3">
                  <span className="font-semibold uppercase text-[#006B61] dark:text-[#72C6AD]">
                    Review Slot #{idx + 1}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-[#006B61] dark:text-[#72C6AD]" />
                    <span>Real Review Slot</span>
                  </span>
                </div>

                {/* Quote Placeholder */}
                <blockquote className="text-xs text-[#1A2B25] dark:text-[#F6ECE7] italic leading-relaxed mb-4">
                  &ldquo;{review.quotePlaceholder}&rdquo;
                </blockquote>
              </div>

              {/* Author & Org Placeholders */}
              <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#3D1A10] text-[11px] space-y-1">
                <div className="font-bold text-[#1A2B25] dark:text-[#F6ECE7]">
                  {review.authorPlaceholder}
                </div>
                <div className="text-[#52665D] dark:text-[#B5C1B5]">
                  {review.rolePlaceholder}
                </div>
                <div className="flex items-center gap-1.5 text-[#006B61] dark:text-[#72C6AD] font-semibold text-[10px]">
                  <Building className="w-3 h-3" />
                  <span>{review.organizationPlaceholder}</span>
                </div>
                <div className="flex items-center gap-1 text-[#8C9BA8] dark:text-[#A89078] text-[10px]">
                  <Calendar className="w-3 h-3" />
                  <span>{review.datePlaceholder} • {review.projectPlaceholder}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Informative Note for Admin */}
        <div className="mt-6 text-center text-[11px] text-[#8C9BA8] dark:text-[#A89078]">
          <span>Slots reserved for authorized customer testimonials. In accordance with Google quality guidelines, no reviews are manufactured.</span>
        </div>
      </div>
    </section>
  );
}
