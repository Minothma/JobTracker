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
  Award,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  HelpCircle,
  Cpu,
  RefreshCw,
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
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<AiMatchResponse | null>(null);
  const [copiedTipIndex, setCopiedTipIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedResumeId(initialResumeId || '');
      apiFetch<Resume[]>('/resumes')
        .then((data) => {
          setResumes(data);
          if (!selectedResumeId && data.length > 0) {
            setSelectedResumeId(data[0].id);
          }
        })
        .catch(() => setResumes([]));
    }
  }, [isOpen, initialResumeId]);

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
          role_title: roleTitle,
          company_name: companyName,
        }),
      });

      setMatchResult(result);
      showToast('AI ATS Analysis complete!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to analyze resume', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyTip = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedTipIndex(index);
    showToast('Tip copied to clipboard!', 'info');
    setTimeout(() => setCopiedTipIndex(null), 2000);
  };

  const loadSampleJd = () => {
    setJobDescription(
      `We are looking for a ${roleTitle} at ${companyName}.
Requirements:
- Strong proficiency in TypeScript, React, Next.js, and modern CSS/Tailwind.
- Hands-on experience building scalable backend microservices with Node.js and NestJS.
- Experience with PostgreSQL, Prisma ORM, and database schema migrations (Flyway).
- Familiarity with cloud platforms (AWS S3, RDS, ECS Fargate, CDK) and Docker containerization.
- Solid understanding of CI/CD pipelines (GitHub Actions), unit testing (Jest), and RESTful APIs.`,
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="✨ AI ATS Resume & Job Description Matcher"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Top Description Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-violet-500/10 border border-sky-200 dark:border-sky-900/50 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-sky-600 text-white shadow-sm mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Targeted Role: {roleTitle} at {companyName}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Compare your resume against this job posting using AI to maximize your ATS passing rate and prepare for technical interview rounds.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Resume Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Resume Version
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
            </div>

            {/* Quick Helper Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={loadSampleJd}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1.5 py-2"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Auto-fill Sample Job Description</span>
              </button>
            </div>
          </div>

          {/* Job Description Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Job Description / Requirements *
              </label>
              <span className="text-[11px] text-slate-400">
                {jobDescription.length} characters
              </span>
            </div>
            <textarea
              rows={5}
              placeholder="Paste the requirements, responsibilities, and qualifications from the job posting..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              size="md"
              isLoading={isAnalyzing}
              className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white shadow-sm"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Analyze ATS Match
            </Button>
          </div>
        </form>

        {/* Results Panel */}
        {matchResult && (
          <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
            {/* Score & Verdict Banner */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center font-extrabold text-2xl text-white shadow-md ${
                    matchResult.score >= 80
                      ? 'bg-gradient-to-tr from-emerald-600 to-teal-400'
                      : matchResult.score >= 60
                      ? 'bg-gradient-to-tr from-amber-600 to-amber-400'
                      : 'bg-gradient-to-tr from-rose-600 to-rose-400'
                  }`}
                >
                  {matchResult.score}%
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      ATS Match Score
                    </h3>
                    <Badge
                      variant={
                        matchResult.verdict === 'STRONG_MATCH'
                          ? 'success'
                          : matchResult.verdict === 'MODERATE_MATCH'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {matchResult.verdict.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                    {matchResult.summary}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 self-end sm:self-center">
                <Cpu className="w-3.5 h-3.5" />
                <span>{matchResult.analyzed_with}</span>
              </div>
            </div>

            {/* Skills Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Matched Skills */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-950 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Matched Skills & Keywords ({matchResult.matched_skills.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.matched_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/20">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs mb-3">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Missing Keywords & Skill Gaps ({matchResult.missing_skills.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.missing_skills.length > 0 ? (
                    matchResult.missing_skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800"
                      >
                        + {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">
                      Zero missing core keywords detected!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Actionable Resume Tailoring Recommendations</span>
              </div>
              <div className="space-y-2">
                {matchResult.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-sky-600 dark:text-sky-400">
                        {i + 1}.
                      </span>
                      <span>{rec}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyTip(rec, i)}
                      className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors p-1"
                      title="Copy tip"
                    >
                      {copiedTipIndex === i ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Interview Prep Questions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs">
                <HelpCircle className="w-4 h-4 text-violet-500" />
                <span>Likely Interview Focus Areas & Questions</span>
              </div>
              <div className="space-y-2">
                {matchResult.interview_focus_areas.map((q, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-900/40 text-xs text-slate-700 dark:text-slate-300"
                  >
                    💬 <strong>Q{i + 1}:</strong> {q}
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
