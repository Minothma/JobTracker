'use client';

import React, { useState } from 'react';
import { Interview } from '../../../../lib/types';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { Input, Select } from '../../../../components/ui/Input';
import { apiFetch } from '../../../../lib/api-client';
import { useToast } from '../../../../components/ui/Toast';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../../../../lib/calendar';
import { AiInterviewPrepModal } from '../../../../components/AiInterviewPrepModal';
import { Video, Plus, Calendar, Trash2, ExternalLink, Download, Brain } from 'lucide-react';

interface InterviewSectionProps {
  applicationId: string;
  companyName?: string;
  roleTitle?: string;
  interviews: Interview[];
  onInterviewsChange: (updated: Interview[]) => void;
}

export const InterviewSection: React.FC<InterviewSectionProps> = ({
  applicationId,
  companyName = 'Company',
  roleTitle = 'Position',
  interviews,
  onInterviewsChange,
}) => {
  const { showToast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAiPrepModalOpen, setIsAiPrepModalOpen] = useState(false);
  const [roundType, setRoundType] = useState('Technical Interview');
  const [scheduledAt, setScheduledAt] = useState('');
  const [outcome, setOutcome] = useState('PENDING');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roundType.trim() || !scheduledAt) {
      showToast('Round type and scheduled date/time are required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const newInterview = await apiFetch<Interview>(`/applications/${applicationId}/interviews`, {
        method: 'POST',
        body: JSON.stringify({
          round_type: roundType.trim(),
          scheduled_at: new Date(scheduledAt).toISOString(),
          outcome: outcome || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      onInterviewsChange([...interviews, newInterview]);
      showToast('Interview round scheduled', 'success');
      setIsAddModalOpen(false);
      setRoundType('Technical Interview');
      setScheduledAt('');
      setOutcome('PENDING');
      setNotes('');
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule interview round', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOutcomeChange = async (interviewId: string, newOutcome: string) => {
    try {
      const updated = await apiFetch<Interview>(`/interviews/${interviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ outcome: newOutcome }),
      });

      onInterviewsChange(
        interviews.map((item) => (item.id === interviewId ? updated : item)),
      );
      showToast(`Outcome updated to ${newOutcome}`, 'success');
    } catch {
      showToast('Failed to update outcome', 'error');
    }
  };

  const handleDeleteRound = async (interviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this interview round?')) return;

    try {
      await apiFetch(`/interviews/${interviewId}`, { method: 'DELETE' });
      onInterviewsChange(interviews.filter((item) => item.id !== interviewId));
      showToast('Interview round removed', 'success');
    } catch {
      showToast('Failed to remove interview round', 'error');
    }
  };

  const outcomeOptions = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Passed', value: 'PASSED' },
    { label: 'Failed', value: 'FAILED' },
  ];

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-lg p-5 space-y-4 text-[#FAFAFA]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#18181B] text-amber-400 border border-[#27272A]">
            <Video className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-[#FAFAFA]">Interview Rounds</h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[#71717A]">
            {interviews.length}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAiPrepModalOpen(true)}
            title="Practice realistic questions tailored for this role"
          >
            <Brain className="w-3.5 h-3.5 mr-1 text-indigo-400" />
            AI Mock Prep
          </Button>

          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Schedule Round
          </Button>
        </div>
      </div>

      {interviews.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-[#27272A] rounded-lg text-xs font-mono text-[#52525B]">
          No interview rounds scheduled yet.
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((round) => {
            const formattedDate = new Date(round.scheduled_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            });

            const calendarEvent = {
              title: `[Interview] ${round.round_type} - ${companyName} (${roleTitle})`,
              description: `Interview round: ${round.round_type}\nCompany: ${companyName}\nRole: ${roleTitle}\n\nPrep Notes:\n${round.notes || 'None'}\n\nTracked in JobTracker.`,
              location: `${companyName} Video / Online`,
              startTime: round.scheduled_at,
              durationMinutes: 60,
            };

            const gcalUrl = generateGoogleCalendarUrl(calendarEvent);

            return (
              <div
                key={round.id}
                className="p-3.5 rounded-md border border-[#27272A] bg-[#0E0E10] flex flex-col gap-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm text-[#FAFAFA]">
                        {round.round_type}
                      </h3>
                      <Badge status={round.outcome || 'PENDING'} />
                    </div>

                    <div className="flex items-center gap-1 text-xs font-mono text-[#71717A]">
                      <Calendar className="w-3 h-3 text-[#52525B]" />
                      <span>{formattedDate}</span>
                    </div>

                    {round.notes && (
                      <p className="text-xs text-[#A1A1AA] mt-1.5 bg-[#0A0A0B] p-2.5 rounded border border-[#27272A] font-mono whitespace-pre-wrap">
                        {round.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-start">
                    <select
                      value={round.outcome || 'PENDING'}
                      onChange={(e) => handleOutcomeChange(round.id, e.target.value)}
                      className="text-xs font-mono bg-[#0A0A0B] border border-[#27272A] rounded px-2 py-1 text-[#FAFAFA] focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {outcomeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleDeleteRound(round.id)}
                      className="text-[#52525B] hover:text-rose-400 p-1 rounded transition-colors"
                      title="Delete round"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Calendar Sync Action Toolbar */}
                <div className="pt-2 border-t border-[#27272A] flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                  <span className="text-[#52525B]">
                    sync:
                  </span>

                  <div className="flex items-center gap-2">
                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-indigo-400 transition-colors"
                      title="Add to Google Calendar"
                    >
                      <span>google cal</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        downloadIcsFile(calendarEvent);
                        showToast('Downloaded .ics calendar invite', 'success');
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
                      title="Download .ics file for Outlook / Apple Calendar"
                    >
                      <Download className="w-2.5 h-2.5" />
                      <span>.ics</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Interview Round"
      >
        <form onSubmit={handleAddRound} className="space-y-3.5">
          <Input
            label="Round Type *"
            placeholder="e.g. Technical Screen, System Design"
            value={roundType}
            onChange={(e) => setRoundType(e.target.value)}
            required
          />

          <Input
            label="Scheduled Date & Time *"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
          />

          <Select
            label="Initial Outcome"
            options={outcomeOptions}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#D4D4D8]">
              Prep Notes & Links
            </label>
            <textarea
              rows={3}
              placeholder="Key concepts, video link, interviewer names..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#27272A]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* AI Interview Prep Modal */}
      <AiInterviewPrepModal
        isOpen={isAiPrepModalOpen}
        onClose={() => setIsAiPrepModalOpen(false)}
        applicationId={applicationId}
        companyName={companyName}
        roleTitle={roleTitle}
      />
    </div>
  );
};
