'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api-client';
import { InterviewWithApplication, InterviewRoundType } from '../../lib/types';
import { downloadIcsFile } from '../../lib/calendar';
import { useToast } from '../../components/ui/Toast';
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
  ExternalLink,
  ChevronRight,
  Plus,
  RefreshCw,
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
        text: pastDays === 0 ? 'Earlier today' : `${pastDays}d ago`,
        color: 'bg-[#18181B] text-zinc-400 border-[#27272A]',
      };
    }

    if (isToday) {
      return {
        text: `Today at ${target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-medium',
      };
    }

    if (diffDays === 1) {
      return {
        text: `Tomorrow at ${target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-medium',
      };
    }

    if (diffDays <= 7) {
      return {
        text: `In ${diffDays} days`,
        color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 font-medium',
      };
    }

    return {
      text: `In ${diffDays} days`,
      color: 'bg-[#18181B] text-zinc-300 border-[#27272A]',
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
      {/* Header Banner - Linear Developer Aesthetics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg bg-[#121214] border border-[#27272A] text-zinc-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#18181B] text-zinc-300 border border-[#27272A]">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[#FAFAFA]">
              Interviews & Schedule Hub
            </h1>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Keep track of all upcoming technical, behavioral, and screening rounds across your pipeline with live countdowns, calendar invites, and instant AI Mock prep.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0A0A0B] border border-[#27272A] text-xs">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
              Upcoming
            </span>
            <span className="font-mono font-semibold text-zinc-100">{upcomingCount}</span>
          </div>

          <Link href="/board">
            <Button variant="secondary" size="sm" className="text-xs font-mono">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Applications</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Control Bar: Tabs, Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#121214] p-3 rounded-lg border border-[#27272A]">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-[#0A0A0B] rounded-md border border-[#27272A]">
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              activeTab === 'UPCOMING'
                ? 'bg-[#18181B] text-zinc-100 border border-[#27272A] shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            onClick={() => setActiveTab('PAST')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              activeTab === 'PAST'
                ? 'bg-[#18181B] text-zinc-100 border border-[#27272A] shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Past ({interviews.length - upcomingCount})
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              activeTab === 'ALL'
                ? 'bg-[#18181B] text-zinc-100 border border-[#27272A] shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({interviews.length})
          </button>
        </div>

        {/* Search & Round Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, role or notes..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-[#0A0A0B] border border-[#27272A] text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
            />
          </div>

          <select
            value={roundFilter}
            onChange={(e) => setRoundFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-md bg-[#0A0A0B] border border-[#27272A] text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
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
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-[#18181B] border border-[#27272A] transition-colors"
            title="Refresh Schedule"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Interviews Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-400">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-zinc-400">Loading scheduled interviews...</p>
        </div>
      ) : filteredInterviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredInterviews.map((item) => {
            const countdown = getCountdownLabel(item.scheduled_at);
            const dateObj = new Date(item.scheduled_at);

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between p-4 rounded-lg bg-[#121214] border border-[#27272A] hover:border-[#3F3F46] transition-colors group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Countdown & Round Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${countdown.color}`}>
                      {countdown.text}
                    </span>

                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#18181B] text-zinc-300 border border-[#27272A]">
                      {item.round_type}
                    </span>
                  </div>

                  {/* Company & Role Details */}
                  <div>
                    <Link
                      href={`/applications/${item.application_id}`}
                      className="group-hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5"
                    >
                      <h2 className="text-sm font-semibold text-[#FAFAFA]">
                        {item.applications?.company_name}
                      </h2>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <p className="text-xs text-zinc-400 font-medium">
                      {item.applications?.role_title}
                    </p>
                  </div>

                  {/* Date, Time & Mode Meta */}
                  <div className="p-2.5 rounded-md bg-[#0A0A0B] border border-[#27272A] space-y-1.5 text-xs text-zinc-300">
                    <div className="flex items-center gap-2 font-mono">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-zinc-200">
                        {dateObj.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span>
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {(item.applications?.location || item.applications?.work_mode) && (
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                        <Building2 className="w-3 h-3 text-zinc-400" />
                        <span>
                          {item.applications.work_mode || 'REMOTE'}
                          {item.applications.location ? ` (${item.applications.location})` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes Snippet */}
                  {item.notes && (
                    <div className="text-xs text-zinc-300 bg-[#0A0A0B] p-2.5 rounded-md border border-[#27272A]">
                      <p className="line-clamp-2">
                        <span className="text-zinc-400 font-mono">Notes:</span>{' '}
                        {item.notes}
                      </p>
                    </div>
                  )}

                  {/* Outcome Tag if completed */}
                  {item.outcome && (
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-zinc-400 text-[11px]">Outcome:</span>
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                        {item.outcome}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 mt-3 border-t border-[#27272A] flex items-center justify-between gap-2">
                  <Link
                    href={`/applications/${item.application_id}`}
                    className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 font-mono transition-colors"
                  >
                    <span>View Application</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-1.5">
                    {/* Calendar ICS Export */}
                    <button
                      type="button"
                      onClick={() => handleExportIcs(item)}
                      className="p-1.5 rounded-md text-zinc-300 hover:bg-[#18181B] border border-[#27272A] transition-colors"
                      title="Add to Google / Apple Calendar (.ics)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* AI Mock Prep Trigger */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleLaunchAiPrep(item)}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-300" />
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
        <div className="p-12 rounded-lg bg-[#121214] border border-[#27272A] text-center space-y-4">
          <div className="w-10 h-10 rounded-md bg-[#18181B] text-zinc-300 mx-auto flex items-center justify-center border border-[#27272A]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[#FAFAFA]">
              {searchQuery || roundFilter !== 'ALL'
                ? 'No matching interviews found'
                : activeTab === 'UPCOMING'
                ? 'No upcoming interviews scheduled'
                : 'No past interviews recorded'}
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              {searchQuery || roundFilter !== 'ALL'
                ? 'Try adjusting your filters or search keywords.'
                : 'Schedule interview rounds on any active application to track dates, receive reminders, and generate AI mock questions.'}
            </p>
          </div>

          <Link href="/board">
            <Button variant="secondary" size="sm" className="text-xs font-mono">
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
