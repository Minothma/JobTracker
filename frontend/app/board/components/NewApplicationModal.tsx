'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api-client';
import { Application, ApplicationStatus, Resume, WorkMode } from '../../../lib/types';
import { useToast } from '../../../components/ui/Toast';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  const [workMode, setWorkMode] = useState<WorkMode>('REMOTE');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      setWorkMode('REMOTE');
      setLocation('');
      setSalaryMin('');
      setSalaryMax('');
      setJobDescription('');
      setContactName('');
      setContactEmail('');
      setShowAdvanced(false);
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
        work_mode: workMode,
      };

      if (jobPostingUrl.trim()) payload.job_posting_url = jobPostingUrl.trim();
      if (resumeId) payload.resume_id = resumeId;
      if (location.trim()) payload.location = location.trim();
      if (salaryMin) payload.salary_min = parseFloat(salaryMin);
      if (salaryMax) payload.salary_max = parseFloat(salaryMax);
      if (jobDescription.trim()) payload.job_description = jobDescription.trim();
      if (contactName.trim()) payload.contact_name = contactName.trim();
      if (contactEmail.trim()) payload.contact_email = contactEmail.trim();

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

  const workModeOptions = [
    { label: 'Remote', value: 'REMOTE' },
    { label: 'Hybrid', value: 'HYBRID' },
    { label: 'On-site', value: 'ONSITE' },
  ];

  const resumeOptions = [
    { label: '-- Select a Resume Version (Optional) --', value: '' },
    ...resumes.map((r) => ({
      label: `${r.version_label} (${r.original_filename})`,
      value: r.id,
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Application" maxWidth="lg">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Company Name *"
            placeholder="e.g. Google, Stripe, Canva"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />

          <Input
            label="Role Title *"
            placeholder="e.g. Full-Stack Engineer, Intern"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          <Select
            label="Work Mode"
            options={workModeOptions}
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value as WorkMode)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Job Posting URL"
            type="url"
            placeholder="https://careers.company.com/job/123"
            value={jobPostingUrl}
            onChange={(e) => setJobPostingUrl(e.target.value)}
          />

          <Input
            label="Location (City / Country)"
            placeholder="e.g. San Francisco, CA / Colombo, LK"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <Select
          label="Attach Tailored Resume Version"
          options={resumeOptions}
          value={resumeId}
          onChange={(e) => setResumeId(e.target.value)}
        />

        {/* Toggle Advanced Details */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showAdvanced ? 'Hide Additional Fields' : 'Add Target Salary, Recruiter Contact & Job Description'}</span>
          </button>
        </div>

        {showAdvanced && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Target Salary Min ($)"
                type="number"
                min="0"
                step="5000"
                placeholder="e.g. 90000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
              />

              <Input
                label="Target Salary Max ($)"
                type="number"
                min="0"
                step="5000"
                placeholder="e.g. 130000"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Recruiter / Contact Name"
                placeholder="e.g. Sarah Connor"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />

              <Input
                label="Recruiter Contact Email"
                type="email"
                placeholder="e.g. recruiter@company.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Job Description (Paste JD for AI Matcher)
              </label>
              <textarea
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the requirements and responsibilities here..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>
        )}

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
