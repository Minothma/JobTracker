'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Application, ApplicationStatus, WorkMode } from '../../../../lib/types';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { Input, Select } from '../../../../components/ui/Input';
import { AiEmailGeneratorModal } from '../../../../components/AiEmailGeneratorModal';
import { AiInterviewPrepModal } from '../../../../components/AiInterviewPrepModal';
import { AiCoverLetterModal } from '../../../../components/AiCoverLetterModal';
import { apiFetch } from '../../../../lib/api-client';
import { useToast } from '../../../../components/ui/Toast';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Trash2,
  Edit2,
  Sparkles,
  Brain,
  Star,
  MapPin,
  FileText,
} from 'lucide-react';
import {
  isApplicationStarred,
  toggleFavoriteApi,
  STARRED_CHANGED_EVENT,
} from '../../../../lib/favorites';

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
  const [isStarred, setIsStarred] = useState(
    application.is_favorite !== undefined ? application.is_favorite : isApplicationStarred(application.id),
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAiEmailModalOpen, setIsAiEmailModalOpen] = useState(false);
  const [isAiInterviewPrepOpen, setIsAiInterviewPrepOpen] = useState(false);
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Form state
  const [companyName, setCompanyName] = useState(application.company_name);
  const [roleTitle, setRoleTitle] = useState(application.role_title);
  const [appliedDate, setAppliedDate] = useState(
    new Date(application.applied_date).toISOString().split('T')[0],
  );
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [workMode, setWorkMode] = useState<WorkMode>((application.work_mode as WorkMode) || 'REMOTE');
  const [location, setLocation] = useState(application.location || '');
  const [salaryMin, setSalaryMin] = useState(application.salary_min ? String(application.salary_min) : '');
  const [salaryMax, setSalaryMax] = useState(application.salary_max ? String(application.salary_max) : '');
  const [jobDescription, setJobDescription] = useState(application.job_description || '');
  const [contactName, setContactName] = useState(application.contact_name || '');
  const [contactEmail, setContactEmail] = useState(application.contact_email || '');
  const [jobPostingUrl, setJobPostingUrl] = useState(application.job_posting_url || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsStarred(
      application.is_favorite !== undefined ? application.is_favorite : isApplicationStarred(application.id),
    );

    const handleStarredChanged = (e: any) => {
      if (e.detail?.id === application.id) {
        setIsStarred(e.detail.isStarred);
      }
    };

    window.addEventListener(STARRED_CHANGED_EVENT, handleStarredChanged);
    return () => {
      window.removeEventListener(STARRED_CHANGED_EVENT, handleStarredChanged);
    };
  }, [application.id, application.is_favorite]);

  const handleStarToggle = async () => {
    const next = await toggleFavoriteApi(application.id, isStarred);
    setIsStarred(next);
    onUpdate({ ...application, is_favorite: next });
    showToast(next ? 'Starred application' : 'Removed from Starred', 'info');
  };

  const statusOptions = [
    { label: 'Applied', value: 'APPLIED' },
    { label: 'Interview', value: 'INTERVIEW' },
    { label: 'Offer', value: 'OFFER' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Withdrawn', value: 'WITHDRAWN' },
  ];

  const workModeOptions = [
    { label: 'Remote', value: 'REMOTE' },
    { label: 'Hybrid', value: 'HYBRID' },
    { label: 'On-site', value: 'ONSITE' },
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

  const handleOpenEditModal = () => {
    setCompanyName(application.company_name);
    setRoleTitle(application.role_title);
    setAppliedDate(new Date(application.applied_date).toISOString().split('T')[0]);
    setStatus(application.status);
    setWorkMode((application.work_mode as WorkMode) || 'REMOTE');
    setLocation(application.location || '');
    setSalaryMin(application.salary_min ? String(application.salary_min) : '');
    setSalaryMax(application.salary_max ? String(application.salary_max) : '');
    setJobDescription(application.job_description || '');
    setContactName(application.contact_name || '');
    setContactEmail(application.contact_email || '');
    setJobPostingUrl(application.job_posting_url || '');
    setIsEditModalOpen(true);
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
          work_mode: workMode,
          location: location.trim() || null,
          salary_min: salaryMin ? parseFloat(salaryMin) : null,
          salary_max: salaryMax ? parseFloat(salaryMax) : null,
          job_description: jobDescription.trim() || null,
          contact_name: contactName.trim() || null,
          contact_email: contactEmail.trim() || null,
          job_posting_url: jobPostingUrl.trim() || null,
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={`bg-[#121214] border rounded-lg p-5 space-y-4 text-[#FAFAFA] transition-colors ${
      isStarred ? 'border-amber-500/40 bg-[#15130D]' : 'border-[#27272A]'
    }`}>
      {/* Back button */}
      <div>
        <Link
          href="/board"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#71717A] hover:text-[#FAFAFA] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>applications</span>
        </Link>
      </div>

      {/* Main header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#FAFAFA] tracking-tight">
              {application.company_name}
            </h1>
            <button
              onClick={handleStarToggle}
              className={`p-1 rounded transition-colors ${
                isStarred
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-[#52525B] hover:text-amber-400'
              }`}
              title={isStarred ? 'Unstar Application' : 'Star Application'}
            >
              <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
            {isStarred && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
                starred
              </span>
            )}
            <Badge status={application.status} />
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-[#A1A1AA]">
            <span className="font-medium text-[#FAFAFA]">
              {application.role_title}
            </span>
            {application.work_mode && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#18181B] border border-[#27272A] text-[#71717A]">
                {application.work_mode.toLowerCase()}
              </span>
            )}
            {application.location && (
              <span className="text-[11px] font-mono text-[#71717A] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#52525B]" />
                <span>{application.location}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <div className="flex items-center gap-1">
            <select
              value={application.status}
              onChange={(e) => handleStatusQuickChange(e.target.value as ApplicationStatus)}
              className="text-xs bg-[#0A0A0B] border border-[#27272A] rounded px-2 py-1 text-[#FAFAFA] focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
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
            onClick={() => setIsCoverLetterOpen(true)}
            title="Generate tailored cover letter or pitch"
          >
            <FileText className="w-3 h-3 text-indigo-400 mr-1" />
            <span>Cover Letter</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAiInterviewPrepOpen(true)}
            title="Practice tailored AI Interview Questions"
          >
            <Brain className="w-3 h-3 text-indigo-400 mr-1" />
            <span>Prep</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAiEmailModalOpen(true)}
            title="Generate AI Follow-up or Outreach Email"
          >
            <Sparkles className="w-3 h-3 text-indigo-400 mr-1" />
            <span>Email</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenEditModal}
            title="Edit application"
          >
            <Edit2 className="w-3 h-3" />
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            title="Delete application"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Meta tags (Date, Job posting URL, Contacts) */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#27272A] text-xs font-mono text-[#71717A]">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-[#52525B]" />
          <span>applied {formattedAppliedDate}</span>
        </div>

        {application.job_posting_url && (
          <a
            href={application.job_posting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>posting URL</span>
          </a>
        )}

        {(application.salary_min || application.salary_max) && (
          <div className="flex items-center gap-1 text-[#A1A1AA]">
            <span>target: </span>
            <span className="text-[#FAFAFA]">
              {application.salary_min ? `$${Number(application.salary_min).toLocaleString()}` : ''}
              {application.salary_min && application.salary_max ? ' - ' : ''}
              {application.salary_max ? `$${Number(application.salary_max).toLocaleString()}` : ''}
            </span>
          </div>
        )}

        {application.contact_name && (
          <div className="text-[#71717A]">
            <span>recruiter: <strong className="text-[#A1A1AA] font-sans">{application.contact_name}</strong></span>
            {application.contact_email && <span className="text-[#52525B]"> ({application.contact_email})</span>}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Application"
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
            <Select
              label="Work Mode"
              options={workModeOptions}
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value as WorkMode)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Location"
              placeholder="e.g. San Francisco, CA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Input
              label="Job Posting URL"
              type="url"
              value={jobPostingUrl}
              onChange={(e) => setJobPostingUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Salary Min ($)"
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder="e.g. 90000"
            />
            <Input
              label="Salary Max ($)"
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder="e.g. 130000"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Recruiter Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Sarah Connor"
            />
            <Input
              label="Recruiter Email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="e.g. recruiter@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
              Job Description
            </label>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0A0A0B] border border-[#27272A] rounded-md text-[#FAFAFA] font-mono placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500"
              placeholder="Paste full job description..."
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#27272A]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* AI Email Outreach Modal */}
      <AiEmailGeneratorModal
        isOpen={isAiEmailModalOpen}
        onClose={() => setIsAiEmailModalOpen(false)}
        companyName={application.company_name}
        roleTitle={application.role_title}
      />

      {/* AI Interview Prep Modal */}
      <AiInterviewPrepModal
        isOpen={isAiInterviewPrepOpen}
        onClose={() => setIsAiInterviewPrepOpen(false)}
        applicationId={application.id}
        companyName={application.company_name}
        roleTitle={application.role_title}
        jobDescription={application.job_description || undefined}
        initialResumeId={application.resume_id}
      />

      {/* AI Cover Letter Generator Modal */}
      <AiCoverLetterModal
        isOpen={isCoverLetterOpen}
        onClose={() => setIsCoverLetterOpen(false)}
        applicationId={application.id}
        initialCompanyName={application.company_name}
        initialRoleTitle={application.role_title}
        initialJobDescription={application.job_description || undefined}
        initialResumeId={application.resume_id || undefined}
      />
    </div>
  );
};
