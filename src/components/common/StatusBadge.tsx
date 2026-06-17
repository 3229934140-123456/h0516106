import React from 'react';
import { cn } from '@/lib/utils';
import type { SampleStatus, SeverityLevel, ExperimentStatus, ReportStatus, EquipmentStatus } from '@/types';
import { SAMPLE_STATUS_LABELS, SEVERITY_LABELS, EQUIPMENT_STATUS_LABELS } from '@/types';

interface StatusBadgeProps {
  status: string;
  type?: 'sample' | 'severity' | 'experiment' | 'report' | 'equipment';
  size?: 'sm' | 'md';
  className?: string;
}

const statusStyles: Record<string, Record<string, string>> = {
  sample: {
    pending: 'bg-warning-50 text-warning-600 border-warning-200',
    testing: 'bg-primary-50 text-primary-600 border-primary-200',
    completed: 'bg-success-50 text-success-600 border-success-200',
    abnormal: 'bg-danger-50 text-danger-600 border-danger-200 animate-pulse-slow',
    archived: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    retained: 'bg-info-50 text-info-600 border-info-200',
    destroyed: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  },
  severity: {
    low: 'bg-warning-50 text-warning-600 border-warning-200',
    medium: 'bg-orange-50 text-orange-600 border-orange-200',
    high: 'bg-danger-50 text-danger-600 border-danger-200',
    critical: 'bg-danger-100 text-danger-700 border-danger-300 animate-pulse-slow',
  },
  experiment: {
    draft: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    in_progress: 'bg-primary-50 text-primary-600 border-primary-200',
    completed: 'bg-success-50 text-success-600 border-success-200',
  },
  report: {
    draft: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    reviewing: 'bg-primary-50 text-primary-600 border-primary-200',
    approved: 'bg-success-50 text-success-600 border-success-200',
    rejected: 'bg-danger-50 text-danger-600 border-danger-200',
  },
  equipment: {
    available: 'bg-success-50 text-success-600 border-success-200',
    in_use: 'bg-primary-50 text-primary-600 border-primary-200',
    maintenance: 'bg-warning-50 text-warning-600 border-warning-200',
    calibration_due: 'bg-danger-50 text-danger-600 border-danger-200',
  },
};

const getStatusLabel = (status: string, type: string): string => {
  switch (type) {
    case 'sample':
      return SAMPLE_STATUS_LABELS[status as SampleStatus] || status;
    case 'severity':
      return SEVERITY_LABELS[status as SeverityLevel] || status;
    case 'experiment':
      return { draft: '草稿', in_progress: '进行中', completed: '已完成' }[status as ExperimentStatus] || status;
    case 'report':
      return { draft: '草稿', reviewing: '审核中', approved: '已通过', rejected: '已驳回' }[status as ReportStatus] || status;
    case 'equipment':
      return EQUIPMENT_STATUS_LABELS[status as EquipmentStatus] || status;
    default:
      return status;
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'sample',
  size = 'md',
  className,
}) => {
  const styles = statusStyles[type]?.[status] || 'bg-neutral-100 text-neutral-500 border-neutral-200';
  const label = getStatusLabel(status, type);

  return (
    <span
      className={cn(
        'inline-flex items-center border rounded font-medium transition-all duration-200',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        styles,
        className
      )}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full mr-1.5',
        type === 'sample' && status === 'pending' && 'bg-warning-500',
        type === 'sample' && status === 'testing' && 'bg-primary-500',
        type === 'sample' && status === 'completed' && 'bg-success-500',
        type === 'sample' && status === 'abnormal' && 'bg-danger-500',
        type === 'sample' && status === 'retained' && 'bg-info-500',
        type === 'sample' && status === 'destroyed' && 'bg-neutral-400',
        type === 'severity' && status === 'low' && 'bg-warning-500',
        type === 'severity' && status === 'medium' && 'bg-orange-500',
        type === 'severity' && status === 'high' && 'bg-danger-500',
        type === 'severity' && status === 'critical' && 'bg-danger-600',
        type === 'experiment' && status === 'in_progress' && 'bg-primary-500',
        type === 'experiment' && status === 'completed' && 'bg-success-500',
        type === 'report' && status === 'approved' && 'bg-success-500',
        type === 'report' && status === 'rejected' && 'bg-danger-500',
        type === 'equipment' && status === 'available' && 'bg-success-500',
        type === 'equipment' && status === 'in_use' && 'bg-primary-500',
        type === 'equipment' && status === 'maintenance' && 'bg-warning-500',
        type === 'equipment' && status === 'calibration_due' && 'bg-danger-500',
      )} />
      {label}
    </span>
  );
};
