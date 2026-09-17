'use client';

import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Application, ApplicationStatus } from '../../../lib/types';
import { ApplicationCard } from './ApplicationCard';

interface KanbanColumnProps {
  status: ApplicationStatus;
  title: string;
  applications: Application[];
}

const columnConfig: Record<ApplicationStatus, { dot: string; border: string; bg: string }> = {
  APPLIED: { dot: 'bg-sky-500', border: 'border-t-sky-500', bg: 'hover:border-sky-300' },
  INTERVIEW: { dot: 'bg-amber-500', border: 'border-t-amber-500', bg: 'hover:border-amber-300' },
  OFFER: { dot: 'bg-emerald-500', border: 'border-t-emerald-500', bg: 'hover:border-emerald-300' },
  REJECTED: { dot: 'bg-rose-500', border: 'border-t-rose-500', bg: 'hover:border-rose-300' },
  WITHDRAWN: { dot: 'bg-slate-500', border: 'border-t-slate-500', bg: 'hover:border-slate-300' },
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  applications,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'Column',
      status,
    },
  });

  const itemIds = useMemo(() => applications.map((app) => app.id), [applications]);
  const config = columnConfig[status] || {
    dot: 'bg-slate-500',
    border: 'border-t-slate-500',
    bg: 'hover:border-slate-300',
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-full bg-slate-100/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 border-t-4 ${
        config.border
      } p-3 transition-all duration-200 ${
        isOver
          ? 'bg-sky-50/60 dark:bg-sky-950/30 ring-2 ring-sky-400 shadow-md'
          : 'shadow-2xs'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1 py-1.5 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dot} shadow-xs`} />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h2>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
          {applications.length}
        </span>
      </div>

      {/* Sortable Cards Container */}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 flex flex-col gap-3 min-h-[180px]">
          {applications.length > 0 ? (
            applications.map((app) => <ApplicationCard key={app.id} application={app} />)
          ) : (
            <div className="h-full min-h-[140px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 gap-1 p-4 text-center">
              <span>Drop application here</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};
