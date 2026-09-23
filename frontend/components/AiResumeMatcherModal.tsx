'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { apiFetch } from '../lib/api-client';
import { AiMatchResponse, Resume } from '../lib/types';
import { useToast } from './ui/Toast';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  HelpCircle,
  Cpu,
  Copy,
  Check,
  FileText,
} from 'lucide-react';

interface AiResumeMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
  roleTitle?: string;
  initialResumeId?: string | null;
  initialResumeName?: string | null;
}

export const AiResumeMatcherModal: React.FC<AiResumeMatcherModalProps> = ({
  isOpen,
  onClose,
  companyName = 'Target Company',
  roleTitle = 'Software Engineer',
  initialResumeId,
  initialResumeName,
}) => {
  const { showToast } = useToast();
  const [jobDescription, setJobDescription] = useState<string>('');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(initialResumeId || '');
  const [extractedResumeText, setExtractedResumeText] = useState<string>('');
  const [wordCount, setWordCount] = useState<number>(0);
  const [loadingText, setLoadingText] = useState<boolean>(false);
  const [showCustomResumeEditor, setShowCustomResumeEditor] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<AiMatchResponse | null>(null);
  const [copiedTipIndex, setCopiedTipIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const activeId = initialResumeId || '';
      setSelectedResumeId(activeId);
      apiFetch<Resume[]>('/resumes')
        .then((data) => {
          setResumes(data);
          if (!activeId && data.length > 0) {
            setSelectedResumeId(data[0].id);
          }
        })
        .catch(() => setResumes([]));
    }
  }, [isOpen, initialResumeId]);

  useEffect(() => {
    if (!selectedResumeId) {
      setExtractedResumeText('');
      setWordCount(0);
      return;
    }

    setLoadingText(true);
    apiFetch<{ extracted_text: string; word_count: number }>(`/resumes/${selectedResumeId}/text`)
      .then((data) => {
        setExtractedResumeText(data.extracted_text || '');
        setWordCount(data.word_count || 0);
      })
      .catch(() => {
        setExtractedResumeText('');
        setWordCount(0);
      })
      .finally(() => setLoadingText(false));
  }, [selectedResumeId]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      showToast('Please paste a Job Description to analyze', 'error');
      return;
    }

    try {
      setIsAnalyzing(true);
      const result = await apiFetch<AiMatchResponse>('/ai/match-resume', {
        method: 'POST',
        body: JSON.stringify({
          job_description: jobDescription.trim(),
          resume_id: selectedResumeId || undefined,
          resume_text: extractedResumeText.trim() || undefined,
          role_title: roleTitle,
          company_name: companyName,
        }),
      });

      setMatchResult(result);
      showToast('ATS Match analysis complete', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to analyze resume', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyTip = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedTipIndex(index);
    showToast('Tip copied to clipboard', 'info');
    setTimeout(() => setCopiedTipIndex(null), 2000);
  };

  const loadSampleJd = () => {
    setJobDescription(
      `We are looking for a ${roleTitle} at ${companyName}.
Requirements:
- Strong proficiency in TypeScript, React, Next.js, and Node.js.
- Experience with PostgreSQL, Prisma ORM, and database architecture.
- Cloud deployment experience with AWS (S3, RDS, ECS) and Docker containerization.
- Clean code, unit testing (Jest), and RESTful API architecture.`,
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ATS Resume & Job Description Matcher"
      maxWidth="2xl"
    >
      <div className="space-y-4 text-[#FAFAFA]">
        {/* Banner */}
        <div className="p-3 rounded-lg bg-[#0E0E10] border border-[#27272A] flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-[#FAFAFA]">
              {roleTitle} at {companyName}
            </p>
            <p className="text-[#71717A] text-[11px] mt-0.5">
              Compare your resume against JD requirements for ATS score, keyword gaps, and interview focus areas.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Resume Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#D4D4D8]">
                  Resume Version
                </label>
                {wordCount > 0 && (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {wordCount}w
                  </span>
                )}
              </div>

              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full text-xs bg-[#0A0A0B] border border-[#27272A] rounded-md px-2.5 py-1.5 text-[#FAFAFA] focus:outline-none focus:border-indigo-500 font-mono"
              >
                {resumes.length > 0 ? (
                  resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.version_label} ({r.original_filename})
                    </option>
                  ))
                ) : (
                  <option value="">
                    {initialResumeName || 'Default Candidate Profile'}
                  </option>
                )}
              </select>

              <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setShowCustomResumeEditor((prev) => !prev)}
                  className="text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  <span>{showCustomResumeEditor ? 'hide text' : 'edit resume text'}</span>
                </button>
                {loadingText && <span className="text-[#71717A] animate-pulse">extracting...</span>}
              </div>
            </div>

            {/* Quick Helper Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={loadSampleJd}
                className="text-xs font-mono text-indigo-400 hover:underline flex items-center gap-1 py-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>+ fill sample JD</span>
              </button>
            </div>
          </div>

          {/* Optional Resume Text Preview / Editor */}
          {showCustomResumeEditor && (
            <div className="space-y-1 p-3 rounded bg-[#0E0E10] border border-[#27272A]">
              <label className="block text-[11px] font-mono text-[#71717A]">
                Resume text passed to AI:
              </label>
              <textarea
                rows={4}
                value={extractedResumeText}
                onChange={(e) => setExtractedResumeText(e.target.value)}
                placeholder="Extracted resume text..."
                className="w-full text-xs font-mono p-2 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Job Description Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#D4D4D8]">
                Job Description / Requirements *
              </label>
              <span className="text-[10px] font-mono text-[#71717A]">
                {jobDescription.length} chars
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="Paste the job description and requirements here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full text-xs font-mono p-2.5 rounded-md bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <Button
              type="submit"
              size="sm"
              isLoading={isAnalyzing}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Analyze Match
            </Button>
          </div>
        </form>

        {/* Results Panel */}
        {matchResult && (
          <div className="space-y-4 pt-4 border-t border-[#27272A] animate-in fade-in duration-200">
            {/* Score & Verdict Banner */}
            <div className="p-4 rounded-lg bg-[#0E0E10] border border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center font-mono font-semibold text-lg border ${
                    matchResult.score >= 80
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                      : matchResult.score >= 60
                      ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                      : 'bg-rose-950/60 border-rose-800 text-rose-400'
                  }`}
                >
                  {matchResult.score}%
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-[#FAFAFA]">
                      ATS Score: {matchResult.score}/100
                    </h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#18181B] border border-[#27272A] text-[#A1A1AA]">
                      {matchResult.verdict.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A1AA] mt-0.5 max-w-md">
                    {matchResult.summary}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-[#52525B]">
                {matchResult.analyzed_with}
              </span>
            </div>

            {/* Skills Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              {/* Matched Skills */}
              <div className="p-3 rounded-lg border border-[#27272A] bg-[#0E0E10]">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Matched Keywords ({matchResult.matched_skills.length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {matchResult.matched_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-[#18181B] text-emerald-400 border border-[#27272A]"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="p-3 rounded-lg border border-[#27272A] bg-[#0E0E10]">
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-[11px] mb-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Skill Gaps ({matchResult.missing_skills.length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {matchResult.missing_skills.length > 0 ? (
                    matchResult.missing_skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-[#18181B] text-rose-300 border border-[#27272A]"
                      >
                        + {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#71717A]">
                      No core skill gaps detected.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[#FAFAFA] font-semibold text-xs">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Resume Recommendations</span>
              </div>
              <div className="space-y-1.5">
                {matchResult.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded bg-[#0E0E10] border border-[#27272A] text-xs text-[#A1A1AA] flex items-start justify-between gap-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-indigo-400 text-xs">
                        {i + 1}.
                      </span>
                      <span>{rec}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyTip(rec, i)}
                      className="text-[#71717A] hover:text-[#FAFAFA] p-0.5 transition-colors"
                      title="Copy recommendation"
                    >
                      {copiedTipIndex === i ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Interview Prep Questions */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[#FAFAFA] font-semibold text-xs">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Likely Interview Focus Areas</span>
              </div>
              <div className="space-y-1.5">
                {matchResult.interview_focus_areas.map((q, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-[#0E0E10] border border-[#27272A] text-xs text-[#A1A1AA] font-mono"
                  >
                    <span className="text-indigo-400">Q{i + 1}:</span> {q}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
