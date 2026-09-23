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
      showToast(`Answer evaluated: ${res.score}/100 (${res.verdict})`, 'success');
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
      if (result.questions && result.questions.length > 0) {
        setExpandedQuestions({ [result.questions[0].id || '0']: true });
      }
      showToast('Generated 5 interview practice questions', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate interview questions', 'error');
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
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyFullPrepSheet = () => {
    if (!prepResult) return;

    let markdown = `# Interview Prep: ${prepResult.role_title} at ${prepResult.company_name}\n`;
    markdown += `Format: ${prepResult.round_type}\n\n`;

    markdown += `## Strategic Tips\n`;
    prepResult.general_interview_tips.forEach((tip, idx) => {
      markdown += `${idx + 1}. ${tip}\n`;
    });
    markdown += `\n---\n\n## Practice Questions\n\n`;

    prepResult.questions.forEach((q, idx) => {
      markdown += `### Q${idx + 1} [${q.category} - ${q.difficulty}]: ${q.question}\n`;
      markdown += `**Why Asked:**\n${q.context_or_why_asked}\n\n`;
      markdown += `**Answer Framework:**\n${q.sample_answer_framework}\n\n---\n\n`;
    });

    handleCopyText(markdown, 'full-sheet', 'Copied full prep sheet (Markdown)');
  };

  const getCategoryBadge = (category: string) => {
    return (
      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#18181B] text-[#A1A1AA] border border-[#27272A]">
        {category.toLowerCase()}
      </span>
    );
  };

  const getDifficultyBadge = (difficulty: string) => {
    const color =
      difficulty === 'EASY'
        ? 'text-emerald-400'
        : difficulty === 'MEDIUM'
        ? 'text-amber-400'
        : 'text-rose-400';
    return (
      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#18181B] border border-[#27272A] ${color}`}>
        {difficulty.toLowerCase()}
      </span>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Interview Prep & STAR Coach" maxWidth="2xl">
      <div className="space-y-4 text-[#FAFAFA]">
        {/* Header summary banner */}
        <div className="p-3 rounded-lg bg-[#0E0E10] border border-[#27272A] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[#18181B] text-indigo-400">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#FAFAFA]">
                {roleTitle} <span className="text-[#71717A]">at</span> {companyName}
              </h4>
              <p className="text-[11px] font-mono text-[#71717A]">
                Tailored interview questions synthesized from requirements & candidate background.
              </p>
            </div>
          </div>
          {prepResult && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyFullPrepSheet}
              className="text-xs font-mono"
            >
              {copiedKey === 'full-sheet' ? (
                <>
                  <Check className="h-3 w-3 mr-1 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Export Sheet
                </>
              )}
            </Button>
          )}
        </div>

        {/* Configuration Controls */}
        <div className="p-3.5 rounded-lg bg-[#0E0E10] border border-[#27272A] space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
                Round Format
              </label>
              <select
                value={roundType}
                onChange={(e) => setRoundType(e.target.value as InterviewRoundType)}
                className="w-full bg-[#0A0A0B] border border-[#27272A] rounded px-2.5 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="MIXED">Mixed (Technical & STAR)</option>
                <option value="TECHNICAL">Technical Architecture</option>
                <option value="SYSTEM_DESIGN">System Design</option>
                <option value="BEHAVIORAL">Behavioral (STAR Method)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
                Context Resume
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#27272A] rounded px-2.5 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-indigo-500 font-mono"
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
              <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
                Focus Topics (Optional)
              </label>
              <input
                type="text"
                value={focusAreaInput}
                onChange={(e) => setFocusAreaInput(e.target.value)}
                placeholder="e.g. Postgres, Microservices"
                className="w-full bg-[#0A0A0B] border border-[#27272A] rounded px-2.5 py-1.5 text-xs text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              size="sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  {prepResult ? 'Regenerate Questions' : 'Generate Practice Questions'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results Area */}
        {prepResult && (
          <div className="space-y-4">
            {/* General Tips Card */}
            {prepResult.general_interview_tips && prepResult.general_interview_tips.length > 0 && (
              <div className="p-3 rounded-lg bg-[#0E0E10] border border-[#27272A] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>Strategic Tips for {prepResult.company_name}</span>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-0.5">
                  {prepResult.general_interview_tips.map((tip, idx) => (
                    <li
                      key={idx}
                      className="p-2 rounded bg-[#0A0A0B] border border-[#27272A] text-xs text-[#A1A1AA] leading-relaxed flex items-start gap-1.5"
                    >
                      <span className="font-mono text-amber-400 text-xs">{idx + 1}.</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Questions Header with Expand/Collapse All */}
            <div className="flex items-center justify-between pt-1">
              <h4 className="text-xs font-mono text-[#FAFAFA] flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>Questions ({prepResult.questions.length})</span>
                <span className="text-[#52525B]">
                  • {prepResult.generated_with}
                </span>
              </h4>
              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={expandAll}
                  className="text-[#71717A] hover:text-[#FAFAFA] transition-colors"
                >
                  expand all
                </button>
                <span className="text-[#27272A]">|</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="text-[#71717A] hover:text-[#FAFAFA] transition-colors"
                >
                  collapse all
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-2.5">
              {prepResult.questions.map((q, idx) => {
                const qId = q.id || String(idx);
                const isExpanded = !!expandedQuestions[qId];

                return (
                  <div
                    key={qId}
                    className="rounded-lg bg-[#0E0E10] border border-[#27272A] overflow-hidden"
                  >
                    <div
                      onClick={() => toggleQuestion(qId)}
                      className="p-3 cursor-pointer flex items-start justify-between gap-3 select-none hover:bg-[#151518] transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-mono text-[#71717A]">Q{idx + 1}</span>
                          {getCategoryBadge(q.category)}
                          {getDifficultyBadge(q.difficulty)}
                        </div>
                        <p className="text-xs font-medium text-[#FAFAFA] leading-snug">
                          {q.question}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(q.question, `q-${qId}`, 'Copied question text');
                          }}
                          className="p-1 rounded bg-[#18181B] hover:bg-[#27272A] text-[#71717A] hover:text-[#FAFAFA] transition-colors"
                          title="Copy question"
                        >
                          {copiedKey === `q-${qId}` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                        <div className="text-[#52525B]">
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-[#27272A] bg-[#0A0A0B] space-y-2.5 text-xs">
                        {/* Why Asked */}
                        <div className="p-2.5 rounded bg-[#121214] border border-[#27272A] space-y-1">
                          <div className="flex items-center gap-1 text-indigo-400 font-mono text-[11px]">
                            <HelpCircle className="h-3 w-3" />
                            <span>Interviewer Intent</span>
                          </div>
                          <p className="text-[#A1A1AA] leading-relaxed">
                            {q.context_or_why_asked}
                          </p>
                        </div>

                        {/* Suggested Framework */}
                        <div className="p-2.5 rounded bg-[#121214] border border-[#27272A] space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-indigo-400 font-mono text-[11px]">
                              <ShieldCheck className="h-3 w-3" />
                              <span>Answer Strategy & Framework</span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(
                                  q.sample_answer_framework,
                                  `ans-${qId}`,
                                  'Copied answer framework',
                                )
                              }
                              className="text-[10px] font-mono text-[#71717A] hover:text-[#FAFAFA] flex items-center gap-1"
                            >
                              {copiedKey === `ans-${qId}` ? (
                                <>
                                  <Check className="h-2.5 w-2.5 text-emerald-400" />
                                  copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-2.5 w-2.5" />
                                  copy
                                </>
                              )}
                            </button>
                          </div>
                          <div className="text-[#A1A1AA] whitespace-pre-line leading-relaxed font-mono text-xs bg-[#0A0A0B] p-2 rounded border border-[#27272A]">
                            {q.sample_answer_framework}
                          </div>
                        </div>

                        {/* Interactive AI Answer Evaluation */}
                        <div className="p-2.5 rounded bg-[#121214] border border-[#27272A] space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[#FAFAFA] font-mono text-[11px]">
                              <Brain className="h-3 w-3 text-indigo-400" />
                              <span>Practice Answer (STAR Grade)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setPracticeOpen((prev) => ({ ...prev, [qId]: !prev[qId] }))
                              }
                              className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300"
                            >
                              {practiceOpen[qId] ? 'hide box' : 'practice answer →'}
                            </button>
                          </div>

                          {practiceOpen[qId] && (
                            <div className="space-y-2 pt-1">
                              <textarea
                                value={userAnswers[qId] || ''}
                                onChange={(e) =>
                                  setUserAnswers((prev) => ({ ...prev, [qId]: e.target.value }))
                                }
                                placeholder="Type your spoken answer here using Situation, Task, Action, Result..."
                                rows={3}
                                className="w-full text-xs p-2 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500 font-mono"
                              />

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-mono text-[#52525B]">
                                  {(userAnswers[qId] || '').split(/\s+/).filter(Boolean).length} words
                                </span>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleEvaluateAnswer(qId, q.question, q.category)}
                                  disabled={evaluatingQuestionId === qId || !(userAnswers[qId] || '').trim()}
                                  className="text-xs py-1"
                                >
                                  {evaluatingQuestionId === qId ? (
                                    <>
                                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                      Grading...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      Grade Answer
                                    </>
                                  )}
                                </Button>
                              </div>

                              {/* Evaluation Results Card */}
                              {evaluations[qId] && (
                                <div className="p-2.5 rounded bg-[#0A0A0B] border border-[#27272A] space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs text-[#FAFAFA]">
                                      Score: <strong className="text-emerald-400">{evaluations[qId].score}/100</strong>
                                    </span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#18181B] border border-[#27272A] text-[#A1A1AA]">
                                      {evaluations[qId].verdict.toLowerCase()}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                                    {Object.entries(evaluations[qId].star_breakdown).map(
                                      ([key, item]) => (
                                        <div
                                          key={key}
                                          className="p-1 rounded bg-[#121214] border border-[#27272A]"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-[#A1A1AA]">{key}</span>
                                            <span className={item.present ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                                              {item.present ? 'PASS' : 'MISSING'}
                                            </span>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>

                                  {evaluations[qId].improved_answer && (
                                    <div className="p-2 rounded bg-[#121214] border border-[#27272A] text-[11px] text-[#A1A1AA] space-y-1">
                                      <div className="flex items-center justify-between font-mono text-[10px] text-indigo-400">
                                        <span>Model Revision:</span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleCopyText(
                                              evaluations[qId].improved_answer,
                                              `eval-ans-${qId}`,
                                              'Copied model answer',
                                            )
                                          }
                                          className="hover:underline"
                                        >
                                          {copiedKey === `eval-ans-${qId}` ? 'copied' : 'copy'}
                                        </button>
                                      </div>
                                      <p className="italic leading-relaxed font-mono">
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
      </div>
    </Modal>
  );
};
