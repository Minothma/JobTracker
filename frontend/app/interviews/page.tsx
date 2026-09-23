'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api-client';
import { InterviewWithApplication, InterviewRoundType } from '../../lib/types';
import { downloadIcsFile } from '../../lib/calendar';
import { useToast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AiInterviewPrepModal } from '../../components/AiInterviewPrepModal';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Download,
  Building2,
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
} from 'lucide-react';

export default function InterviewsPage() {
  const { showToast } = useToast();

  const [interviews, setInterviews] = useState<InterviewWithApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | 'ALL'>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roundFilter, setRoundFilter] = useState<string>('ALL');

  // AI Prep Modal state
  const [prepModalData, setPrepModalData] = useState<{
    isOpen: boolean;
    companyName: string;
    roleTitle: string;
    roundType: InterviewRoundType;
  }>({
    isOpen: false,
    companyName: '',
    roleTitle: '',
    roundType: 'MIXED',
  });

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<InterviewWithApplication[]>('/interviews');
      setInterviews(data || []);
    } catch {
      showToast('Failed to load interviews schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const now = new Date();

  const getCountdownLabel = (dateStr: string) => {
    const target = new Date(dateStr);
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isToday =
      target.getDate() === now.getDate() &&
      target.getMonth() === now.getMonth() &&
      target.getFullYear() === now.getFullYear();

    if (diffMs < 0) {
      const pastDays = Math.abs(diffDays);
      return {
        text: pastDays === 0 ? 'Earlier today' : `${pastDays} day${pastDays > 1 ? 's' : ''} ago`,
        color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      };
    }

    if (isToday) {
      return {
        text: `Today at ${target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        color: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse font-bold',
      };
    }

    if (diffDays === 1) {
      return {
        text: `Tomorrow at ${target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        color: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold',
      };
    }

    if (diffDays <= 7) {
      return {
        text: `In ${diffDays} days`,
        color: 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 font-medium',
      };
    }

    return {
      text: `In ${diffDays} days`,
      color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    };
  };

  const filteredInterviews = interviews.filter((item) => {
    const interviewDate = new Date(item.scheduled_at);
    const isUpcoming = interviewDate.getTime() >= now.getTime() - 2 * 60 * 60 * 1000; // leeway of 2h

    if (activeTab === 'UPCOMING' && !isUpcoming) return false;
    if (activeTab === 'PAST' && isUpcoming) return false;

    if (roundFilter !== 'ALL' && item.round_type.toUpperCase() !== roundFilter.toUpperCase()) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCompany = item.applications?.company_name.toLowerCase().includes(q);
      const matchRole = item.applications?.role_title.toLowerCase().includes(q);
      const matchRound = item.round_type.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      if (!matchCompany && !matchRole && !matchRound && !matchNotes) return false;
    }

    return true;
  });

  const handleExportIcs = (item: InterviewWithApplication) => {
    const scheduledDate = new Date(item.scheduled_at);
    downloadIcsFile({
      title: `${item.round_type} Interview - ${item.applications?.company_name}`,
      description: item.notes || `Interview round (${item.round_type}) for ${item.applications?.role_title} at ${item.applications?.company_name}`,
      startTime: scheduledDate,
      durationMinutes: 60,
      location: item.applications?.work_mode === 'REMOTE' ? 'Online Video Call' : item.applications?.location || 'Company Office',
    });
    showToast(`Exported calendar invite (.ics) for ${item.applications?.company_name}`, 'success');
  };

  const handleLaunchAiPrep = (item: InterviewWithApplication) => {
    let roundType: InterviewRoundType = 'MIXED';
    const rt = item.round_type.toUpperCase();
    if (rt.includes('TECH') || rt.includes('CODING') || rt.includes('ALGO')) roundType = 'TECHNICAL';
    else if (rt.includes('BEHAVIOR') || rt.includes('HR') || rt.includes('SCREEN') || rt.includes('CULTURE')) roundType = 'BEHAVIORAL';
    else if (rt.includes('SYSTEM') || rt.includes('ARCHITECT')) roundType = 'SYSTEM_DESIGN';

    setPrepModalData({
      isOpen: true,
      companyName: item.applications?.company_name || '',
      roleTitle: item.applications?.role_title || '',
      roundType,
    });
  };

  const upcomingCount = interviews.filter((i) => new Date(i.scheduled_at).getTime() >= now.getTime()).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 border border-slate-800 text-white shadow-lg">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Interviews & Schedule Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Keep track of all upcoming technical, behavioral, and screening rounds across your pipeline with live countdowns, calendar invites, and instant AI Mock prep.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-right">
            <span className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">
              Upcoming Rounds
            </span>
            <span className="text-xl font-bold text-sky-300">{upcomingCount}</span>
          </div>

          <Link href="/board">
            <Button variant="secondary" size="sm" className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Applications</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Control Bar: Tabs, Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'UPCOMING'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            onClick={() => setActiveTab('PAST')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'PAST'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Past Rounds ({interviews.length - upcomingCount})
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({interviews.length})
          </button>
        </div>

        {/* Search & Round Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, role or notes..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <select
            value={roundFilter}
            onChange={(e) => setRoundFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="ALL">All Round Formats</option>
            <option value="TECHNICAL">Technical / Coding</option>
            <option value="BEHAVIORAL">Behavioral / Culture</option>
            <option value="SYSTEM_DESIGN">System Design</option>
            <option value="HR">HR / Recruiter Screen</option>
          </select>

          <button
            onClick={fetchInterviews}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Refresh Schedule"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Interviews Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
          <div className="w-7 h-7 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading scheduled interviews...</p>
        </div>
      ) : filteredInterviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInterviews.map((item) => {
            const countdown = getCountdownLabel(item.scheduled_at);
            const dateObj = new Date(item.scheduled_at);

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500/50 dark:hover:border-sky-500/50 transition-all group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Countdown & Round Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${countdown.color}`}>
                      {countdown.text}
                    </span>

                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {item.round_type}
                    </span>
                  </div>

                  {/* Company & Role Details */}
                  <div>
                    <Link
                      href={`/applications/${item.application_id}`}
                      className="group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors inline-flex items-center gap-1.5"
                    >
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {item.applications?.company_name}
                      </h2>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {item.applications?.role_title}
                    </p>
                  </div>

                  {/* Date, Time & Mode Meta */}
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-sky-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {dateObj.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {(item.applications?.location || item.applications?.work_mode) && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>
                          {item.applications.work_mode || 'REMOTE'}
                          {item.applications.location ? ` (${item.applications.location})` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes Snippet */}
                  {item.notes && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                      <p className="line-clamp-2">
                        <strong className="text-amber-700 dark:text-amber-400">Notes:</strong>{' '}
                        {item.notes}
                      </p>
                    </div>
                  )}

                  {/* Outcome Tag if completed */}
                  {item.outcome && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400 text-[11px]">Outcome:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-[11px]">
                        {item.outcome}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Link
                    href={`/applications/${item.application_id}`}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1"
                  >
                    <span>View Application</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-1.5">
                    {/* Calendar ICS Export */}
                    <button
                      type="button"
                      onClick={() => handleExportIcs(item)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Add to Google / Apple Calendar (.ics)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* AI Mock Prep Trigger */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleLaunchAiPrep(item)}
                      className="flex items-center gap-1 text-xs py-1.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white shadow-sm"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>AI Mock Prep</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center border border-sky-200 dark:border-sky-800">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {searchQuery || roundFilter !== 'ALL'
                ? 'No matching interviews found'
                : activeTab === 'UPCOMING'
                ? 'No upcoming interviews scheduled'
                : 'No past interviews recorded'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {searchQuery || roundFilter !== 'ALL'
                ? 'Try adjusting your filters or search keywords.'
                : 'Schedule interview rounds on any active application to track dates, receive reminders, and generate AI mock questions.'}
            </p>
          </div>

          <Link href="/board">
            <Button variant="primary" size="sm" className="text-xs">
              <Briefcase className="w-3.5 h-3.5 mr-1" />
              <span>Browse Applications Board</span>
            </Button>
          </Link>
        </div>
      )}

      {/* AI Mock Interview Prep Modal */}
      <AiInterviewPrepModal
        isOpen={prepModalData.isOpen}
        onClose={() => setPrepModalData((prev) => ({ ...prev, isOpen: false }))}
        companyName={prepModalData.companyName}
        roleTitle={prepModalData.roleTitle}
        initialRoundType={prepModalData.roundType}
      />
    </div>
  );
}
