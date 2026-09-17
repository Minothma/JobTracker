'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Application, ApplicationStatus } from '../../../lib/types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api-client';
import { useToast } from '../../../components/ui/Toast';
import { exportApplicationsToCsv } from '../../../lib/export-csv';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Trash2,
  Eye,
  FileText,
  Video,
  StickyNote,
  Calendar,
  Building2,
  Download,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  Star,
} from 'lucide-react';
import {
  isApplicationStarred,
  toggleFavoriteApi,
  toggleStarredApplicationId,
  STARRED_CHANGED_EVENT,
} from '../../../lib/favorites';

interface ApplicationsTableProps {
  applications: Application[];
  onApplicationsChange: (updated: Application[]) => void;
}

type SortField = 'starred' | 'company_name' | 'role_title' | 'status' | 'applied_date';

const STATUS_OPTIONS: { label: string; value: ApplicationStatus }[] = [
  { label: 'Applied', value: 'APPLIED' },
  { label: 'Interview', value: 'INTERVIEW' },
  { label: 'Offer', value: 'OFFER' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Withdrawn', value: 'WITHDRAWN' },
];

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  applications,
  onApplicationsChange,
}) => {
  const { showToast } = useToast();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('starred');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);
  const [starredChangeCounter, setStarredChangeCounter] = useState<number>(0);

  // Sync starred changes across components
  React.useEffect(() => {
    const handleStarredChanged = () => {
      setStarredChangeCounter((prev) => prev + 1);
    };

    window.addEventListener(STARRED_CHANGED_EVENT, handleStarredChanged);
    return () => {
      window.removeEventListener(STARRED_CHANGED_EVENT, handleStarredChanged);
    };
  }, []);

  const handleToggleStar = async (appId: string, currentStarred: boolean) => {
    const next = await toggleFavoriteApi(appId, currentStarred);
    onApplicationsChange(
      applications.map((app) => (app.id === appId ? { ...app, is_favorite: next } : app)),
    );
  };

  // Status Filter Counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: applications.length,
      STARRED: 0,
      APPLIED: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };
    applications.forEach((app) => {
      if (counts[app.status] !== undefined) {
        counts[app.status]++;
      }
      if (app.is_favorite || isApplicationStarred(app.id)) {
        counts.STARRED++;
      }
    });
    return counts;
  }, [applications, starredChangeCounter]);

  // Filter & Sort Applications
  const processedApplications = useMemo(() => {
    let result = [...applications];

    if (selectedStatusFilter === 'STARRED') {
      result = result.filter((app) => app.is_favorite || isApplicationStarred(app.id));
    } else if (selectedStatusFilter !== 'ALL') {
      result = result.filter((app) => app.status === selectedStatusFilter);
    }

    result.sort((a, b) => {
      if (sortField === 'starred') {
        const aStar = (a.is_favorite || isApplicationStarred(a.id)) ? 1 : 0;
        const bStar = (b.is_favorite || isApplicationStarred(b.id)) ? 1 : 0;
        return sortAsc ? aStar - bStar : bStar - aStar;
      }

      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';

      if (sortField === 'applied_date') {
        const aTime = new Date(a.applied_date).getTime();
        const bTime = new Date(b.applied_date).getTime();
        return sortAsc ? aTime - bTime : bTime - aTime;
      }

      if (typeof aVal === 'string') {
        return sortAsc
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      return 0;
    });

    return result;
  }, [applications, selectedStatusFilter, sortField, sortAsc, starredChangeCounter]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Selection Logic
  const isAllSelected =
    processedApplications.length > 0 &&
    processedApplications.every((app) => selectedIds.has(app.id));

  const isSomeSelected =
    processedApplications.some((app) => selectedIds.has(app.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const next = new Set(selectedIds);
      processedApplications.forEach((app) => next.delete(app.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      processedApplications.forEach((app) => next.add(app.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Inline Status Change
  const handleInlineStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      const updated = await apiFetch<Application>(`/applications/${appId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      onApplicationsChange(
        applications.map((item) => (item.id === appId ? { ...item, status: updated.status } : item)),
      );
      showToast(`Status updated to ${newStatus}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  // Single Delete
  const handleDelete = async (appId: string, companyName: string) => {
    if (!window.confirm(`Are you sure you want to delete application for ${companyName}?`)) return;

    try {
      await apiFetch(`/applications/${appId}`, { method: 'DELETE' });
      onApplicationsChange(applications.filter((item) => item.id !== appId));
      if (selectedIds.has(appId)) {
        const next = new Set(selectedIds);
        next.delete(appId);
        setSelectedIds(next);
      }
      showToast('Application deleted', 'success');
    } catch {
      showToast('Failed to delete application', 'error');
    }
  };

  // Bulk Actions
  const handleBulkStatusChange = async (newStatus: ApplicationStatus) => {
    if (selectedIds.size === 0) return;
    try {
      setIsBulkProcessing(true);
      const idsArray = Array.from(selectedIds);
      await Promise.all(
        idsArray.map((id) =>
          apiFetch<Application>(`/applications/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
          }),
        ),
      );

      onApplicationsChange(
        applications.map((item) =>
          selectedIds.has(item.id) ? { ...item, status: newStatus } : item,
        ),
      );
      showToast(`Updated ${selectedIds.size} applications to ${newStatus}`, 'success');
      clearSelection();
    } catch {
      showToast('Failed to update some applications', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.size} selected applications? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setIsBulkProcessing(true);
      const idsArray = Array.from(selectedIds);
      await Promise.all(
        idsArray.map((id) => apiFetch(`/applications/${id}`, { method: 'DELETE' })),
      );

      onApplicationsChange(applications.filter((item) => !selectedIds.has(item.id)));
      showToast(`Deleted ${selectedIds.size} applications`, 'success');
      clearSelection();
    } catch {
      showToast('Failed to delete selected applications', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExportCsv = () => {
    if (selectedIds.size === 0) return;
    const selectedApps = applications.filter((app) => selectedIds.has(app.id));
    exportApplicationsToCsv(selectedApps, 'selected-applications');
    showToast(`Exported ${selectedApps.length} selected applications to CSV`, 'success');
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
    );
  };

  return (
    <div className="space-y-4 relative">
      {/* Filter Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedStatusFilter === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>All</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900">
            {statusCounts.ALL}
          </span>
        </button>

        {/* Starred Dream Jobs Filter Pill */}
        <button
          onClick={() => setSelectedStatusFilter('STARRED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedStatusFilter === 'STARRED'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/40'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${selectedStatusFilter === 'STARRED' ? 'fill-white' : 'fill-amber-400 text-amber-400'}`} />
          <span>Dream Jobs</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedStatusFilter === 'STARRED'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
            }`}
          >
            {statusCounts.STARRED}
          </span>
        </button>

        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedStatusFilter === opt.value
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>{opt.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedStatusFilter === opt.value
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {statusCounts[opt.value] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">
                {/* Select All Checkbox Column */}
                <th className="py-3 pl-4 pr-1 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="p-1 rounded text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 focus:outline-none"
                    title={isAllSelected ? 'Deselect all' : 'Select all'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    ) : isSomeSelected ? (
                      <MinusSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>

                {/* Star Column Header */}
                <th
                  onClick={() => toggleSort('starred')}
                  className="py-3 px-2 w-8 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-colors"
                  title="Sort by Dream Job"
                >
                  <Star className="w-3.5 h-3.5 mx-auto text-amber-400 fill-amber-400" />
                </th>

                <th
                  onClick={() => toggleSort('company_name')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/80 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Company</span>
                    {renderSortIcon('company_name')}
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('role_title')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/80 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Role Title</span>
                    {renderSortIcon('role_title')}
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('status')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/80 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('applied_date')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/80 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Applied Date</span>
                    {renderSortIcon('applied_date')}
                  </div>
                </th>

                <th className="py-3 px-3">Resume</th>
                <th className="py-3 px-3 text-center">Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {processedApplications.length > 0 ? (
                processedApplications.map((app) => {
                  const isSelected = selectedIds.has(app.id);
                  const isStarred = isApplicationStarred(app.id);
                  return (
                    <tr
                      key={app.id}
                      className={`transition-colors group ${
                        isSelected
                          ? 'bg-sky-50/60 dark:bg-sky-950/30'
                          : isStarred
                          ? 'bg-amber-50/25 dark:bg-amber-950/15 hover:bg-amber-50/50 dark:hover:bg-amber-950/30'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Row Checkbox Column */}
                      <td className="py-3 pl-4 pr-1 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(app.id)}
                          className="p-1 rounded text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 focus:outline-none"
                          title="Select row"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Row Star Column */}
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStar(app.id, isStarred)}
                          className={`p-1 rounded transition-colors ${
                            isStarred
                              ? 'text-amber-400 hover:text-amber-500'
                              : 'text-slate-300 hover:text-amber-400 opacity-0 group-hover:opacity-100 focus:opacity-100'
                          }`}
                          title={isStarred ? 'Unstar Application' : 'Star Application'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Company Column */}
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <Link
                            href={`/applications/${app.id}`}
                            className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                          >
                            {app.company_name}
                          </Link>
                          {isStarred && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                              Starred
                            </span>
                          )}
                          {app.job_posting_url && (
                            <a
                              href={app.job_posting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-sky-500 transition-colors"
                              title="Open original job posting"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Role Title Column */}
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{app.role_title}</span>
                          {app.work_mode && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {app.work_mode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Column with Inline Quick Selector */}
                      <td className="py-3 px-3">
                        <select
                          value={app.status}
                          onChange={(e) =>
                            handleInlineStatusChange(app.id, e.target.value as ApplicationStatus)
                          }
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md border cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors ${
                            app.status === 'APPLIED'
                              ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800'
                              : app.status === 'INTERVIEW'
                              ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/70 dark:text-violet-300 dark:border-violet-800'
                              : app.status === 'OFFER'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                              : app.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800'
                              : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Applied Date Column */}
                      <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{app.applied_date ? app.applied_date.split('T')[0] : 'N/A'}</span>
                        </div>
                      </td>

                      {/* Resume Column */}
                      <td className="py-3 px-3 text-xs">
                        {app.resumes ? (
                          <span
                            className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium"
                            title={app.resumes.original_filename}
                          >
                            <FileText className="w-3 h-3 text-sky-500" />
                            <span className="truncate max-w-[120px]">{app.resumes.version_label}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">None</span>
                        )}
                      </td>

                      {/* Activity Counters Column */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span
                            className="flex items-center gap-0.5"
                            title={`${app._count?.interviews || 0} interviews scheduled`}
                          >
                            <Video className="w-3.5 h-3.5 text-violet-500" />
                            <span>{app._count?.interviews || 0}</span>
                          </span>
                          <span
                            className="flex items-center gap-0.5"
                            title={`${app._count?.notes || 0} notes logged`}
                          >
                            <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                            <span>{app._count?.notes || 0}</span>
                          </span>
                        </div>
                      </td>

                      {/* Row Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/applications/${app.id}`}
                            className="p-1.5 rounded-md text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleDelete(app.id, app.company_name)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Application"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                    No applications match the current filter or search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Glassmorphic Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 flex-wrap animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shadow-xs">
              {selectedIds.size}
            </span>
            <span className="text-xs font-medium text-slate-200">Selected</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Bulk Status Select */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 hidden sm:inline">Set Status:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value as ApplicationStatus);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              disabled={isBulkProcessing}
              className="text-xs font-medium bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-400 cursor-pointer"
            >
              <option value="" disabled>
                Select stage...
              </option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk Export Button */}
          <button
            onClick={handleBulkExportCsv}
            disabled={isBulkProcessing}
            className="flex items-center gap-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            title="Export selected to CSV"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Bulk Delete Button */}
          <button
            onClick={handleBulkDelete}
            disabled={isBulkProcessing}
            className="flex items-center gap-1 text-xs font-medium bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 px-3 py-1.5 rounded-lg border border-rose-500/40 transition-colors"
            title="Delete selected applications"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete</span>
          </button>

          {/* Clear Selection Button */}
          <button
            onClick={clearSelection}
            disabled={isBulkProcessing}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

