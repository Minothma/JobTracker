'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api-client';
import { Application, ApplicationStatus, Resume, WorkMode, ScrapedJobData, ParsedJobDetails } from '../../../lib/types';
import { useToast } from '../../../components/ui/Toast';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';

interface NewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newApp: Application) => void;
  initialData?: {
    company_name?: string;
    role_title?: string;
    job_posting_url?: string;
    job_description?: string;
  };
}

export const NewApplicationModal: React.FC<NewApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const { showToast } = useToast();
  const [autoFillMode, setAutoFillMode] = useState<'SMART_PASTE' | 'URL_SCRAPE'>('SMART_PASTE');
  const [smartPasteText, setSmartPasteText] = useState('');
  const [isParsingText, setIsParsingText] = useState(false);
  const [detectedSkills, setDetectedSkills] = useState<string[]>([]);

  const [quickUrl, setQuickUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

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
      setQuickUrl(initialData?.job_posting_url || '');
      setCompanyName(initialData?.company_name || '');
      setRoleTitle(initialData?.role_title || '');
      setAppliedDate(new Date().toISOString().split('T')[0]);
      setStatus('APPLIED');
      setJobPostingUrl(initialData?.job_posting_url || '');
      setResumeId('');
      const savedWorkMode = (typeof window !== 'undefined' ? localStorage.getItem('jobtracker_default_work_mode') : null) as WorkMode | null;
      setWorkMode(savedWorkMode || 'REMOTE');
      setLocation('');
      setSalaryMin('');
      setSalaryMax('');
      setJobDescription(initialData?.job_description || '');
      setContactName('');
      setContactEmail('');
      setSmartPasteText('');
      setDetectedSkills([]);
      setShowAdvanced(Boolean(initialData?.job_description));
      setError(null);

      apiFetch<Resume[]>('/resumes')
        .then((data) => setResumes(data))
        .catch(() => setResumes([]));
    }
  }, [isOpen]);

  const handleParseJobText = async () => {
    if (!smartPasteText.trim() || smartPasteText.trim().length < 15) {
      showToast('Please paste a job description or text (at least 15 characters)', 'error');
      return;
    }

    try {
      setIsParsingText(true);
      const data = await apiFetch<ParsedJobDetails>('/ai/parse-job-text', {
        method: 'POST',
        body: JSON.stringify({ text: smartPasteText.trim() }),
      });

      if (data.company_name) setCompanyName(data.company_name);
      if (data.role_title) setRoleTitle(data.role_title);
      if (data.work_mode) setWorkMode(data.work_mode);
      if (data.location) setLocation(data.location);
      if (data.salary_min) setSalaryMin(data.salary_min.toString());
      if (data.salary_max) setSalaryMax(data.salary_max.toString());
      if (data.contact_name) setContactName(data.contact_name);
      if (data.contact_email) setContactEmail(data.contact_email);
      if (data.job_summary) setJobDescription(data.job_summary);
      if (data.key_skills && data.key_skills.length > 0) {
        setDetectedSkills(data.key_skills);
      }
      setShowAdvanced(true);

      showToast(
        `AI parsed ${data.role_title || 'Role'} at ${data.company_name || 'Company'} (${data.extracted_with})`,
        'success',
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to parse job description', 'error');
    } finally {
      setIsParsingText(false);
    }
  };

  const handleScrapeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) {
      showToast('Please enter a job posting URL to scrape', 'error');
      return;
    }

    try {
      setIsScraping(true);
      const data = await apiFetch<ScrapedJobData>('/ai/scrape-job-url', {
        method: 'POST',
        body: JSON.stringify({ url: quickUrl.trim() }),
      });

      if (data.role_title) setRoleTitle(data.role_title);
      if (data.company_name) setCompanyName(data.company_name);
      if (data.location) setLocation(data.location);
      if (data.job_description) {
        setJobDescription(data.job_description);
        setShowAdvanced(true);
      }
      setJobPostingUrl(quickUrl.trim());

      showToast(
        data.extracted_success
          ? `Auto-filled details for ${data.role_title || 'Role'} at ${data.company_name || 'Company'}!`
          : 'Extracted URL domain. Please verify title and company name.',
        'success',
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to extract metadata from URL', 'error');
    } finally {
      setIsScraping(false);
    }
  };

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
    <Modal isOpen={isOpen} onClose={onClose} title="Add Application" maxWidth="lg">
      {error && (
        <div className="mb-4 p-3 rounded-md bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* AI Auto-Fill Container */}
      <div className="mb-5 p-3 rounded-lg bg-[#0E0E10] border border-[#27272A]">
        {/* Tab switchers */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#27272A]">
          <div className="flex items-center gap-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => setAutoFillMode('SMART_PASTE')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                autoFillMode === 'SMART_PASTE'
                  ? 'bg-[#27272A] text-[#FAFAFA]'
                  : 'text-[#71717A] hover:text-[#FAFAFA]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Smart Paste</span>
            </button>
            <button
              type="button"
              onClick={() => setAutoFillMode('URL_SCRAPE')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                autoFillMode === 'URL_SCRAPE'
                  ? 'bg-[#27272A] text-[#FAFAFA]'
                  : 'text-[#71717A] hover:text-[#FAFAFA]'
              }`}
            >
              <LinkIcon className="w-3 h-3 text-[#71717A]" />
              <span>URL Scraper</span>
            </button>
          </div>

          <span className="text-[10px] font-mono text-[#71717A]">
            Gemini AI
          </span>
        </div>

        {/* Tab 1: AI Smart Paste */}
        {autoFillMode === 'SMART_PASTE' ? (
          <div className="space-y-2">
            <textarea
              rows={3}
              placeholder="Paste raw job description, LinkedIn post, or email text here..."
              value={smartPasteText}
              onChange={(e) => setSmartPasteText(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0A0A0B] border border-[#27272A] rounded-md text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500 font-mono"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-[#71717A]">
                Detects company, role, salary, work mode & key skills
              </span>

              <Button
                type="button"
                size="sm"
                onClick={handleParseJobText}
                disabled={isParsingText || !smartPasteText.trim()}
                className="text-xs"
              >
                {isParsingText ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    Auto-Fill
                  </>
                )}
              </Button>
            </div>

            {/* Detected Skills badges */}
            {detectedSkills.length > 0 && (
              <div className="pt-2 border-t border-[#27272A] flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Extracted skills:
                </span>
                {detectedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-1.5 py-0.2 rounded bg-[#18181B] text-emerald-400 border border-[#27272A] font-mono"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: URL Scraper */
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#71717A]" />
                <input
                  type="url"
                  placeholder="https://careers.company.com/job/..."
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0A0A0B] border border-[#27272A] rounded-md text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleScrapeUrl}
                disabled={isScraping || !quickUrl.trim()}
                className="text-xs"
              >
                {isScraping ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    Extract
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Company Name *"
            placeholder="e.g. Acme Corp"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />

          <Input
            label="Role Title *"
            placeholder="e.g. Software Engineer"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Job Posting URL"
            type="url"
            placeholder="https://careers.example.com/job/123"
            value={jobPostingUrl}
            onChange={(e) => setJobPostingUrl(e.target.value)}
          />

          <Input
            label="Location"
            placeholder="e.g. San Francisco, CA / Remote"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <Select
          label="Attach Resume Version"
          options={resumeOptions}
          value={resumeId}
          onChange={(e) => setResumeId(e.target.value)}
        />

        {/* Toggle Additional Fields */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs font-mono text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showAdvanced ? 'hide optional fields' : '+ target salary, recruiter contact & JD'}</span>
          </button>
        </div>

        {showAdvanced && (
          <div className="p-3.5 rounded-lg bg-[#0E0E10] border border-[#27272A] space-y-3">
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
                label="Recruiter Name"
                placeholder="e.g. Sarah Connor"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />

              <Input
                label="Recruiter Email"
                type="email"
                placeholder="e.g. recruiter@company.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
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
                placeholder="Paste the requirements and responsibilities here..."
                className="w-full px-3 py-2 text-xs bg-[#0A0A0B] border border-[#27272A] rounded-md text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#27272A]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Create Application
          </Button>
        </div>
      </form>
    </Modal>
  );
};
