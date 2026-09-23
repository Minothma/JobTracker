'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../lib/api-client';
import { Application } from '../../lib/types';
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
  X,
  Layers,
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
        showToast('Job clipped from browser. Review and save below.', 'success');
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
    showToast(`Exported ${filteredApplications.length} application(s) to CSV`, 'success');
  };

  // Filtered applications based on search and filters
  const filteredApplications = useMemo(() => {
    let list = [...applications];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (app) =>
          app.company_name.toLowerCase().includes(q) ||
          app.role_title.toLowerCase().includes(q) ||
          app.job_description?.toLowerCase().includes(q),
      );
    }

    if (workModeFilter !== 'ALL') {
      list = list.filter((app) => (app.work_mode || 'REMOTE') === workModeFilter);
    }

    if (starredOnly) {
      list = list.filter((app) => app.is_favorite || isApplicationStarred(app.id));
    }

    if (staleOnly) {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      list = list.filter(
        (app) =>
          app.status === 'APPLIED' &&
          new Date(app.applied_date) <= fourteenDaysAgo &&
          (!app.interviews || app.interviews.length === 0),
      );
    }

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

  const metrics = useMemo(() => {
    const total = applications.length;
    const interviews = applications.filter((a) => a.status === 'INTERVIEW').length;
    const offers = applications.filter((a) => a.status === 'OFFER').length;
    const active = applications.filter((a) => a.status === 'APPLIED' || a.status === 'INTERVIEW').length;
    return { total, interviews, offers, active };
  }, [applications]);

  return (
    <div className="space-y-5 text-[#FAFAFA]">
      {/* Header with Title, View Modes & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight">
              Applications
            </h1>
            <span className="text-xs font-mono text-[#71717A] bg-[#18181B] border border-[#27272A] px-2 py-0.5 rounded">
              {applications.length} total
            </span>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Manage stages, AI interview prep, ATS keyword scores, and offer packages.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#121214] p-0.5 rounded-md border border-[#27272A]">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[#27272A] text-[#FAFAFA]'
                  : 'text-[#71717A] hover:text-[#FAFAFA]'
              }`}
              title="Kanban Board"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>board</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#27272A] text-[#FAFAFA]'
                  : 'text-[#71717A] hover:text-[#FAFAFA]'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span>table</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsClipperModalOpen(true)}
            title="1-Click Browser Job Clipper Bookmarklet"
          >
            <Bookmark className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            <span>Clipper</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            title="Export applications to CSV"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-[#A1A1AA]" />
            <span>Export</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchApplications}
            isLoading={loading}
            title="Refresh pipeline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setClipPrefill(undefined);
              setIsNewModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Weekly Goal Progress & Active Streak Widget */}
      <WeeklyGoalMeter applications={applications} />

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-3">
          <p className="text-xs text-[#71717A] font-mono">Total Pipeline</p>
          <p className="text-lg font-mono font-semibold text-[#FAFAFA] mt-1">{metrics.total}</p>
        </div>

        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-3">
          <p className="text-xs text-[#71717A] font-mono">Active (Applied/Interview)</p>
          <p className="text-lg font-mono font-semibold text-indigo-400 mt-1">{metrics.active}</p>
        </div>

        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-3">
          <p className="text-xs text-[#71717A] font-mono">In Interview</p>
          <p className="text-lg font-mono font-semibold text-amber-400 mt-1">{metrics.interviews}</p>
        </div>

        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-3">
          <p className="text-xs text-[#71717A] font-mono">Offers Received</p>
          <p className="text-lg font-mono font-semibold text-emerald-400 mt-1">{metrics.offers}</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-3 bg-[#121214] border border-[#27272A] rounded-lg space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#52525B]" />
            <input
              type="text"
              placeholder="Search company, role, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-[#0A0A0B] border border-[#27272A] rounded-md text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills & Toggles */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {/* Work Mode Switcher */}
            <div className="flex items-center gap-0.5 bg-[#0A0A0B] border border-[#27272A] p-0.5 rounded-md">
              {['ALL', 'REMOTE', 'HYBRID', 'ONSITE'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setWorkModeFilter(mode)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    workModeFilter === mode
                      ? 'bg-[#27272A] text-[#FAFAFA]'
                      : 'text-[#71717A] hover:text-[#FAFAFA]'
                  }`}
                >
                  {mode.toLowerCase()}
                </button>
              ))}
            </div>

            {/* Starred Toggle */}
            <button
              onClick={() => setStarredOnly((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border transition-colors ${
                starredOnly
                  ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                  : 'bg-[#0A0A0B] border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${starredOnly ? 'fill-amber-400 text-amber-400' : 'text-[#71717A]'}`} />
              <span>starred</span>
            </button>

            {/* Stale Alert Toggle */}
            <button
              onClick={() => setStaleOnly((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border transition-colors ${
                staleOnly
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : 'bg-[#0A0A0B] border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
              title="Applications with no updates for >14 days"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>stale (&gt;14d)</span>
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-2 py-1 rounded-md bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
            >
              <option value="applied_desc">latest applied</option>
              <option value="applied_asc">oldest applied</option>
              <option value="company_asc">company (a-z)</option>
              <option value="salary_desc">highest salary</option>
            </select>
          </div>
        </div>

        {/* Filter Summary indicator */}
        {(workModeFilter !== 'ALL' || starredOnly || staleOnly || searchQuery) && (
          <div className="flex items-center justify-between pt-2 border-t border-[#27272A] text-xs font-mono text-[#71717A]">
            <span>
              Showing {filteredApplications.length} of {applications.length} applications
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setWorkModeFilter('ALL');
                setStarredOnly(false);
                setStaleOnly(false);
                setSortBy('applied_desc');
              }}
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              reset filters
            </button>
          </div>
        )}
      </div>

      {/* Content: Kanban Board or Table View */}
      {loading && applications.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-2 text-[#71717A]">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Loading applications...</p>
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
