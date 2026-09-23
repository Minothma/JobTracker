'use client';

import React, { useState, useMemo } from 'react';
import { Application } from '../../../../lib/types';
import { formatCurrency } from '../../../../lib/offers';
import {
  Clock,
  Briefcase,
  Video,
  StickyNote,
  Award,
  FileText,
} from 'lucide-react';

interface ActivityTimelineSectionProps {
  application: Application;
}

interface TimelineEvent {
  id: string;
  type: 'APPLICATION_CREATED' | 'INTERVIEW' | 'NOTE' | 'OFFER' | 'RESUME';
  title: string;
  subtitle?: string;
  description?: string;
  timestamp: Date;
  icon: React.ReactNode;
  badge?: {
    text: string;
    color: string;
  };
}

export const ActivityTimelineSection: React.FC<ActivityTimelineSectionProps> = ({
  application,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const events: TimelineEvent[] = useMemo(() => {
    const list: TimelineEvent[] = [];

    // 1. Initial Application Applied
    if (application.applied_date) {
      list.push({
        id: `app-applied-${application.id}`,
        type: 'APPLICATION_CREATED',
        title: `Applied for ${application.role_title}`,
        subtitle: `at ${application.company_name}`,
        description: `Submitted application via ${application.work_mode || 'REMOTE'} format${
          application.location ? ` in ${application.location}` : ''
        }.`,
        timestamp: new Date(application.applied_date),
        icon: <Briefcase className="w-3.5 h-3.5 text-indigo-400" />,
        badge: {
          text: application.status,
          color: 'bg-[#18181B] text-[#A1A1AA] border-[#27272A]',
        },
      });
    }

    // 2. Attached Resume
    if (application.resumes) {
      list.push({
        id: `resume-${application.resumes.id}`,
        type: 'RESUME',
        title: `Attached Resume: ${application.resumes.version_label}`,
        subtitle: application.resumes.original_filename,
        description: 'Tailored resume attached for ATS optimization and recruiter review.',
        timestamp: new Date(application.created_at),
        icon: <FileText className="w-3.5 h-3.5 text-indigo-400" />,
        badge: {
          text: 'Resume PDF',
          color: 'bg-[#18181B] text-[#A1A1AA] border-[#27272A]',
        },
      });
    }

    // 3. Interviews
    if (application.interviews && application.interviews.length > 0) {
      application.interviews.forEach((interview) => {
        const interviewDate = new Date(interview.scheduled_at);
        const isPast = interviewDate.getTime() < Date.now();

        list.push({
          id: `interview-${interview.id}`,
          type: 'INTERVIEW',
          title: `${interview.round_type} Round Scheduled`,
          subtitle: interviewDate.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          description: interview.notes || (isPast ? 'Interview completed.' : 'Upcoming interview round.'),
          timestamp: interviewDate,
          icon: <Video className="w-3.5 h-3.5 text-amber-400" />,
          badge: interview.outcome
            ? {
                text: interview.outcome,
                color: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
              }
            : {
                text: isPast ? 'Completed' : 'Upcoming',
                color: isPast
                  ? 'bg-[#18181B] text-[#71717A] border-[#27272A]'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800/60',
              },
        });
      });
    }

    // 4. Notes
    if (application.notes && application.notes.length > 0) {
      application.notes.forEach((note) => {
        list.push({
          id: `note-${note.id}`,
          type: 'NOTE',
          title: 'Internal Note Added',
          description: note.content,
          timestamp: new Date(note.created_at),
          icon: <StickyNote className="w-3.5 h-3.5 text-indigo-400" />,
          badge: {
            text: 'Note',
            color: 'bg-[#18181B] text-[#71717A] border-[#27272A]',
          },
        });
      });
    }

    // 5. Offer Package
    if (application.offers) {
      const offer = application.offers;
      const totalComp =
        Number(offer.base_salary || 0) +
        Number(offer.bonus || 0) +
        Number(offer.equity || 0);

      list.push({
        id: `offer-${offer.id}`,
        type: 'OFFER',
        title: `Offer Received: ${formatCurrency(totalComp, offer.currency)} / year`,
        subtitle: `${offer.work_mode} Arrangement`,
        description: `Base: ${formatCurrency(Number(offer.base_salary), offer.currency)}${
          Number(offer.bonus) > 0 ? ` + Bonus: ${formatCurrency(Number(offer.bonus), offer.currency)}` : ''
        }${Number(offer.equity) > 0 ? ` + Equity: ${formatCurrency(Number(offer.equity), offer.currency)}` : ''}${
          offer.offer_deadline ? ` • Deadline: ${offer.offer_deadline.split('T')[0]}` : ''
        }`,
        timestamp: new Date(offer.created_at || application.updated_at),
        icon: <Award className="w-3.5 h-3.5 text-emerald-400" />,
        badge: {
          text: 'Official Offer',
          color: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
        },
      });
    }

    list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return list;
  }, [application]);

  const filteredEvents = useMemo(() => {
    if (filterType === 'ALL') return events;
    return events.filter((e) => e.type === filterType);
  }, [events, filterType]);

  const getRelativeTime = (d: Date) => {
    const diffMs = Date.now() - d.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      const futureDays = Math.abs(diffDays);
      return futureDays === 0 ? 'Later today' : `In ${futureDays}d`;
    }
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-5 rounded-lg bg-[#121214] border border-[#27272A] space-y-4 text-[#FAFAFA]">
      {/* Header with Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#18181B] text-indigo-400 border border-[#27272A]">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#FAFAFA]">
              Activity & Timeline Log
            </h3>
            <p className="text-[11px] font-mono text-[#71717A]">
              Chronological log of stage transitions, interviews, notes and offer updates
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1 font-mono text-xs self-start sm:self-center">
          {[
            { label: 'all', value: 'ALL' },
            { label: 'interviews', value: 'INTERVIEW' },
            { label: 'notes', value: 'NOTE' },
            { label: 'offers', value: 'OFFER' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                filterType === f.value
                  ? 'bg-[#27272A] text-[#FAFAFA] border border-[#3F3F46]'
                  : 'text-[#71717A] hover:text-[#FAFAFA]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-[#27272A]">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((evt) => (
            <div key={evt.id} className="relative group">
              {/* Timeline Icon Node */}
              <div className="absolute -left-5 top-1 p-1 rounded bg-[#121214] border border-[#27272A] text-[#FAFAFA]">
                {evt.icon}
              </div>

              {/* Event Card */}
              <div className="p-3 rounded-md bg-[#0E0E10] border border-[#27272A] space-y-1">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="text-xs font-medium text-[#FAFAFA]">
                      {evt.title}
                    </h4>
                    {evt.subtitle && (
                      <p className="text-[11px] font-mono text-[#71717A]">
                        {evt.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    {evt.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded border ${evt.badge.color}`}
                      >
                        {evt.badge.text.toLowerCase()}
                      </span>
                    )}
                    <span className="text-[#52525B]">
                      {getRelativeTime(evt.timestamp)}
                    </span>
                  </div>
                </div>

                {evt.description && (
                  <p className="text-xs text-[#A1A1AA] leading-relaxed pt-0.5">
                    {evt.description}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-xs font-mono text-[#52525B]">
            No events logged for this filter.
          </div>
        )}
      </div>
    </div>
  );
};
