'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api-client';
import { AnalyticsData, Application } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { OfferComparisonMatrix } from './components/OfferComparisonMatrix';
import { PipelineHealthScorecard } from './components/PipelineHealthScorecard';
import { useToast } from '../../components/ui/Toast';
import {
  BarChart3,
  TrendingUp,
  Briefcase,
  Video,
  Award,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<AnalyticsData>('/applications/analytics');
      setData(res);
    } catch {
      showToast('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const apps = await apiFetch<Application[]>('/applications');
      
      if (!apps || apps.length === 0) {
        showToast('No applications to export', 'info');
        return;
      }

      const headers = [
        'Company Name',
        'Role Title',
        'Status',
        'Applied Date',
        'Job Posting URL',
        'Resume Attached',
        'Interviews Count',
        'Notes Count',
        'Created At',
      ];

      const rows = apps.map((app) => [
        `"${(app.company_name || '').replace(/"/g, '""')}"`,
        `"${(app.role_title || '').replace(/"/g, '""')}"`,
        app.status,
        app.applied_date ? app.applied_date.split('T')[0] : '',
        `"${(app.job_posting_url || '').replace(/"/g, '""')}"`,
        app.resumes?.version_label ? `"${app.resumes.version_label}"` : 'None',
        app._count?.interviews || 0,
        app._count?.notes || 0,
        app.created_at ? app.created_at.split('T')[0] : '',
      ]);

      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `job_applications_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Applications CSV exported successfully!', 'success');
    } catch {
      showToast('Failed to export applications data', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono">Calculating pipeline insights...</p>
        </div>
      </div>
    );
  }

  const overview = data?.overview || {
    totalApplications: 0,
    activeApplications: 0,
    totalInterviewsCount: 0,
    applicationsWithInterviews: 0,
    totalOffers: 0,
    statusCounts: { APPLIED: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0, WITHDRAWN: 0 },
    appliedToInterviewRate: 0,
    interviewToOfferRate: 0,
    overallOfferRate: 0,
    avgDaysToInterview: 0,
  };

  const monthlyVelocity = data?.monthlyVelocity || [];
  const staleApplications = data?.staleApplications || [];
  const maxVelocity = Math.max(...monthlyVelocity.map((m) => m.count), 1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg bg-[#121214] border border-[#27272A] text-zinc-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#18181B] text-zinc-300 border border-[#27272A]">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[#FAFAFA]">
              Analytics & Pipeline Insights
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Real-time conversion funnels, interview velocity, and follow-up alerts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-[#18181B] border border-[#27272A] transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            isLoading={exporting}
            className="text-xs font-mono"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Applications */}
        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Total Applications
            </span>
            <div className="p-1.5 rounded-md bg-[#18181B] text-zinc-300 border border-[#27272A]">
              <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-semibold text-[#FAFAFA]">
              {overview.totalApplications}
            </span>
            <span className="text-xs font-mono text-zinc-400">
              ({overview.activeApplications} active)
            </span>
          </div>
          <div className="mt-2 text-xs font-mono text-zinc-400 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {overview.statusCounts.APPLIED} awaiting response
          </div>
        </div>

        {/* Active Pipeline */}
        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              In-Progress Pipeline
            </span>
            <div className="p-1.5 rounded-md bg-[#18181B] text-zinc-300 border border-[#27272A]">
              <Video className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-semibold text-[#FAFAFA]">
              {overview.statusCounts.INTERVIEW}
            </span>
            <span className="text-xs font-mono text-amber-400">
              interviewing
            </span>
          </div>
          <div className="mt-2 text-xs font-mono text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            {overview.totalInterviewsCount} total rounds logged
          </div>
        </div>

        {/* Interview Rate */}
        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Interview Rate
            </span>
            <div className="p-1.5 rounded-md bg-[#18181B] text-zinc-300 border border-[#27272A]">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-semibold text-[#FAFAFA]">
              {overview.appliedToInterviewRate}%
            </span>
            <span className="text-xs font-mono text-zinc-400">
              conversion
            </span>
          </div>
          <div className="mt-2 text-xs font-mono text-zinc-400">
            <span className="text-zinc-300">
              {overview.applicationsWithInterviews}/{overview.totalApplications}
            </span>{' '}
            screened
          </div>
        </div>

        {/* Offers & Offer Rate */}
        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Job Offers
            </span>
            <div className="p-1.5 rounded-md bg-[#18181B] text-zinc-300 border border-[#27272A]">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-semibold text-emerald-400">
              {overview.totalOffers}
            </span>
            <span className="text-xs font-mono text-emerald-400">
              ({overview.overallOfferRate}% total)
            </span>
          </div>
          <div className="mt-2 text-xs font-mono text-zinc-400">
            {overview.interviewToOfferRate}% from interview stage
          </div>
        </div>
      </div>

      {/* Executive Pipeline Health Scorecard */}
      <PipelineHealthScorecard analytics={overview} />

      {/* Main Grid: Conversion Funnel & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Conversion Funnel (2 Columns) */}
        <div className="lg:col-span-2 bg-[#121214] border border-[#27272A] rounded-lg p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#27272A]">
            <div>
              <h2 className="text-sm font-semibold text-[#FAFAFA]">
                Application Pipeline Funnel
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Drop-off and conversion rates through hiring milestones
              </p>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 bg-[#18181B] px-2 py-0.5 rounded border border-[#27272A]">
              Conversion Funnel
            </span>
          </div>

          <div className="mt-5 space-y-5">
            {/* Step 1: Applied */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="w-5 h-5 rounded bg-[#18181B] text-zinc-300 border border-[#27272A] flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Applications Submitted</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#FAFAFA]">
                    {overview.totalApplications}
                  </span>
                  <span className="text-zinc-400">(100%)</span>
                </div>
              </div>
              <div className="h-3 bg-[#0A0A0B] rounded border border-[#27272A] overflow-hidden p-0.5">
                <div
                  className="h-full bg-zinc-400 rounded-xs transition-all duration-500"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Step 2: Interviews */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="w-5 h-5 rounded bg-[#18181B] text-zinc-300 border border-[#27272A] flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Reached Interview Stage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#FAFAFA]">
                    {overview.applicationsWithInterviews}
                  </span>
                  <span className="text-amber-400">
                    ({overview.appliedToInterviewRate}%)
                  </span>
                </div>
              </div>
              <div className="h-3 bg-[#0A0A0B] rounded border border-[#27272A] overflow-hidden p-0.5">
                <div
                  className="h-full bg-amber-500 rounded-xs transition-all duration-500"
                  style={{
                    width: `${Math.max(overview.appliedToInterviewRate, overview.applicationsWithInterviews > 0 ? 5 : 0)}%`,
                  }}
                />
              </div>
            </div>

            {/* Step 3: Offers */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="w-5 h-5 rounded bg-[#18181B] text-zinc-300 border border-[#27272A] flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Received Offers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-400">
                    {overview.totalOffers}
                  </span>
                  <span className="text-emerald-400">
                    ({overview.overallOfferRate}%)
                  </span>
                </div>
              </div>
              <div className="h-3 bg-[#0A0A0B] rounded border border-[#27272A] overflow-hidden p-0.5">
                <div
                  className="h-full bg-emerald-500 rounded-xs transition-all duration-500"
                  style={{
                    width: `${Math.max(overview.overallOfferRate, overview.totalOffers > 0 ? 5 : 0)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Efficiency Metric Footnote */}
          <div className="mt-6 pt-3.5 border-t border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2 font-mono">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                Avg response time to first interview:{' '}
                <strong className="text-zinc-200">
                  {overview.avgDaysToInterview > 0 ? `${overview.avgDaysToInterview} days` : 'N/A'}
                </strong>
              </span>
            </div>
            <Link
              href="/board"
              className="inline-flex items-center gap-1 text-indigo-400 hover:underline font-mono"
            >
              <span>Kanban Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Status Distribution Breakdown (1 Column) */}
        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#27272A]">
              <h2 className="text-sm font-semibold text-[#FAFAFA]">
                Status Distribution
              </h2>
              <span className="text-xs font-mono text-zinc-400">{overview.totalApplications} total</span>
            </div>

            {/* Stacked Progress Bar */}
            {overview.totalApplications > 0 ? (
              <div className="mt-4 h-2.5 rounded bg-[#0A0A0B] border border-[#27272A] flex overflow-hidden">
                <div
                  className="bg-zinc-400"
                  style={{
                    width: `${(overview.statusCounts.APPLIED / overview.totalApplications) * 100}%`,
                  }}
                  title={`Applied: ${overview.statusCounts.APPLIED}`}
                />
                <div
                  className="bg-amber-400"
                  style={{
                    width: `${(overview.statusCounts.INTERVIEW / overview.totalApplications) * 100}%`,
                  }}
                  title={`Interview: ${overview.statusCounts.INTERVIEW}`}
                />
                <div
                  className="bg-emerald-400"
                  style={{
                    width: `${(overview.statusCounts.OFFER / overview.totalApplications) * 100}%`,
                  }}
                  title={`Offer: ${overview.statusCounts.OFFER}`}
                />
                <div
                  className="bg-rose-400"
                  style={{
                    width: `${(overview.statusCounts.REJECTED / overview.totalApplications) * 100}%`,
                  }}
                  title={`Rejected: ${overview.statusCounts.REJECTED}`}
                />
                <div
                  className="bg-zinc-600"
                  style={{
                    width: `${(overview.statusCounts.WITHDRAWN / overview.totalApplications) * 100}%`,
                  }}
                  title={`Withdrawn: ${overview.statusCounts.WITHDRAWN}`}
                />
              </div>
            ) : null}

            {/* Detailed Status Breakdown Rows */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-[#18181B] transition-colors font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-400" />
                  <span className="text-zinc-300">Applied</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#FAFAFA]">
                    {overview.statusCounts.APPLIED}
                  </span>
                  <span className="text-zinc-400 w-10 text-right">
                    {overview.totalApplications > 0
                      ? `${Math.round((overview.statusCounts.APPLIED / overview.totalApplications) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-[#18181B] transition-colors font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-zinc-300">Interviewing</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#FAFAFA]">
                    {overview.statusCounts.INTERVIEW}
                  </span>
                  <span className="text-zinc-400 w-10 text-right">
                    {overview.totalApplications > 0
                      ? `${Math.round((overview.statusCounts.INTERVIEW / overview.totalApplications) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-[#18181B] transition-colors font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-zinc-300">Offers</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-emerald-400">
                    {overview.statusCounts.OFFER}
                  </span>
                  <span className="text-zinc-400 w-10 text-right">
                    {overview.totalApplications > 0
                      ? `${Math.round((overview.statusCounts.OFFER / overview.totalApplications) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-[#18181B] transition-colors font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-zinc-300">Rejected</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#FAFAFA]">
                    {overview.statusCounts.REJECTED}
                  </span>
                  <span className="text-zinc-400 w-10 text-right">
                    {overview.totalApplications > 0
                      ? `${Math.round((overview.statusCounts.REJECTED / overview.totalApplications) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-[#18181B] transition-colors font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-600" />
                  <span className="text-zinc-300">Withdrawn</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#FAFAFA]">
                    {overview.statusCounts.WITHDRAWN}
                  </span>
                  <span className="text-zinc-400 w-10 text-right">
                    {overview.totalApplications > 0
                      ? `${Math.round((overview.statusCounts.WITHDRAWN / overview.totalApplications) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[#27272A]">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center text-xs font-mono"
              onClick={handleExportCSV}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-2 text-zinc-400" />
              Download Dataset
            </Button>
          </div>
        </div>
      </div>

      {/* Offer & Compensation Comparison Matrix */}
      <OfferComparisonMatrix />

      {/* Monthly Velocity & Stale Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Activity Velocity */}
        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#27272A]">
            <div>
              <h2 className="text-sm font-semibold text-[#FAFAFA]">
                Application Activity Velocity
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Number of applications submitted per month
              </p>
            </div>
            <Calendar className="w-4 h-4 text-zinc-400" />
          </div>

          {/* Bar Chart Visualizer */}
          <div className="mt-6 flex items-end justify-between gap-3 h-40 px-2">
            {monthlyVelocity.map((item, idx) => {
              const heightPct = Math.round((item.count / maxVelocity) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[11px] font-mono text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div className="w-full bg-[#0A0A0B] border border-[#27272A] rounded-t h-28 flex items-end p-0.5">
                    <div
                      className="w-full bg-indigo-600 rounded-t-xs transition-all duration-500 group-hover:bg-indigo-500"
                      style={{
                        height: `${Math.max(heightPct, item.count > 0 ? 12 : 4)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actionable Follow-up Alerts & Stale Applications */}
        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-[#FAFAFA]">
                  Follow-Up Recommendations
                </h2>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                staleApplications.length > 0
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {staleApplications.length} Stale
              </span>
            </div>

            {staleApplications.length > 0 ? (
              <div className="mt-3.5 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                <p className="text-xs text-amber-300 bg-[#0A0A0B] p-2.5 rounded-md border border-[#27272A]">
                  These applications have been awaiting an initial response for over 14 days. Consider sending a friendly follow-up email.
                </p>

                {staleApplications.map((stale) => (
                  <Link
                    key={stale.id}
                    href={`/applications/${stale.id}`}
                    className="flex items-center justify-between p-2.5 rounded-md border border-[#27272A] hover:border-[#3F3F46] bg-[#0A0A0B] transition-colors group"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-[#FAFAFA] group-hover:text-indigo-400 transition-colors">
                        {stale.company_name}
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        {stale.role_title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        {stale.days_waiting}d waiting
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center text-center p-6 bg-[#0A0A0B] rounded-lg border border-[#27272A]">
                <div className="w-8 h-8 rounded-md bg-[#18181B] text-emerald-400 flex items-center justify-center mb-2 border border-[#27272A]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold text-[#FAFAFA]">
                  All Applications are Fresh
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xs">
                  No applications have been waiting over 14 days without an update.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3.5 border-t border-[#27272A] text-[11px] font-mono text-zinc-400 text-center">
            Automated health checks run on every pipeline sync
          </div>
        </div>
      </div>
    </div>
  );
}
