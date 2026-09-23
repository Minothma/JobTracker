'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Application } from '../../../lib/types';
import {
  Calendar,
  MessageSquare,
  Video,
  FileText,
  ExternalLink,
  GripVertical,
  Star,
  MapPin,
  Banknote,
  ArrowRight,
} from 'lucide-react';
import {
  isApplicationStarred,
  toggleFavoriteApi,
  STARRED_CHANGED_EVENT,
} from '../../../lib/favorites';
import { formatCurrency } from '../../../lib/offers';

interface ApplicationCardProps {
  application: Application;
  isOverlay?: boolean;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  isOverlay = false,
}) => {
  const [isStarred, setIsStarred] = useState<boolean>(
    application.is_favorite !== undefined ? application.is_favorite : isApplicationStarred(application.id),
  );

  useEffect(() => {
    setIsStarred(
      application.is_favorite !== undefined ? application.is_favorite : isApplicationStarred(application.id),
    );

    const handleStarredChanged = (e: any) => {
      if (e.detail?.id === application.id) {
        setIsStarred(e.detail.isStarred);
      }
    };

    window.addEventListener(STARRED_CHANGED_EVENT, handleStarredChanged);
    return () => {
      window.removeEventListener(STARRED_CHANGED_EVENT, handleStarredChanged);
    };
  }, [application.id, application.is_favorite]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: application.id,
    data: { application },
    disabled: isOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  };

  const handleStarClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const next = await toggleFavoriteApi(application.id, isStarred);
    setIsStarred(next);
  };

  const formattedDate = new Date(application.applied_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={isOverlay ? undefined : style}
      className={`group relative rounded-lg p-3.5 transition-all text-[#FAFAFA] ${
        isOverlay
          ? 'bg-[#18181B] border border-indigo-500 shadow-2xl scale-[1.02] cursor-grabbing'
          : isDragging
          ? 'bg-[#121214] border border-indigo-500/80 shadow-sm'
          : isStarred
          ? 'bg-[#15130D] border border-amber-500/40 hover:border-amber-500/60 shadow-xs'
          : 'bg-[#121214] border border-[#27272A] hover:border-[#3F3F46] hover:bg-[#151518] shadow-xs'
      }`}
    >
      {/* Card Header: Company, Role & Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/applications/${application.id}`}
              className="font-medium text-sm text-[#FAFAFA] hover:text-indigo-400 block truncate transition-colors"
              onClick={(e) => isOverlay && e.preventDefault()}
            >
              {application.company_name}
            </Link>
            {isStarred && (
              <span
                className="text-[9px] font-mono font-medium px-1 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60 shrink-0"
                title="Starred Application"
              >
                starred
              </span>
            )}
          </div>
          <p className="text-xs text-[#A1A1AA] truncate mt-0.5">
            {application.role_title}
          </p>
        </div>

        {/* Right controls: Star button & Drag handle */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={handleStarClick}
            className={`p-1 rounded transition-colors ${
              isStarred
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-[#52525B] hover:text-amber-400 opacity-0 group-hover:opacity-100 focus:opacity-100'
            }`}
            title={isStarred ? 'Unstar Application' : 'Star Application'}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          {!isOverlay && (
            <div
              {...listeners}
              {...attributes}
              className="text-[#52525B] hover:text-[#FAFAFA] p-1 -mr-1 cursor-grab active:cursor-grabbing"
              title="Drag card"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* Badges: Work Mode, Location, Salary */}
      {(application.work_mode || application.location || application.offers) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {application.work_mode && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                application.work_mode === 'REMOTE'
                  ? 'bg-[#18181B] text-[#A1A1AA] border-[#27272A]'
                  : application.work_mode === 'HYBRID'
                  ? 'bg-[#18181B] text-[#A1A1AA] border-[#27272A]'
                  : 'bg-[#18181B] text-[#A1A1AA] border-[#27272A]'
              }`}
            >
              {application.work_mode.toLowerCase()}
            </span>
          )}

          {application.location && (
            <span className="text-[10px] text-[#71717A] flex items-center gap-0.5 font-mono">
              <MapPin className="w-3 h-3 text-[#52525B]" />
              <span className="truncate max-w-[100px]">{application.location}</span>
            </span>
          )}

          {application.offers && (
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 ml-auto flex items-center gap-1">
              <Banknote className="w-3 h-3" />
              <span>{formatCurrency(Number(application.offers.base_salary), application.offers.currency)}</span>
            </span>
          )}
        </div>
      )}

      {/* Details & Resume Tag */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-[#71717A] font-mono">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-[#52525B]" />
          <span>{formattedDate}</span>
        </div>

        {application.job_posting_url && (
          <a
            href={application.job_posting_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-0.5 text-indigo-400 hover:text-indigo-300 transition-colors"
            title="Open job posting"
          >
            <ExternalLink className="w-3 h-3" />
            <span>link</span>
          </a>
        )}

        {application.resumes && (
          <div className="flex items-center gap-1 bg-[#18181B] border border-[#27272A] px-1.5 py-0.5 rounded text-[10px] text-[#A1A1AA]">
            <FileText className="w-2.5 h-2.5 text-indigo-400" />
            <span className="truncate max-w-[85px]">{application.resumes.version_label}</span>
          </div>
        )}
      </div>

      {/* Stats Footer (Interviews count & Notes count) */}
      <div className="mt-3 pt-2.5 border-t border-[#27272A] flex items-center justify-between text-xs text-[#71717A] font-mono">
        <div className="flex items-center gap-3">
          {application._count?.interviews ? (
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <Video className="w-3 h-3" />
              <span>{application._count.interviews} {application._count.interviews === 1 ? 'round' : 'rounds'}</span>
            </span>
          ) : null}

          {application._count?.notes ? (
            <span className="flex items-center gap-1 text-[#A1A1AA]">
              <MessageSquare className="w-3 h-3 text-[#52525B]" />
              <span>{application._count.notes}</span>
            </span>
          ) : null}
        </div>

        <Link
          href={`/applications/${application.id}`}
          className="text-xs text-[#A1A1AA] hover:text-[#FAFAFA] font-medium ml-auto flex items-center gap-1 transition-colors"
        >
          <span>view</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
