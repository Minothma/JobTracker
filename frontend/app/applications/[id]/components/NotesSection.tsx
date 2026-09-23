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
    <div className="bg-[#121214] border border-[#27272A] rounded-lg p-5 space-y-4 text-[#FAFAFA]">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-[#18181B] text-indigo-400 border border-[#27272A]">
          <MessageSquare className="w-4 h-4" />
        </div>
        <h2 className="text-sm font-semibold text-[#FAFAFA]">Notes & Updates</h2>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[#71717A]">
          {notes.length}
        </span>
      </div>

      {/* Add note form */}
      <form onSubmit={handleAddNote} className="space-y-2">
        <textarea
          rows={2}
          placeholder="Log updates, recruiter outreach, interview questions asked..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-md bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500 font-sans"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" isLoading={isSubmitting} disabled={!content.trim()}>
            <Send className="w-3 h-3 mr-1" />
            Add Note
          </Button>
        </div>
      </form>

      {/* Notes list */}
      <div className="space-y-2.5 pt-1">
        {notes.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-[#27272A] rounded-lg text-xs font-mono text-[#52525B]">
            No notes logged.
          </div>
        ) : (
          notes.map((note) => {
            const formattedTime = new Date(note.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <div
                key={note.id}
                className="p-3 rounded-md border border-[#27272A] bg-[#0E0E10] flex items-start justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <p className="text-xs text-[#FAFAFA] whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-[#71717A]">
                    <Clock className="w-3 h-3 text-[#52525B]" />
                    <span>{formattedTime}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-[#52525B] hover:text-rose-400 p-1 rounded transition-colors"
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
