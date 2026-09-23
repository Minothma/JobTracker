'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../lib/api-client';
import { Application, WorkMode } from '../../lib/types';
import { KanbanBoard } from './components/KanbanBoard';
import { ApplicationsTable } from './components/ApplicationsTable';
import { NewApplicationModal } from './components/NewApplicationModal';
import { Button } from '../../components/ui/Button';
import {
  Plus,
  Search,
  RefreshCw,
  Briefcase,
  Video,
  Award,
  LayoutGrid,
  List,
  Download,
  Bookmark,
  Star,
  AlertTriangle,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { exportApplicationsToCsv } from '../../lib/export-csv';
import { useToast } from '../../components/ui/Toast';
import { JobClipperModal } from '../../components/JobClipperModal';
import { WeeklyGoalMeter } from '../../components/WeeklyGoalMeter';
import { isApplicationStarred } from '../../lib/favorites';

export default function BoardPage() {
  const { showToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Controls State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [workModeFilter, setWorkModeFilter] = useState<string>('ALL');
  const [starredOnly, setStarredOnly] = useState<boolean>(false);
  const [staleOnly, setStaleOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'applied_desc' | 'applied_asc' | 'company_asc' | 'salary_desc'>('applied_desc');

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isClipperModalOpen, setIsClipperModalOpen] = useState<boolean>(false);
  const [clipPrefill, setClipPrefill] = useState<{
    company_name?: string;
    role_title?: string;
    job_posting_url?: string;
    job_description?: string;
  } | undefined>(undefined);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Application[]>('/applications');
      setApplications(data || []);
    } catch {
      showToast('Failed to load applications. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const clipUrl = params.get('clip_url');
      const clipTitle = params.get('clip_title');
      const clipDesc = params.get('clip_desc');

      if (clipUrl || clipTitle) {
        let role = clipTitle || '';
        let comp = '';
        if (role.includes(' at ')) {
          const parts = role.split(' at ');
          role = parts[0].trim();
          comp = parts[1].split('|')[0].split('-')[0].trim();
        } else if (role.includes(' - ')) {
          const parts = role.split(' - ');
          role = parts[0].trim();
          comp = parts[1].split('|')[0].trim();
        }

        setClipPrefill({
          role_title: role,
          company_name: comp,
          job_posting_url: clipUrl || undefined,
          job_description: clipDesc || undefined,
        });
        setIsNewModalOpen(true);
        showToast('Job clipped from browser! Review and save below.', 'success');
      }
    }
  }, []);

  const handleApplicationCreated = (newApp: Application) => {
    setApplications((prev) => [newApp, ...prev]);
    setClipPrefill(undefined);
  };

  const handleExportCsv = () => {
    if (filteredApplications.length === 0) {
      showToast('No applications to export', 'info');
      return;
    }
    exportApplicationsToCsv(filteredApplications);
    showToast(`Exported ${filteredApplications.length} application(s) to CSV!`, 'success');
  };

  // Filtered applications based on search and filters
  const filteredApplications = useMemo(() => {
    let list = [...applications];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (app) =>
          app.company_name.toLowerCase().includes(q) ||
          app.role_title.toLowerCase().includes(q) ||
          app.job_description?.toLowerCase().includes(q),
      );
    }

    // Work Mode
    if (workModeFilter !== 'ALL') {
      list = list.filter((app) => (app.work_mode || 'REMOTE') === workModeFilter);
    }

    // Starred only
    if (starredOnly) {
      list = list.filter((app) => app.is_favorite || isApplicationStarred(app.id));
    }

    // Stale only (>14 days in APPLIED with no interviews)
    if (staleOnly) {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      list = list.filter(
        (app) =>
          app.status === 'APPLIED' &&
          new Date(app.applied_date) <= fourteenDaysAgo &&
          (!app.interviews || app.interviews.length === 0),
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'applied_desc') {
        return new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime();
      }
      if (sortBy === 'applied_asc') {
        return new Date(a.applied_date).getTime() - new Date(b.applied_date).getTime();
      }
      if (sortBy === 'company_asc') {
        return a.company_name.localeCompare(b.company_name);
      }
      if (sortBy === 'salary_desc') {
        const salA = Number(a.salary_max || a.salary_min || 0);
        const salB = Number(b.salary_max || b.salary_min || 0);
        return salB - salA;
      }
      return 0;
    });

    return list;
  }, [applications, searchQuery, workModeFilter, starredOnly, staleOnly, sortBy]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = applications.length;
    const interviews = applications.filter((a) => a.status === 'INTERVIEW').length;
    const offers = applications.filter((a) => a.status === 'OFFER').length;
    const active = applications.filter((a) => a.status === 'APPLIED' || a.status === 'INTERVIEW').length;
    return { total, interviews, offers, active };
  }, [applications]);

  return (
    <div className="space-y-6">
      {/* Header with Title, View Modes & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Application Board
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track and accelerate your hiring pipeline with AI tools, velocity metrics, and calendar integrations
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Table / Spreadsheet List View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsClipperModalOpen(true)}
            title="1-Click Browser Job Clipper Bookmarklet"
            className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <Bookmark className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            <span>Job Clipper</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            title="Export applications to CSV"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchApplications}
            isLoading={loading}
            title="Refresh board"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Button
            size="md"
            onClick={() => {
              setClipPrefill(undefined);
              setIsNewModalOpen(true);
            }}
            className="shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Weekly Goal Progress & Active Streak Widget */}
      <WeeklyGoalMeter applications={applications} />

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Applications</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{metrics.total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Active Pipeline</p>
            <p className="text-lg font-bold text-sky-600 dark:text-sky-400">{metrics.active}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">In Interview</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{metrics.interviews}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Offers Received</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{metrics.offers}</p>
          </div>
        </div>
      </div>

      {/* Advanced Filter & Search Toolbar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company, role or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills & Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Work Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
              {['ALL', 'REMOTE', 'HYBRID', 'ONSITE'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setWorkModeFilter(mode)}
                  className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
                    workModeFilter === mode
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {mode === 'ALL' ? 'All Modes' : mode}
                </button>
              ))}
            </div>

            {/* Starred Toggle */}
            <button
              onClick={() => setStarredOnly((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                starredOnly
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${starredOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Starred</span>
            </button>

            {/* Stale Alert Toggle */}
            <button
              onClick={() => setStaleOnly((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                staleOnly
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Filter applications waiting >14 days in Applied stage"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Needs Attention</span>
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
            >
              <option value="applied_desc">Latest Applied</option>
              <option value="applied_asc">Oldest Applied</option>
              <option value="company_asc">Company (A-Z)</option>
              <option value="salary_desc">Highest Salary</option>
            </select>
          </div>
        </div>

        {/* Filter Summary indicator */}
        {(workModeFilter !== 'ALL' || starredOnly || staleOnly || searchQuery) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>
              Showing <strong>{filteredApplications.length}</strong> of {applications.length} applications
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setWorkModeFilter('ALL');
                setStarredOnly(false);
                setStaleOnly(false);
                setSortBy('applied_desc');
              }}
              className="text-sky-600 dark:text-sky-400 hover:underline text-[11px]"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Content: Kanban Board or Table View */}
      {loading && applications.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="w-7 h-7 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading applications...</p>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          applications={filteredApplications}
          onApplicationsChange={setApplications}
        />
      ) : (
        <ApplicationsTable
          applications={filteredApplications}
          onApplicationsChange={setApplications}
        />
      )}

      {/* New Application Modal */}
      <NewApplicationModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setClipPrefill(undefined);
        }}
        onSuccess={handleApplicationCreated}
        initialData={clipPrefill}
      />

      {/* 1-Click Browser Job Clipper Modal */}
      <JobClipperModal
        isOpen={isClipperModalOpen}
        onClose={() => setIsClipperModalOpen(false)}
      />
    </div>
  );
}
