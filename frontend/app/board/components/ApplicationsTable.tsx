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
      return <ArrowUpDown className="w-3 h-3 text-[#52525B]" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-indigo-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-400" />
    );
  };

  return (
    <div className="space-y-3 relative text-[#FAFAFA]">
      {/* Filter Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-mono text-xs">
        <button
          onClick={() => setSelectedStatusFilter('ALL')}
          className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
            selectedStatusFilter === 'ALL'
              ? 'bg-[#27272A] text-[#FAFAFA] border border-[#3F3F46]'
              : 'bg-[#121214] border border-[#27272A] text-[#A1A1AA] hover:bg-[#18181B]'
          }`}
        >
          <span>all</span>
          <span className="text-[10px] text-[#71717A]">
            {statusCounts.ALL}
          </span>
        </button>

        {/* Starred Dream Jobs Filter Pill */}
        <button
          onClick={() => setSelectedStatusFilter('STARRED')}
          className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
            selectedStatusFilter === 'STARRED'
              ? 'bg-amber-950/70 border border-amber-800 text-amber-300'
              : 'bg-[#121214] border border-[#27272A] text-[#A1A1AA] hover:bg-[#18181B]'
          }`}
        >
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>starred</span>
          <span className="text-[10px] text-amber-400/80">
            {statusCounts.STARRED}
          </span>
        </button>

        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedStatusFilter(opt.value)}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              selectedStatusFilter === opt.value
                ? 'bg-indigo-950/70 border border-indigo-700 text-indigo-300'
                : 'bg-[#121214] border border-[#27272A] text-[#A1A1AA] hover:bg-[#18181B]'
            }`}
          >
            <span>{opt.label.toLowerCase()}</span>
            <span className="text-[10px] text-[#71717A]">
              {statusCounts[opt.value] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-[#121214] border border-[#27272A] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0E0E10] border-b border-[#27272A] text-[#71717A] text-[11px] font-mono uppercase tracking-wider">
                {/* Select All Checkbox Column */}
                <th className="py-2.5 pl-3.5 pr-1 w-8 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="p-0.5 rounded text-[#52525B] hover:text-[#FAFAFA] focus:outline-none"
                    title={isAllSelected ? 'Deselect all' : 'Select all'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    ) : isSomeSelected ? (
                      <MinusSquare className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                </th>

                {/* Star Column Header */}
                <th
                  onClick={() => toggleSort('starred')}
                  className="py-2.5 px-2 w-7 text-center cursor-pointer hover:bg-[#18181B] transition-colors"
                  title="Sort by Starred"
                >
                  <Star className="w-3 h-3 mx-auto text-amber-400 fill-amber-400" />
                </th>

                <th
                  onClick={() => toggleSort('company_name')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-[#18181B] select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Company</span>
                    {renderSortIcon('company_name')}
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('role_title')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-[#18181B] select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Role Title</span>
                    {renderSortIcon('role_title')}
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('status')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-[#18181B] select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('applied_date')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-[#18181B] select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Applied Date</span>
                    {renderSortIcon('applied_date')}
                  </div>
                </th>

                <th className="py-2.5 px-3">Resume</th>
                <th className="py-2.5 px-3 text-center">Activity</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1E1E22] text-xs font-mono">
              {processedApplications.length > 0 ? (
                processedApplications.map((app) => {
                  const isSelected = selectedIds.has(app.id);
                  const isStarred = isApplicationStarred(app.id);
                  return (
                    <tr
                      key={app.id}
                      className={`transition-colors group ${
                        isSelected
                          ? 'bg-indigo-950/20'
                          : isStarred
                          ? 'bg-amber-950/10 hover:bg-amber-950/20'
                          : 'hover:bg-[#18181B]'
                      }`}
                    >
                      {/* Row Checkbox Column */}
                      <td className="py-2.5 pl-3.5 pr-1 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(app.id)}
                          className="p-0.5 rounded text-[#52525B] hover:text-[#FAFAFA] focus:outline-none"
                          title="Select row"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>

                      {/* Row Star Column */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStar(app.id, isStarred)}
                          className={`p-0.5 rounded transition-colors ${
                            isStarred
                              ? 'text-amber-400 hover:text-amber-300'
                              : 'text-[#52525B] hover:text-amber-400 opacity-0 group-hover:opacity-100 focus:opacity-100'
                          }`}
                          title={isStarred ? 'Unstar Application' : 'Star Application'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Company Column */}
                      <td className="py-2.5 px-3 font-medium text-[#FAFAFA] font-sans">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/applications/${app.id}`}
                            className="hover:text-indigo-400 transition-colors"
                          >
                            {app.company_name}
                          </Link>
                          {isStarred && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60 shrink-0">
                              starred
                            </span>
                          )}
                          {app.job_posting_url && (
                            <a
                              href={app.job_posting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#52525B] hover:text-indigo-400 transition-colors"
                              title="Open original job posting"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Role Title Column */}
                      <td className="py-2.5 px-3 text-[#A1A1AA] font-sans">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{app.role_title}</span>
                          {app.work_mode && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[#71717A]">
                              {app.work_mode.toLowerCase()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Column with Inline Quick Selector */}
                      <td className="py-2.5 px-3">
                        <select
                          value={app.status}
                          onChange={(e) =>
                            handleInlineStatusChange(app.id, e.target.value as ApplicationStatus)
                          }
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Applied Date Column */}
                      <td className="py-2.5 px-3 text-[11px] text-[#71717A]">
                        <span>{app.applied_date ? app.applied_date.split('T')[0] : '—'}</span>
                      </td>

                      {/* Resume Column */}
                      <td className="py-2.5 px-3 text-[11px]">
                        {app.resumes ? (
                          <span
                            className="inline-flex items-center gap-1 text-[#A1A1AA] bg-[#18181B] border border-[#27272A] px-1.5 py-0.5 rounded text-[10px]"
                            title={app.resumes.original_filename}
                          >
                            <FileText className="w-2.5 h-2.5 text-indigo-400" />
                            <span className="truncate max-w-[100px]">{app.resumes.version_label}</span>
                          </span>
                        ) : (
                          <span className="text-[#52525B]">none</span>
                        )}
                      </td>

                      {/* Activity Counters Column */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-2 text-[11px] text-[#71717A]">
                          <span
                            className="flex items-center gap-0.5"
                            title={`${app._count?.interviews || 0} interviews scheduled`}
                          >
                            <Video className="w-3 h-3 text-amber-400" />
                            <span>{app._count?.interviews || 0}</span>
                          </span>
                          <span
                            className="flex items-center gap-0.5"
                            title={`${app._count?.notes || 0} notes logged`}
                          >
                            <StickyNote className="w-3 h-3 text-[#52525B]" />
                            <span>{app._count?.notes || 0}</span>
                          </span>
                        </div>
                      </td>

                      {/* Row Action Buttons */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/applications/${app.id}`}
                            className="p-1 rounded text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleDelete(app.id, app.company_name)}
                            className="p-1 rounded text-[#71717A] hover:text-rose-400 hover:bg-[#18181B] transition-colors"
                            title="Delete Application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#71717A] text-xs">
                    No applications match the current filter or search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#121214] text-[#FAFAFA] px-4 py-2.5 rounded-lg shadow-2xl border border-[#27272A] flex items-center gap-3 font-mono text-xs animate-in fade-in slide-in-from-bottom-3 duration-150">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-[#A1A1AA]">selected</span>
          </div>

          <div className="h-4 w-px bg-[#27272A]" />

          {/* Bulk Status Select */}
          <div className="flex items-center gap-1.5">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value as ApplicationStatus);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              disabled={isBulkProcessing}
              className="text-xs bg-[#0A0A0B] text-[#FAFAFA] border border-[#27272A] rounded px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="" disabled>
                set status...
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
            className="flex items-center gap-1 text-xs bg-[#18181B] hover:bg-[#27272A] text-[#FAFAFA] px-2.5 py-1 rounded border border-[#27272A] transition-colors"
            title="Export selected to CSV"
          >
            <Download className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">export</span>
          </button>

          {/* Bulk Delete Button */}
          <button
            onClick={handleBulkDelete}
            disabled={isBulkProcessing}
            className="flex items-center gap-1 text-xs bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 px-2.5 py-1 rounded border border-rose-900/60 transition-colors"
            title="Delete selected applications"
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span>delete</span>
          </button>

          {/* Clear Selection Button */}
          <button
            onClick={clearSelection}
            disabled={isBulkProcessing}
            className="p-1 rounded text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-colors"
            title="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
