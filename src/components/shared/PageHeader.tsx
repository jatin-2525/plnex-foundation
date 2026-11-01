'use client';

import React, { ReactNode } from 'react';
import { PipelineStage, PIPELINE_STAGES } from '../../tokens/status';

export interface PageHeaderProps {
  title: string;
  description?: string;
  stage?: PipelineStage;
  actions?: ReactNode;
  metadata?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  stage,
  actions,
  metadata,
  className = '',
}: PageHeaderProps) {
  const stageConfig = stage ? PIPELINE_STAGES.find((s) => s.key === stage) : undefined;

  return (
    <div
      className={`bg-white border-b border-[#D8E2EA] px-6 py-6 -mx-6 -mt-6 mb-6 ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-[28px] sm:text-[32px] font-bold text-[#142C3F] tracking-tight leading-tight">
              {title}
            </h1>
            {stageConfig && (
              <span className="inline-flex items-center gap-2 px-3 py-0.5 bg-[#EAF0F5] text-[#0F6B68] border border-[#D8E2EA] text-xs font-semibold rounded-md font-mono">
                <span>STAGE {stageConfig.stepNumber}:</span>
                <span className="font-bold">{stageConfig.label}</span>
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm md:text-base text-[#526779] leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-3 flex-wrap flex-shrink-0">{actions}</div>}
      </div>

      {metadata && (
        <div className="mt-4 pt-3 border-t border-[#D8E2EA] flex items-center gap-4 text-xs md:text-[13px] text-[#526779] flex-wrap">
          {metadata}
        </div>
      )}
    </div>
  );
}
