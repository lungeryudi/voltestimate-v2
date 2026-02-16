import type { Estimate } from '../../../shared/types';

type StatusColor = 'draft' | 'pending' | 'approved' | 'sent' | 'rejected';

interface StatusBadgeProps {
  status: Estimate['status'];
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<StatusColor, { bg: string; text: string; border: string; label: string }> = {
  draft: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    label: 'Draft'
  },
  pending: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    label: 'Pending'
  },
  approved: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/30',
    label: 'Approved'
  },
  sent: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    label: 'Sent'
  },
  rejected: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    label: 'Rejected'
  }
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base'
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status];
  
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${config.bg}
        ${config.text}
        ${config.border}
        ${sizeClasses[size]}
      `}
    >
      <span className={`
        w-1.5 h-1.5 rounded-full mr-1.5
        ${status === 'draft' ? 'bg-slate-400' : ''}
        ${status === 'pending' ? 'bg-amber-400 animate-pulse' : ''}
        ${status === 'approved' ? 'bg-green-400' : ''}
        ${status === 'sent' ? 'bg-blue-400' : ''}
        ${status === 'rejected' ? 'bg-red-400' : ''}
      `} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
