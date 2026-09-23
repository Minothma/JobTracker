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

const columnConfig: Record<ApplicationStatus, { dot: string; label: string }> = {
  APPLIED: { dot: 'bg-zinc-400', label: 'Applied' },
  INTERVIEW: { dot: 'bg-amber-400', label: 'Interview' },
  OFFER: { dot: 'bg-emerald-400', label: 'Offer' },
  REJECTED: { dot: 'bg-rose-400', label: 'Rejected' },
  WITHDRAWN: { dot: 'bg-zinc-600', label: 'Withdrawn' },
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
    dot: 'bg-zinc-400',
    label: title,
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[270px] w-full bg-[#0E0E10] rounded-lg border border-[#27272A] p-2.5 transition-colors ${
        isOver
          ? 'border-indigo-500/80 bg-[#121215]'
          : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1.5 py-1 mb-2.5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
          <h2 className="text-xs font-semibold text-[#FAFAFA] tracking-tight">{title}</h2>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[11px] font-mono text-[#71717A] bg-[#18181B] border border-[#27272A]">
          {applications.length}
        </span>
      </div>

      {/* Sortable Cards Container */}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 flex flex-col gap-2.5 min-h-[220px]">
          {applications.length > 0 ? (
            applications.map((app) => <ApplicationCard key={app.id} application={app} />)
          ) : (
            <div className="h-full min-h-[140px] flex flex-col items-center justify-center border border-dashed border-[#27272A] rounded-md text-xs font-mono text-[#52525B] gap-1 p-4 text-center">
              <span>No applications</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};
