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
      showToast('Please specify company name and role title', 'error');
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
      showToast('Generated application content', 'success');
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
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (fileExt: 'md' | 'txt') => {
    const textToDownload = isEditing ? editableContent : result?.content;
    if (!textToDownload) return;

    const filename = `${companyName.toLowerCase().replace(/\s+/g, '-')}-${roleTitle.toLowerCase().replace(/\s+/g, '-')}-${format === 'LINKEDIN_INMAIL_PITCH' ? 'inmail' : 'cover-letter'}.${fileExt}`;
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
      title="AI Cover Letter & InMail Pitch"
      maxWidth="2xl"
    >
      <div className="space-y-4 text-[#FAFAFA]">
        {/* Input Parameters Box */}
        <div className="p-3.5 rounded-lg bg-[#0E0E10] border border-[#27272A] space-y-3.5">
          {/* Format Selector Pills */}
          <div>
            <label className="block text-xs font-medium text-[#D4D4D8] mb-1.5 flex items-center gap-1.5 font-mono">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Format</span>
            </label>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setFormat('FULL_COVER_LETTER')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs transition-colors ${
                  format === 'FULL_COVER_LETTER'
                    ? 'bg-[#27272A] text-[#FAFAFA] border border-[#3F3F46]'
                    : 'bg-[#0A0A0B] text-[#71717A] border border-[#27272A] hover:text-[#FAFAFA]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Full Cover Letter</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('LINKEDIN_INMAIL_PITCH')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs transition-colors ${
                  format === 'LINKEDIN_INMAIL_PITCH'
                    ? 'bg-[#27272A] text-[#FAFAFA] border border-[#3F3F46]'
                    : 'bg-[#0A0A0B] text-[#71717A] border border-[#27272A] hover:text-[#FAFAFA]'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>LinkedIn InMail (&lt;160w)</span>
              </button>
            </div>
          </div>

          {/* Company & Role Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe"
                className="w-full text-xs px-2.5 py-1.5 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
                Role Title *
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Full Stack Engineer"
                className="w-full text-xs px-2.5 py-1.5 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Resume & Tone Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div>
              <label className="block text-xs font-medium text-[#D4D4D8] mb-1 font-sans">
                Context Resume
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                disabled={loadingResumes}
                className="w-full text-xs px-2.5 py-1.5 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] focus:outline-none focus:border-indigo-500"
              >
                <option value="">Default Profile</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.version_label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#D4D4D8] mb-1 font-sans">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as CoverLetterTone)}
                className="w-full text-xs px-2.5 py-1.5 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] focus:outline-none focus:border-indigo-500"
              >
                <option value="PROFESSIONAL">Professional & Direct</option>
                <option value="ENTHUSIASTIC">Warm & Enthusiastic</option>
                <option value="CONFIDENT">Confident & Strategic</option>
                <option value="CONCISE">Concise & Metric-Driven</option>
              </select>
            </div>
          </div>

          {/* Key Achievements */}
          <div>
            <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
              Key Talking Points / Metrics (Optional)
            </label>
            <input
              type="text"
              value={keyAchievements}
              onChange={(e) => setKeyAchievements(e.target.value)}
              placeholder="e.g. Scaled database to 10M req/day, built Next.js frontend from scratch"
              className="w-full text-xs px-2.5 py-1.5 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !companyName.trim() || !roleTitle.trim()}
            className="w-full text-xs py-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin mr-1.5" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                <span>
                  Generate {format === 'LINKEDIN_INMAIL_PITCH' ? 'InMail Pitch' : 'Cover Letter'}
                </span>
              </>
            )}
          </Button>
        </div>

        {/* Generated Output Preview Section */}
        {result && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-md bg-[#0E0E10] border border-[#27272A] font-mono text-xs text-[#71717A]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[#FAFAFA]">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  {result.word_count} words
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#52525B]" />
                  {result.estimated_reading_minutes}m read
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing((prev) => !prev)}
                  className="px-2 py-0.5 rounded text-xs text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B] border border-[#27272A] flex items-center gap-1 transition-colors"
                >
                  {isEditing ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                  <span>{isEditing ? 'preview' : 'edit'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2 py-0.5 rounded text-xs bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'copied' : 'copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload('md')}
                  className="p-1 rounded text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B] border border-[#27272A]"
                  title="Download Markdown (.md)"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-3.5 rounded-lg bg-[#0E0E10] border border-[#27272A] min-h-[140px] max-h-[300px] overflow-y-auto">
              {isEditing ? (
                <textarea
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  rows={8}
                  className="w-full text-xs font-mono p-2 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <div className="whitespace-pre-wrap text-xs text-[#FAFAFA] leading-relaxed font-sans">
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
