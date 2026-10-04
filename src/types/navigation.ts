import { LucideIcon } from 'lucide-react';
import { Permission } from './permissions';
import { PipelineStage } from '../tokens/status';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeVariant?: 'primary' | 'warning' | 'critical' | 'success';
  requiredPermissions?: Permission[];
  pipelineStage?: PipelineStage;
  stageNumber?: number;
  description?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}
