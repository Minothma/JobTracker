'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { apiFetch } from '../lib/api-client';
import {
  CoverLetterTone,
  CoverLetterFormat,
  AiCoverLetterRequest,
  AiCoverLetterResponse,
  Resume,
} from '../lib/types';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  FileText,
  Send,
  Sliders,
  Edit3,
  Eye,
  RefreshCw,
  Clock,
  Briefcase,
} from 'lucide-react';

interface AiCoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  initialCompanyName?: string;
  initialRoleTitle?: string;
  initialJobDescription?: string;
  initialResumeId?: string;
}

export const AiCoverLetterModal: React.FC<AiCoverLetterModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  initialCompanyName = '',
  initialRoleTitle = '',
  initialJobDescription = '',
  initialResumeId = '',
}) => {
  const { showToast } = useToast();

  const [companyName, setCompanyName] = useState<string>(initialCompanyName);
  const [roleTitle, setRoleTitle] = useState<string>(initialRoleTitle);
  const [jobDescription, setJobDescription] = useState<string>(initialJobDescription);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(initialResumeId);
  const [tone, setTone] = useState<CoverLetterTone>('PROFESSIONAL');
  const [format, setFormat] = useState<CoverLetterFormat>('FULL_COVER_LETTER');
  const [keyAchievements, setKeyAchievements] = useState<string>('');

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [result, setResult] = useState<AiCoverLetterResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableContent, setEditableContent] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setCompanyName(initialCompanyName);
      setRoleTitle(initialRoleTitle);
      setJobDescription(initialJobDescription);
      setSelectedResumeId(initialResumeId);

      // Fetch available resumes
      setLoadingResumes(true);
      apiFetch<Resume[]>('/resumes')
        .then((data) => {
          setResumes(data || []);
          if (!selectedResumeId && data && data.length > 0) {
            setSelectedResumeId(data[0].id);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingResumes(false));
    }
  }, [isOpen, initialCompanyName, initialRoleTitle, initialJobDescription, initialResumeId]);

  const handleGenerate = async () => {
    if (!companyName.trim() || !roleTitle.trim()) {
      showToast('Please specify both company name and role title', 'error');
      return;
    }

    try {
      setIsGenerating(true);
      const payload: AiCoverLetterRequest = {
        application_id: applicationId,
        company_name: companyName.trim(),
        role_title: roleTitle.trim(),
        job_description: jobDescription.trim() || undefined,
        resume_id: selectedResumeId || undefined,
        tone,
        format,
        key_achievements: keyAchievements.trim() || undefined,
      };

      const res = await apiFetch<AiCoverLetterResponse>('/ai/cover-letter', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setResult(res);
      setEditableContent(res.content);
      setIsEditing(false);
      showToast(
        format === 'LINKEDIN_INMAIL_PITCH'
          ? 'LinkedIn InMail pitch generated successfully!'
          : 'Tailored cover letter generated successfully!',
        'success',
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to generate cover letter', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = isEditing ? editableContent : result?.content;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showToast('Copied text to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (fileExt: 'md' | 'txt') => {
    const textToDownload = isEditing ? editableContent : result?.content;
    if (!textToDownload) return;

    const filename = `${companyName.toLowerCase().replace(/\s+/g, '-')}-${roleTitle.toLowerCase().replace(/\s+/g, '-')}-${format === 'LINKEDIN_INMAIL_PITCH' ? 'inmail-pitch' : 'cover-letter'}.${fileExt}`;
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`, 'success');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Cover Letter & InMail Pitch Generator"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Subtitle */}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Synthesize high-converting job applications and recruiter pitches tailored directly to your experience and target role.
        </p>

        {/* Input Parameters Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
          {/* Format Selector Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-500" />
              <span>Generation Format</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('FULL_COVER_LETTER')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  format === 'FULL_COVER_LETTER'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-500'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Full Cover Letter (3-4 ¶)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('LINKEDIN_INMAIL_PITCH')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  format === 'LINKEDIN_INMAIL_PITCH'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-500'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>LinkedIn InMail Pitch (&lt;160w)</span>
              </button>
            </div>
          </div>

          {/* Company & Role Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe, Google, Linear"
                className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Role Title *
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Resume & Tone Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Source Resume Text
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                disabled={loadingResumes}
                className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Default Profile Background</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.version_label} ({r.original_filename})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Writing Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as CoverLetterTone)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="PROFESSIONAL">Professional & Balanced</option>
                <option value="ENTHUSIASTIC">Enthusiastic & High-Energy</option>
                <option value="CONFIDENT">Confident & Direct</option>
                <option value="CONCISE">Concise & Metric-Driven</option>
              </select>
            </div>
          </div>

          {/* Key Achievements / Talking Points */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Key Achievements to Highlight (Optional)
            </label>
            <input
              type="text"
              value={keyAchievements}
              onChange={(e) => setKeyAchievements(e.target.value)}
              placeholder="e.g. Scaled API to 10M req/day, reduced AWS costs by 28%"
              className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Generate Button */}
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={isGenerating || !companyName.trim() || !roleTitle.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Crafting Tailored Application with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Generate {format === 'LINKEDIN_INMAIL_PITCH' ? 'InMail Pitch' : 'Cover Letter'}
                </span>
              </>
            )}
          </Button>
        </div>

        {/* Generated Output Preview Section */}
        {result && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60">
              <div className="flex items-center gap-3 text-xs text-sky-800 dark:text-sky-300">
                <span className="flex items-center gap-1 font-semibold">
                  <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  {result.word_count} words
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  {result.estimated_reading_minutes} min read
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 font-medium">
                  {result.generated_with}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing((prev) => !prev)}
                  className="px-2 py-1 rounded text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                  title={isEditing ? 'View Preview' : 'Edit Text'}
                >
                  {isEditing ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                  <span>{isEditing ? 'Preview' : 'Edit'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 flex items-center gap-1 transition-colors shadow-sm"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload('md')}
                  className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  title="Download Markdown (.md)"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Key Selling Points Pills */}
            {result.key_selling_points && result.key_selling_points.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {result.key_selling_points.map((pt, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    ✓ {pt}
                  </span>
                ))}
              </div>
            )}

            {/* Content Area */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-h-[160px] max-h-[340px] overflow-y-auto">
              {isEditing ? (
                <textarea
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  rows={10}
                  className="w-full text-xs font-mono p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              ) : (
                <div className="prose prose-xs dark:prose-invert max-w-none whitespace-pre-wrap text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                  {editableContent || result.content}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
