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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {resume.version_label}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={resume.original_filename}>
                {resume.original_filename}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1"
            title="Delete resume"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {resume._count?.applications || 0}{' '}
              {resume._count?.applications === 1 ? 'application' : 'applications'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3">
        {resume.download_url ? (
          <a
            href={resume.download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/80 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>
        ) : (
          <span className="w-full inline-flex items-center justify-center py-2 px-3 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg">
            Direct download unavailable in mock mode
          </span>
        )}
      </div>
    </div>
  );
};
