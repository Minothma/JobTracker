'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Application, ApplicationStatus } from '../../../lib/types';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api-client';
import { useToast } from '../../../components/ui/Toast';
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
} from 'lucide-react';

interface ApplicationsTableProps {
  applications: Application[];
  onApplicationsChange: (updated: Application[]) => void;
}

type SortField = 'company_name' | 'role_title' | 'status' | 'applied_date';

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
  const [sortField, setSortField] = useState<SortField>('applied_date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Status Filter Counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: applications.length,
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
    });
    return counts;
  }, [applications]);

  // Filter & Sort Applications
  const processedApplications = useMemo(() => {
    let result = [...applications];

    if (selectedStatusFilter !== 'ALL') {
      result = result.filter((app) => app.status === selectedStatusFilter);
    }

    result.sort((a, b) => {
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
  }, [applications, selectedStatusFilter, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

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

  const handleDelete = async (appId: string, companyName: string) => {
    if (!window.confirm(`Are you sure you want to delete application for ${companyName}?`)) return;

    try {
      await apiFetch(`/applications/${appId}`, { method: 'DELETE' });
      onApplicationsChange(applications.filter((item) => item.id !== appId));
      showToast('Application deleted', 'success');
    } catch {
      showToast('Failed to delete application', 'error');
    }
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
    <div className="space-y-4">
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
                <th
                  onClick={() => toggleSort('company_name')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/80 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Company</span>
                    {renderSortIcon('company_name')}
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('role_title')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/80 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Role Title</span>
                    {renderSortIcon('role_title')}
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/80 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('applied_date')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/80 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Applied Date</span>
                    {renderSortIcon('applied_date')}
                  </div>
                </th>

                <th className="py-3 px-4">Resume</th>
                <th className="py-3 px-4 text-center">Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {processedApplications.length > 0 ? (
                processedApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Company Column */}
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
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
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {app.role_title}
                    </td>

                    {/* Status Column with Inline Quick Selector */}
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.applied_date ? app.applied_date.split('T')[0] : 'N/A'}</span>
                      </div>
                    </td>

                    {/* Resume Column */}
                    <td className="py-3 px-4 text-xs">
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
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span
                          className="flex items-center gap-0.5"
                          title={`${app._count?.interviews || 0} interviews scheduled`}
                        >
                          <Video className="w-3 h-3 text-violet-500" />
                          <span>{app._count?.interviews || 0}</span>
                        </span>
                        <span
                          className="flex items-center gap-0.5"
                          title={`${app._count?.notes || 0} notes logged`}
                        >
                          <StickyNote className="w-3 h-3 text-amber-500" />
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
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No applications match the current filter or search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
