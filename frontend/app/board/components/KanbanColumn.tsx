'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Application, ApplicationStatus } from '../../../lib/types';
import { ApplicationCard } from './ApplicationCard';

interface KanbanColumnProps {
  status: ApplicationStatus;
  title: string;
  applications: Application[];
}

const columnConfig: Record<ApplicationStatus, { dot: string; border: string }> = {
  APPLIED: { dot: 'bg-sky-500', border: 'border-t-sky-500' },
  INTERVIEW: { dot: 'bg-amber-500', border: 'border-t-amber-500' },
  OFFER: { dot: 'bg-emerald-500', border: 'border-t-emerald-500' },
  REJECTED: { dot: 'bg-rose-500', border: 'border-t-rose-500' },
  WITHDRAWN: { dot: 'bg-slate-500', border: 'border-t-slate-500' },
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  applications,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const config = columnConfig[status] || { dot: 'bg-slate-500', border: 'border-t-slate-500' };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-full bg-slate-100/70 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 border-t-4 ${
        config.border
      } p-3 transition-colors ${isOver ? 'bg-sky-50/50 dark:bg-sky-950/20 ring-2 ring-sky-400' : ''}`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1 py-1.5 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
          {applications.length}
        </span>
      </div>

      {/* Cards container */}
      <div className="flex-1 flex flex-col gap-2.5 min-h-[160px] overflow-y-auto">
        {applications.length > 0 ? (
          applications.map((app) => <ApplicationCard key={app.id} application={app} />)
        ) : (
          <div className="h-full min-h-[120px] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400">
            Drop application here
          </div>
        )}
      </div>
    </div>
  );
};
