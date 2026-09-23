'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { apiFetch } from '../lib/api-client';
import {
  AiInterviewPrepResponse,
  InterviewQuestion,
  InterviewRoundType,
  Resume,
  AiAnswerEvaluationResponse,
} from '../lib/types';
import { useToast } from './ui/Toast';
import {
  Sparkles,
  Brain,
  Layers,
  Copy,
  Check,
  Lightbulb,
  HelpCircle,
  RefreshCw,
  Target,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  Zap,
  Award,
  ThumbsUp,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';

interface AiInterviewPrepModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  companyName?: string;
  roleTitle?: string;
  jobDescription?: string;
  initialResumeId?: string | null;
  initialRoundType?: InterviewRoundType;
}

export const AiInterviewPrepModal: React.FC<AiInterviewPrepModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  companyName = 'Target Company',
  roleTitle = 'Software Engineer',
  jobDescription = '',
  initialResumeId,
  initialRoundType = 'MIXED',
}) => {
  const { showToast } = useToast();
  const [roundType, setRoundType] = useState<InterviewRoundType>(initialRoundType);
  const [focusAreaInput, setFocusAreaInput] = useState<string>('');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(initialResumeId || '');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [prepResult, setPrepResult] = useState<AiInterviewPrepResponse | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // STAR Evaluation state
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, AiAnswerEvaluationResponse>>({});
  const [evaluatingQuestionId, setEvaluatingQuestionId] = useState<string | null>(null);
  const [practiceOpen, setPracticeOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setRoundType(initialRoundType || 'MIXED');
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
  }, [isOpen, initialResumeId, initialRoundType]);

  const handleEvaluateAnswer = async (qId: string, questionText: string, category: string) => {
    const answerText = userAnswers[qId]?.trim();
    if (!answerText) {
      showToast('Please type your practice answer before evaluating', 'error');
      return;
    }

    try {
      setEvaluatingQuestionId(qId);
      const res = await apiFetch<AiAnswerEvaluationResponse>('/ai/evaluate-answer', {
        method: 'POST',
        body: JSON.stringify({
          question: questionText,
          candidate_answer: answerText,
          role_title: roleTitle,
          company_name: companyName,
          round_type: category || roundType,
        }),
      });

      setEvaluations((prev) => ({ ...prev, [qId]: res }));
      showToast(`Answer evaluated! Score: ${res.score}/100 (${res.verdict})`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to evaluate answer', 'error');
    } finally {
      setEvaluatingQuestionId(null);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      setIsGenerating(true);
      const focusAreas = focusAreaInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const result = await apiFetch<AiInterviewPrepResponse>('/ai/interview-prep', {
        method: 'POST',
        body: JSON.stringify({
          application_id: applicationId || undefined,
          role_title: roleTitle,
          company_name: companyName,
          job_description: jobDescription || undefined,
          resume_id: selectedResumeId || undefined,
          round_type: roundType,
          focus_areas: focusAreas.length > 0 ? focusAreas : undefined,
        }),
      });

      setPrepResult(result);
      // Auto-expand the first question
      if (result.questions && result.questions.length > 0) {
        setExpandedQuestions({ [result.questions[0].id || '0']: true });
      }
      showToast('Generated 5 tailored interview practice questions!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate interview practice questions', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    if (!prepResult?.questions) return;
    const allExpanded: Record<string, boolean> = {};
    prepResult.questions.forEach((q, idx) => {
      allExpanded[q.id || String(idx)] = true;
    });
    setExpandedQuestions(allExpanded);
  };

  const collapseAll = () => {
    setExpandedQuestions({});
  };

  const handleCopyText = (text: string, key: string, successMsg: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(successMsg, 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyFullPrepSheet = () => {
    if (!prepResult) return;

    let markdown = `# Interview Prep Sheet: ${prepResult.role_title} at ${prepResult.company_name}\n`;
    markdown += `*Format:* ${prepResult.round_type} Round | *Engine:* ${prepResult.generated_with}\n\n`;

    markdown += `## General Strategic Tips\n`;
    prepResult.general_interview_tips.forEach((tip, idx) => {
      markdown += `${idx + 1}. ${tip}\n`;
    });
    markdown += `\n---\n\n## Practice Questions & Suggested Frameworks\n\n`;

    prepResult.questions.forEach((q, idx) => {
      markdown += `### Q${idx + 1} [${q.category} - ${q.difficulty}]: ${q.question}\n`;
      markdown += `**Why Interviewers Ask This:**\n${q.context_or_why_asked}\n\n`;
      markdown += `**Suggested Answer Framework:**\n${q.sample_answer_framework}\n\n---\n\n`;
    });

    handleCopyText(markdown, 'full-sheet', 'Copied full interview prep sheet (Markdown) to clipboard!');
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'TECHNICAL':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'SYSTEM_DESIGN':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'BEHAVIORAL':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'EXPERIENCE':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-300 border border-slate-500/20';
    }
  };

  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'HARD':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-300 border border-slate-500/20';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Mock Interview Prep & Practice Questions" maxWidth="2xl">
      <div className="space-y-6">
        {/* Header summary banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">
                {roleTitle} <span className="text-slate-400">at</span> {companyName}
              </h4>
              <p className="text-xs text-slate-400">
                Tailored AI practice questions synthesized from job requirements, candidate skills & round format.
              </p>
            </div>
          </div>
          {prepResult && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyFullPrepSheet}
                className="text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
              >
                {copiedKey === 'full-sheet' ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5 text-green-400" />
                    Copied Prep Sheet
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Export Prep Sheet
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Configuration Controls */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Round Type Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-indigo-400" />
                Interview Round Format
              </label>
              <select
                value={roundType}
                onChange={(e) => setRoundType(e.target.value as InterviewRoundType)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="MIXED">Mixed Round (Technical, System & Behavioral)</option>
                <option value="TECHNICAL">Deep Technical & Code Architecture</option>
                <option value="SYSTEM_DESIGN">System Design & Scalability</option>
                <option value="BEHAVIORAL">Behavioral (STAR Method & Leadership)</option>
              </select>
            </div>

            {/* Resume Version Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-400" />
                Context Resume
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">General Candidate Profile</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.version_label} ({r.original_filename})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Focus Tags */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                Focus Topics (Optional)
              </label>
              <input
                type="text"
                value={focusAreaInput}
                onChange={(e) => setFocusAreaInput(e.target.value)}
                placeholder="e.g. Microservices, SQS, Team Conflict"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs px-4 py-2 font-medium shadow-lg shadow-purple-600/20"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  {prepResult ? 'Regenerate Practice Questions' : 'Generate Practice Questions'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results Area */}
        {prepResult && (
          <div className="space-y-6">
            {/* General Tips Card */}
            {prepResult.general_interview_tips && prepResult.general_interview_tips.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  Strategic Interview Tips for {prepResult.company_name}
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {prepResult.general_interview_tips.map((tip, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed flex items-start gap-2"
                    >
                      <span className="font-bold text-amber-400 text-xs mt-0.5">{idx + 1}.</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Questions Header with Expand/Collapse All */}
            <div className="flex items-center justify-between pt-2">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" />
                Practice Questions ({prepResult.questions.length})
                <span className="text-xs font-normal text-slate-500">
                  Powered by {prepResult.generated_with}
                </span>
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Expand All
                </button>
                <span className="text-slate-700">|</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {prepResult.questions.map((q, idx) => {
                const qId = q.id || String(idx);
                const isExpanded = !!expandedQuestions[qId];

                return (
                  <div
                    key={qId}
                    className="rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all overflow-hidden"
                  >
                    {/* Question Card Header / Summary */}
                    <div
                      onClick={() => toggleQuestion(qId)}
                      className="p-4 cursor-pointer flex items-start justify-between gap-4 select-none hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-400">Q{idx + 1}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${getCategoryBadgeClass(q.category)}`}>
                            {q.category}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${getDifficultyBadgeClass(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-100 leading-snug">
                          {q.question}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(q.question, `q-${qId}`, 'Copied question text to clipboard!');
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Copy question text"
                        >
                          {copiedKey === `q-${qId}` ? (
                            <Check className="h-3.5 w-3.5 text-green-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <div className="text-slate-400">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Context & Answer Framework */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 bg-slate-950/40 space-y-3 text-xs">
                        {/* Why Asked */}
                        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold uppercase text-[11px] tracking-wider">
                            <HelpCircle className="h-3.5 w-3.5" />
                            Interviewer Intent & Key Signals
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            {q.context_or_why_asked}
                          </p>
                        </div>

                        {/* Suggested Framework */}
                        <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-900/30 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-purple-300 font-semibold uppercase text-[11px] tracking-wider">
                              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                              Recommended Answer Framework / Strategy
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(
                                  q.sample_answer_framework,
                                  `ans-${qId}`,
                                  'Copied answer framework to clipboard!',
                                )
                              }
                              className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            >
                              {copiedKey === `ans-${qId}` ? (
                                <>
                                  <Check className="h-3 w-3 text-green-400" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  Copy Strategy
                                </>
                              )}
                            </button>
                          </div>
                          <div className="text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-slate-950/60 p-2.5 rounded border border-purple-500/10">
                            {q.sample_answer_framework}
                          </div>
                        </div>

                        {/* Interactive AI Answer Evaluation & STAR Coach */}
                        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-sky-400 font-semibold uppercase text-[11px] tracking-wider">
                              <Brain className="h-3.5 w-3.5 text-sky-400" />
                              Practice & AI STAR Evaluation
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setPracticeOpen((prev) => ({ ...prev, [qId]: !prev[qId] }))
                              }
                              className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                            >
                              {practiceOpen[qId] ? 'Hide Practice Box' : 'Type Your Answer →'}
                            </button>
                          </div>

                          {practiceOpen[qId] && (
                            <div className="space-y-2.5 pt-1">
                              <textarea
                                value={userAnswers[qId] || ''}
                                onChange={(e) =>
                                  setUserAnswers((prev) => ({ ...prev, [qId]: e.target.value }))
                                }
                                placeholder="Type or paste your spoken practice answer here (e.g. When at my previous role, I noticed high API latency... I implemented indexing... which reduced latency by 40%)..."
                                rows={4}
                                className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                              />

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] text-slate-400">
                                  {(userAnswers[qId] || '').split(/\s+/).filter(Boolean).length} words
                                </span>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleEvaluateAnswer(qId, q.question, q.category)}
                                  disabled={evaluatingQuestionId === qId || !(userAnswers[qId] || '').trim()}
                                  className="text-xs py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white shadow-sm flex items-center gap-1.5"
                                >
                                  {evaluatingQuestionId === qId ? (
                                    <>
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                      <span>Grading STAR Rubric...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-3 w-3" />
                                      <span>Grade Answer (STAR)</span>
                                    </>
                                  )}
                                </Button>
                              </div>

                              {/* Evaluation Results Card */}
                              {evaluations[qId] && (
                                <div className="p-3 rounded-lg bg-slate-950 border border-sky-900/50 space-y-2.5 animate-in fade-in duration-200">
                                  {/* Score Banner */}
                                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="flex items-center gap-2">
                                      <Award className="h-4 w-4 text-amber-400" />
                                      <span className="font-bold text-xs text-white">
                                        Overall Score: {evaluations[qId].score}/100
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                        evaluations[qId].verdict === 'EXCELLENT'
                                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                          : evaluations[qId].verdict === 'SOLID'
                                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                                      }`}
                                    >
                                      {evaluations[qId].verdict}
                                    </span>
                                  </div>

                                  {/* STAR Breakdown */}
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {Object.entries(evaluations[qId].star_breakdown).map(
                                      ([key, item]) => (
                                        <div
                                          key={key}
                                          className="p-1.5 rounded bg-slate-900/60 border border-slate-800 text-[11px]"
                                        >
                                          <div className="flex items-center justify-between font-semibold capitalize text-slate-300">
                                            <span>{key}</span>
                                            <span
                                              className={
                                                item.present ? 'text-emerald-400' : 'text-amber-400'
                                              }
                                            >
                                              {item.present ? '✓ Included' : '⚠ Missing'}
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                            {item.comment}
                                          </p>
                                        </div>
                                      ),
                                    )}
                                  </div>

                                  {/* Strengths & Improvements */}
                                  <div className="space-y-1.5 text-[11px]">
                                    {evaluations[qId].strengths.length > 0 && (
                                      <div className="text-emerald-400">
                                        <strong>Strengths:</strong>{' '}
                                        {evaluations[qId].strengths.join(' • ')}
                                      </div>
                                    )}
                                    {evaluations[qId].improvements.length > 0 && (
                                      <div className="text-amber-300">
                                        <strong>To Improve:</strong>{' '}
                                        {evaluations[qId].improvements.join(' • ')}
                                      </div>
                                    )}
                                  </div>

                                  {/* Model Improved Answer */}
                                  {evaluations[qId].improved_answer && (
                                    <div className="p-2 rounded bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-slate-300 space-y-1">
                                      <div className="flex items-center justify-between text-indigo-300 font-semibold">
                                        <span>Model Revision (High Impact):</span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleCopyText(
                                              evaluations[qId].improved_answer,
                                              `eval-ans-${qId}`,
                                              'Copied model answer!',
                                            )
                                          }
                                          className="text-[10px] text-indigo-400 hover:text-indigo-200"
                                        >
                                          {copiedKey === `eval-ans-${qId}` ? 'Copied' : 'Copy'}
                                        </button>
                                      </div>
                                      <p className="italic leading-relaxed">
                                        "{evaluations[qId].improved_answer}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Initial Empty State before generation */}
        {!prepResult && !isGenerating && (
          <div className="p-8 text-center rounded-xl bg-slate-900/30 border border-dashed border-slate-800 space-y-3">
            <div className="h-12 w-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto ring-1 ring-purple-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">
                Ready to practice for {roleTitle} at {companyName}?
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Choose your interview format above and click Generate to receive 5 targeted technical & behavioral practice questions with model answer frameworks.
              </p>
            </div>
            <Button
              onClick={() => handleGenerate()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs px-5 py-2 font-medium shadow-md shadow-purple-600/20"
            >
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Generate Practice Questions
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
