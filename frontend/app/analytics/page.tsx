'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api-client';
import { AnalyticsData, Application } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
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
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Calculating application insights...</p>
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

  const funnel = data?.funnel || [];
  const monthlyVelocity = data?.monthlyVelocity || [];
  const staleApplications = data?.staleApplications || [];
  const maxVelocity = Math.max(...monthlyVelocity.map((m) => m.count), 1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Analytics & Pipeline Insights
            </h1>
            <Badge variant="info">Live</Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time conversion funnels, interview velocity, and follow-up alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            isLoading={loading}
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            isLoading={exporting}
            className="shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Applications
            </span>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {overview.totalApplications}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({overview.activeApplications} active)
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            {overview.statusCounts.APPLIED} awaiting first response
          </div>
        </div>

        {/* Active Pipeline */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              In-Progress Pipeline
            </span>
            <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {overview.statusCounts.INTERVIEW}
            </span>
            <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
              interviewing
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {overview.totalInterviewsCount} total rounds logged
          </div>
        </div>

        {/* Interview Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Interview Rate
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {overview.appliedToInterviewRate}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              conversion
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {overview.applicationsWithInterviews} of {overview.totalApplications}
            </span>{' '}
            applications screened
          </div>
        </div>

        {/* Offers & Offer Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Job Offers
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {overview.totalOffers}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ({overview.overallOfferRate}% total rate)
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {overview.interviewToOfferRate}% from interview stage
          </div>
        </div>
      </div>

      {/* Main Grid: Conversion Funnel & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel (2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Application Pipeline Funnel
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Drop-off and conversion rates through hiring milestones
              </p>
            </div>
            <div className="text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1 rounded-md">
              Funnel Health
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {/* Step 1: Applied */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 flex items-center justify-center text-xs">
                    1
                  </div>
                  <span>Applications Submitted</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {overview.totalApplications}
                  </span>
                  <span className="text-xs text-slate-500">(100%)</span>
                </div>
              </div>
              <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full transition-all duration-500"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Step 2: Interviews */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-600 dark:text-violet-300 flex items-center justify-center text-xs">
                    2
                  </div>
                  <span>Reached Interview Stage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {overview.applicationsWithInterviews}
                  </span>
                  <span className="text-xs text-violet-600 dark:text-violet-400 font-semibold">
                    ({overview.appliedToInterviewRate}%)
                  </span>
                </div>
              </div>
              <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(overview.appliedToInterviewRate, overview.applicationsWithInterviews > 0 ? 5 : 0)}%`,
                  }}
                />
              </div>
            </div>

            {/* Step 3: Offers */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-xs">
                    3
                  </div>
                  <span>Received Offers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {overview.totalOffers}
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    ({overview.overallOfferRate}%)
                  </span>
                </div>
              </div>
              <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(overview.overallOfferRate, overview.totalOffers > 0 ? 5 : 0)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Efficiency Metric Footnote */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-500" />
              <span>
                Average response time to first interview:{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {overview.avgDaysToInterview > 0 ? `${overview.avgDaysToInterview} days` : 'N/A'}
                </strong>
              </span>
            </div>
            <Link
              href="/board"
              className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-medium"
            >
              <span>View Kanban Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Status Distribution Breakdown (1 Column) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Status Distribution
              </h2>
              <span className="text-xs text-slate-500">{overview.totalApplications} total</span>
            </div>

            {/* Stacked Progress Bar */}
            {overview.totalApplications > 0 ? (
              <div className="mt-5 h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
                <div
                  className="bg-sky-500"
                  style={{
                    width: `${(overview.statusCounts.APPLIED / overview.totalApplications) * 100}%`,
                  }}
                  title={`Applied: ${overview.statusCounts.APPLIED}`}
                />
                <div
                  className="bg-violet-500"
                  style={{
                    width: `${(overview.statusCounts.INTERVIEW / overview.totalApplications) * 100}%`,
                  }}
                  title={`Interview: ${overview.statusCounts.INTERVIEW}`}
                />
                <div
                  className="bg-emerald-500"
                  style={{
                    width: `${(overview.statusCounts.OFFER / overview.totalApplications) * 100}%`,
                  }}
                  title={`Offer: ${overview.statusCounts.OFFER}`}
                />
                <div
                  className="bg-rose-500"
                  style={{
                    width: `${(overview.statusCounts.REJECTED / overview.totalApplications) * 100}%`,
                  }}
                  title={`Rejected: ${overview.statusCounts.REJECTED}`}
                />
                <div
                  className="bg-slate-400"
                  style={{
                    width: `${(overview.statusCounts.WITHDRAWN / overview.totalApplications) * 100}%`,
                  }}
                  title={`Withdrawn: ${overview.statusCounts.WITHDRAWN}`}
                />
              </div>
            ) : null}

            {/* Detailed Status Breakdown Rows */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Applied</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {overview.statusCounts.APPLIED}
                  </span>
                  <span className="text-xs text-slate-400 w-10 text-right">
                    {overview.totalApplications > 0
                      ? `${Math.round((overview.statusCounts.APPLIED / overview.totalApplications) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Interviewing</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {overview.statusCounts.INTERVIEW}
                  </span>
                  <span className="text-xs text-slate-400 w-10 text-right">
                    {overview.totalApplications > 0
                      ? `${Math.round((overview.statusCounts.INTERVIEW / overview.totalApplications) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Offers</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {overview.statusCounts.OFFER}
                  </span>
                  <span className="text-xs text-slate-400 w-10 text-right">
                    {overview.totalApplications > 0
                      ? `${Math.round((overview.statusCounts.OFFER / overview.totalApplications) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Rejected</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {overview.statusCounts.REJECTED}
                  </span>
                  <span className="text-xs text-slate-400 w-10 text-right">
                    {overview.totalApplications > 0
                      ? `${Math.round((overview.statusCounts.REJECTED / overview.totalApplications) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Withdrawn</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {overview.statusCounts.WITHDRAWN}
                  </span>
                  <span className="text-xs text-slate-400 w-10 text-right">
                    {overview.totalApplications > 0
                      ? `${Math.round((overview.statusCounts.WITHDRAWN / overview.totalApplications) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center"
              onClick={handleExportCSV}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Dataset
            </Button>
          </div>
        </div>
      </div>

      {/* Monthly Velocity & Stale Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity Velocity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Application Activity Velocity
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Number of applications submitted per month
              </p>
            </div>
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>

          {/* Bar Chart Visualizer */}
          <div className="mt-8 flex items-end justify-between gap-3 h-44 px-2">
            {monthlyVelocity.map((item, idx) => {
              const heightPct = Math.round((item.count / maxVelocity) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-32 flex items-end p-1">
                    <div
                      className="w-full bg-gradient-to-t from-sky-600 to-sky-400 dark:from-sky-500 dark:to-sky-300 rounded-t-md transition-all duration-500 group-hover:brightness-110"
                      style={{
                        height: `${Math.max(heightPct, item.count > 0 ? 12 : 4)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actionable Follow-up Alerts & Stale Applications */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Follow-Up Recommendations
                </h2>
              </div>
              <Badge variant={staleApplications.length > 0 ? 'warning' : 'success'}>
                {staleApplications.length} Stale
              </Badge>
            </div>

            {staleApplications.length > 0 ? (
              <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-1">
                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/50">
                  These applications have been awaiting an initial response for over 14 days. Consider sending a friendly follow-up email to the recruiter.
                </p>

                {staleApplications.map((stale) => (
                  <Link
                    key={stale.id}
                    href={`/applications/${stale.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 bg-slate-50/50 dark:bg-slate-800/30 transition-all hover:shadow-xs group"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400">
                        {stale.company_name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {stale.role_title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-900/50 px-2 py-0.5 rounded-md">
                        {stale.days_waiting}d waiting
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-8 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  All Applications are Fresh!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  No applications have been waiting over 14 days without an update. Great pipeline management!
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 text-center">
            Automated health checks run on every pipeline sync
          </div>
        </div>
      </div>
    </div>
  );
}
