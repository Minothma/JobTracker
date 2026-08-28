'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../lib/api-client';
import { Application } from '../../lib/types';
import { KanbanBoard } from './components/KanbanBoard';
import { NewApplicationModal } from './components/NewApplicationModal';
import { Button } from '../../components/ui/Button';
import { Plus, Search, RefreshCw, Briefcase, Video, Award } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

export default function BoardPage() {
  const { showToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Application[]>('/applications');
      setApplications(data);
    } catch (err: any) {
      showToast('Failed to load applications. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApplicationCreated = (newApp: Application) => {
    setApplications((prev) => [newApp, ...prev]);
  };

  // Filtered applications based on search
  const filteredApplications = useMemo(() => {
    if (!searchQuery.trim()) return applications;
    const q = searchQuery.toLowerCase();
    return applications.filter(
      (app) =>
        app.company_name.toLowerCase().includes(q) ||
        app.role_title.toLowerCase().includes(q),
    );
  }, [applications, searchQuery]);

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
      {/* Header with Title, Metrics, and Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Application Board
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your internship and job applications across stages
          </p>
        </div>

        <div className="flex items-center gap-3">
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
            onClick={() => setIsNewModalOpen(true)}
            className="shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Application
          </Button>
        </div>
      </div>

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

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by company or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Kanban Board Container */}
      {loading && applications.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="w-7 h-7 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading applications...</p>
          </div>
        </div>
      ) : (
        <KanbanBoard
          applications={filteredApplications}
          onApplicationsChange={setApplications}
        />
      )}

      {/* New Application Modal */}
      <NewApplicationModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={handleApplicationCreated}
      />
    </div>
  );
}
