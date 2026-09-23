import React from 'react';
import { ApplicationStatus } from '../../lib/types';

interface BadgeProps {
  status?: ApplicationStatus | string;
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, children, variant, className = '' }) => {
  const getStatusStyles = (s?: string) => {
    switch (s) {
      case 'APPLIED':
        return 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60';
      case 'INTERVIEW':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/40';
      case 'OFFER':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40';
      case 'REJECTED':
        return 'bg-rose-950/40 text-rose-300 border-rose-800/40';
      case 'WITHDRAWN':
        return 'bg-zinc-800/40 text-zinc-400 border-zinc-700/40';
      case 'PASSED':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40';
      case 'FAILED':
        return 'bg-rose-950/40 text-rose-300 border-rose-800/40';
      case 'PENDING':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/40';
      default:
        return 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50';
    }
  };

  const getVariantStyles = (v?: string) => {
    switch (v) {
      case 'success':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40';
      case 'warning':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/40';
      case 'danger':
        return 'bg-rose-950/40 text-rose-300 border-rose-800/40';
      case 'info':
        return 'bg-indigo-950/40 text-indigo-300 border-indigo-800/40';
      default:
        return 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50';
    }
  };

  const styleClass = status ? getStatusStyles(status) : getVariantStyles(variant);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${styleClass} ${className}`}
    >
      {children || status}
    </span>
  );
};
