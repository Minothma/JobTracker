'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api-client';
import { Application, ApplicationStatus, Resume } from '../../../lib/types';
import { useToast } from '../../../components/ui/Toast';

interface NewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newApp: Application) => void;
}

export const NewApplicationModal: React.FC<NewApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<ApplicationStatus>('APPLIED');
  const [jobPostingUrl, setJobPostingUrl] = useState('');
  const [resumeId, setResumeId] = useState<string>('');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setCompanyName('');
      setRoleTitle('');
      setAppliedDate(new Date().toISOString().split('T')[0]);
      setStatus('APPLIED');
      setJobPostingUrl('');
      setResumeId('');
      setError(null);

      // Fetch user's resumes
      apiFetch<Resume[]>('/resumes')
        .then((data) => setResumes(data))
        .catch(() => setResumes([]));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyName.trim() || !roleTitle.trim() || !appliedDate) {
      setError('Company name, role title, and applied date are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: any = {
        company_name: companyName.trim(),
        role_title: roleTitle.trim(),
        applied_date: appliedDate,
        status,
      };

      if (jobPostingUrl.trim()) {
        payload.job_posting_url = jobPostingUrl.trim();
      }

      if (resumeId) {
        payload.resume_id = resumeId;
      }

      const createdApp = await apiFetch<Application>('/applications', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      showToast(`Application for ${createdApp.company_name} created!`, 'success');
      onSuccess(createdApp);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { label: 'Applied', value: 'APPLIED' },
    { label: 'Interview', value: 'INTERVIEW' },
    { label: 'Offer', value: 'OFFER' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Withdrawn', value: 'WITHDRAWN' },
  ];

  const resumeOptions = [
    { label: '-- Select a Resume Version (Optional) --', value: '' },
    ...resumes.map((r) => ({
      label: `${r.version_label} (${r.original_filename})`,
      value: r.id,
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Application" maxWidth="md">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Company Name *"
            placeholder="e.g. Google, Stripe"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />

          <Input
            label="Role Title *"
            placeholder="e.g. Software Engineer Intern"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Applied Date *"
            type="date"
            value={appliedDate}
            onChange={(e) => setAppliedDate(e.target.value)}
            required
          />

          <Select
            label="Initial Status"
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
          />
        </div>

        <Input
          label="Job Posting URL"
          type="url"
          placeholder="https://careers.example.com/job/123"
          value={jobPostingUrl}
          onChange={(e) => setJobPostingUrl(e.target.value)}
        />

        <Select
          label="Attach Resume Version"
          options={resumeOptions}
          value={resumeId}
          onChange={(e) => setResumeId(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Application
          </Button>
        </div>
      </form>
    </Modal>
  );
};
