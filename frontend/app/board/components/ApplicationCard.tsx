'use client';

import React from 'react';
import Link from 'next/link';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Application } from '../../../lib/types';
import { Calendar, MessageSquare, Video, FileText, ExternalLink, GripVertical } from 'lucide-react';

interface ApplicationCardProps {
  application: Application;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { application },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  };

  const formattedDate = new Date(application.applied_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm hover:shadow transition-shadow ${
        isDragging ? 'ring-2 ring-sky-500 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            href={`/applications/${application.id}`}
            className="font-semibold text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 block truncate"
          >
            {application.company_name}
          </Link>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate mt-0.5">
            {application.role_title}
          </p>
        </div>

        {/* Drag handle */}
        <div
          {...listeners}
          {...attributes}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -mr-1 cursor-grab active:cursor-grabbing"
          title="Drag to change status"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Details & Tags */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>

        {application.job_posting_url && (
          <a
            href={application.job_posting_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-0.5 text-sky-600 hover:underline dark:text-sky-400"
            title="Open job posting"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Posting</span>
          </a>
        )}

        {application.resumes && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-600 dark:text-slate-300">
            <FileText className="w-3 h-3 text-sky-500" />
            <span className="truncate max-w-[90px]">{application.resumes.version_label}</span>
          </div>
        )}
      </div>

      {/* Stats footer (Interviews count & Notes count) */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-3">
          {application._count?.interviews ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <Video className="w-3.5 h-3.5" />
              {application._count.interviews} {application._count.interviews === 1 ? 'round' : 'rounds'}
            </span>
          ) : null}

          {application._count?.notes ? (
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <MessageSquare className="w-3.5 h-3.5" />
              {application._count.notes}
            </span>
          ) : null}
        </div>

        <Link
          href={`/applications/${application.id}`}
          className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium ml-auto"
        >
          View &rarr;
        </Link>
      </div>
    </div>
  );
};
