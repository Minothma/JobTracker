'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Application, ApplicationStatus } from '../../../../lib/types';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { Input, Select } from '../../../../components/ui/Input';
import { apiFetch } from '../../../../lib/api-client';
import { useToast } from '../../../../components/ui/Toast';
import { ArrowLeft, Calendar, ExternalLink, Trash2, Edit2 } from 'lucide-react';

interface ApplicationHeaderProps {
  application: Application;
  onUpdate: (updated: Application) => void;
}

export const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({
  application,
  onUpdate,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [companyName, setCompanyName] = useState(application.company_name);
  const [roleTitle, setRoleTitle] = useState(application.role_title);
  const [appliedDate, setAppliedDate] = useState(
    new Date(application.applied_date).toISOString().split('T')[0],
  );
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [jobPostingUrl, setJobPostingUrl] = useState(application.job_posting_url || '');
  const [isSaving, setIsSaving] = useState(false);

  const statusOptions = [
    { label: 'Applied', value: 'APPLIED' },
    { label: 'Interview', value: 'INTERVIEW' },
    { label: 'Offer', value: 'OFFER' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Withdrawn', value: 'WITHDRAWN' },
  ];

  const handleStatusQuickChange = async (newStatus: ApplicationStatus) => {
    try {
      const updated = await apiFetch<Application>(`/applications/${application.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(`Status updated to ${newStatus}`, 'success');
      onUpdate(updated);
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await apiFetch<Application>(`/applications/${application.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          company_name: companyName.trim(),
          role_title: roleTitle.trim(),
          applied_date: appliedDate,
          status,
          job_posting_url: jobPostingUrl.trim() || undefined,
        }),
      });
      showToast('Application updated successfully', 'success');
      onUpdate(updated);
      setIsEditModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update application', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete application for ${application.company_name}?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiFetch(`/applications/${application.id}`, { method: 'DELETE' });
      showToast('Application deleted successfully', 'success');
      router.push('/board');
    } catch {
      showToast('Failed to delete application', 'error');
      setIsDeleting(false);
    }
  };

  const formattedAppliedDate = new Date(application.applied_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
      {/* Back button */}
      <div>
        <Link
          href="/board"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Board</span>
        </Link>
      </div>

      {/* Main header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {application.company_name}
            </h1>
            <Badge status={application.status} className="text-xs px-2.5 py-1" />
          </div>
          <p className="text-base text-slate-600 dark:text-slate-300 font-medium mt-1">
            {application.role_title}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Stage:</label>
            <select
              value={application.status}
              onChange={(e) => handleStatusQuickChange(e.target.value as ApplicationStatus)}
              className="text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            title="Edit application"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            title="Delete application"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Meta tags (Date, Job posting URL) */}
      <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Applied on {formattedAppliedDate}</span>
        </div>

        {application.job_posting_url && (
          <a
            href={application.job_posting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Job Posting URL</span>
          </a>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Application"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
          <Input
            label="Role Title"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            required
          />
          <Input
            label="Applied Date"
            type="date"
            value={appliedDate}
            onChange={(e) => setAppliedDate(e.target.value)}
            required
          />
          <Select
            label="Status"
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
          />
          <Input
            label="Job Posting URL"
            type="url"
            value={jobPostingUrl}
            onChange={(e) => setJobPostingUrl(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
