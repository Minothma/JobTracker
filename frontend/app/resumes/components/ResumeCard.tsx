'use client';

import React, { useState } from 'react';
import { Resume } from '../../../lib/types';
import { Button } from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api-client';
import { useToast } from '../../../components/ui/Toast';
import { FileText, Download, Trash2, Calendar, Briefcase } from 'lucide-react';

interface ResumeCardProps {
  resume: Resume;
  onDeleted: (resumeId: string) => void;
}

export const ResumeCard: React.FC<ResumeCardProps> = ({ resume, onDeleted }) => {
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${resume.version_label}"?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiFetch(`/resumes/${resume.id}`, { method: 'DELETE' });
      showToast('Resume version deleted', 'success');
      onDeleted(resume.id);
    } catch {
      showToast('Failed to delete resume', 'error');
      setIsDeleting(false);
    }
  };

  const formattedDate = new Date(resume.uploaded_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-[#121214] border border-[#27272A] hover:border-[#3F3F46] rounded-lg p-4 transition-colors flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-md bg-[#18181B] text-zinc-300 border border-[#27272A] shrink-0">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-[#FAFAFA] text-sm truncate">
                {resume.version_label}
              </h3>
              <p className="text-xs text-zinc-400 font-mono truncate" title={resume.original_filename}>
                {resume.original_filename}
              </p>
            </div>
          </div>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-zinc-400 hover:text-rose-400 p-1 rounded hover:bg-[#18181B] transition-colors"
            title="Delete resume"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="pt-2.5 border-t border-[#27272A] flex items-center justify-between text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-zinc-400" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-300">
            <Briefcase className="w-3 h-3 text-zinc-400" />
            <span>
              {resume._count?.applications || 0}{' '}
              {resume._count?.applications === 1 ? 'app' : 'apps'}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2">
        {resume.download_url ? (
          <a
            href={resume.download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-mono font-medium rounded-md bg-[#18181B] hover:bg-[#27272A] text-zinc-200 border border-[#27272A] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Download PDF</span>
          </a>
        ) : (
          <span className="w-full inline-flex items-center justify-center py-1.5 px-3 text-xs font-mono text-zinc-400 bg-[#0A0A0B] border border-[#27272A] rounded-md">
            Download unavailable
          </span>
        )}
      </div>
    </div>
  );
};
