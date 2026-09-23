'use client';

import React, { useState, useMemo } from 'react';
import { Application, Interview, Note, OfferPackage, Resume } from '../../../../lib/types';
import { formatCurrency } from '../../../../lib/offers';
import {
  Clock,
  Briefcase,
  Video,
  StickyNote,
  Award,
  FileText,
  Calendar,
  CheckCircle2,
  Filter,
  ArrowRight,
  Sparkles,
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
        icon: <Briefcase className="w-4 h-4 text-sky-500" />,
        badge: {
          text: application.status,
          color: 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800',
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
        icon: <FileText className="w-4 h-4 text-violet-500" />,
        badge: {
          text: 'Resume PDF',
          color: 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-800',
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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          description: interview.notes || (isPast ? 'Interview completed.' : 'Upcoming interview round.'),
          timestamp: interviewDate,
          icon: <Video className="w-4 h-4 text-amber-500" />,
          badge: interview.outcome
            ? {
                text: interview.outcome,
                color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
              }
            : {
                text: isPast ? 'Completed' : 'Upcoming',
                color: isPast
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 animate-pulse',
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
          title: 'Added Internal Note',
          description: note.content,
          timestamp: new Date(note.created_at),
          icon: <StickyNote className="w-4 h-4 text-indigo-500" />,
          badge: {
            text: 'Note',
            color: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
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
          offer.offer_deadline ? ` • Deadline: ${new Date(offer.offer_deadline).toLocaleDateString()}` : ''
        }`,
        timestamp: new Date(offer.created_at || application.updated_at),
        icon: <Award className="w-4 h-4 text-emerald-500" />,
        badge: {
          text: 'Official Offer',
          color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-bold',
        },
      });
    }

    // Sort newest first
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
      return futureDays === 0 ? 'Later today' : `In ${futureDays} day${futureDays > 1 ? 's' : ''}`;
    }
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header with Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Activity & Audit Timeline
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Chronological historical record of stage velocity, interview rounds, and notes
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs self-start sm:self-center">
          {[
            { label: 'All', value: 'ALL' },
            { label: 'Interviews', value: 'INTERVIEW' },
            { label: 'Notes', value: 'NOTE' },
            { label: 'Offers', value: 'OFFER' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                filterType === f.value
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((evt) => (
            <div key={evt.id} className="relative group">
              {/* Timeline Icon Node */}
              <div className="absolute -left-6 top-0.5 p-1 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 group-hover:border-sky-500 transition-colors">
                {evt.icon}
              </div>

              {/* Event Card */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-1.5">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {evt.title}
                    </h4>
                    {evt.subtitle && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {evt.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {evt.badge && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${evt.badge.color}`}
                      >
                        {evt.badge.text}
                      </span>
                    )}
                    <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                      {getRelativeTime(evt.timestamp)}
                    </span>
                  </div>
                </div>

                {evt.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">
                    {evt.description}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            No events found for this filter.
          </div>
        )}
      </div>
    </div>
  );
};
