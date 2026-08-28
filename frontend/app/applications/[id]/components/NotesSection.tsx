'use client';

import React, { useState } from 'react';
import { Note } from '../../../../lib/types';
import { Button } from '../../../../components/ui/Button';
import { apiFetch } from '../../../../lib/api-client';
import { useToast } from '../../../../components/ui/Toast';
import { MessageSquare, Send, Trash2, Clock } from 'lucide-react';

interface NotesSectionProps {
  applicationId: string;
  notes: Note[];
  onNotesChange: (updated: Note[]) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  applicationId,
  notes,
  onNotesChange,
}) => {
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      const newNote = await apiFetch<Note>(`/applications/${applicationId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: content.trim() }),
      });

      onNotesChange([newNote, ...notes]);
      setContent('');
      showToast('Note added', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add note', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await apiFetch(`/notes/${noteId}`, { method: 'DELETE' });
      onNotesChange(notes.filter((n) => n.id !== noteId));
      showToast('Note deleted', 'success');
    } catch {
      showToast('Failed to delete note', 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
          <MessageSquare className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Notes & Updates</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          {notes.length}
        </span>
      </div>

      {/* Add note form */}
      <form onSubmit={handleAddNote} className="space-y-2">
        <textarea
          rows={2}
          placeholder="Add a note (e.g. follow-up email sent, recruiter details, technical questions asked)..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" isLoading={isSubmitting} disabled={!content.trim()}>
            <Send className="w-3.5 h-3.5 mr-1" />
            Add Note
          </Button>
        </div>
      </form>

      {/* Notes list */}
      <div className="space-y-3 pt-2">
        {notes.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-400">
            No notes added yet.
          </div>
        ) : (
          notes.map((note) => {
            const formattedTime = new Date(note.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <div
                key={note.id}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{formattedTime}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded"
                  title="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
