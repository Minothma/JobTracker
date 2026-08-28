'use client';

import React, { useState } from 'react';
import { Interview } from '../../../../lib/types';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { Input, Select } from '../../../../components/ui/Input';
import { apiFetch } from '../../../../lib/api-client';
import { useToast } from '../../../../components/ui/Toast';
import { Video, Plus, Calendar, Trash2 } from 'lucide-react';

interface InterviewSectionProps {
  applicationId: string;
  interviews: Interview[];
  onInterviewsChange: (updated: Interview[]) => void;
}

export const InterviewSection: React.FC<InterviewSectionProps> = ({
  applicationId,
  interviews,
  onInterviewsChange,
}) => {
  const { showToast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
      showToast('Interview round scheduled!', 'success');
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Video className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Interview Rounds</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {interviews.length}
          </span>
        </div>

        <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Schedule Round
        </Button>
      </div>

      {interviews.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-400">
          No interview rounds scheduled yet. Click &quot;Schedule Round&quot; to add one.
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((round) => {
            const formattedDate = new Date(round.scheduled_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <div
                key={round.id}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {round.round_type}
                    </h3>
                    <Badge status={round.outcome || 'PENDING'} />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formattedDate}</span>
                  </div>

                  {round.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-white dark:bg-slate-900/60 p-2.5 rounded border border-slate-200/60 dark:border-slate-800 whitespace-pre-wrap">
                      {round.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-start">
                  <select
                    value={round.outcome || 'PENDING'}
                    onChange={(e) => handleOutcomeChange(round.id, e.target.value)}
                    className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    {outcomeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleDeleteRound(round.id)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded"
                    title="Delete round"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
        <form onSubmit={handleAddRound} className="space-y-4">
          <Input
            label="Round Type *"
            placeholder="e.g. Phone Screen, Coding Round 1, System Design"
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

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Prep Notes & Feedback
            </label>
            <textarea
              rows={3}
              placeholder="Key concepts to review, interview link, interviewer names..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
