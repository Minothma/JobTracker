'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Application, Resume } from '../../../../lib/types';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { Select } from '../../../../components/ui/Input';
import { apiFetch } from '../../../../lib/api-client';
import { useToast } from '../../../../components/ui/Toast';
import { FileText, Download, Link2, ExternalLink } from 'lucide-react';

interface AttachedResumeSectionProps {
  application: Application;
  onUpdate: (updated: Application) => void;
}

export const AttachedResumeSection: React.FC<AttachedResumeSectionProps> = ({
  application,
  onUpdate,
}) => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState(application.resume_id || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setSelectedResumeId(application.resume_id || '');
      apiFetch<Resume[]>('/resumes')
        .then((data) => setResumes(data))
        .catch(() => setResumes([]));
    }
  }, [isModalOpen, application.resume_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await apiFetch<Application>(`/applications/${application.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          resume_id: selectedResumeId || null,
        }),
      });

      onUpdate(updated);
      showToast('Attached resume updated', 'success');
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update resume attachment', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const resumeOptions = [
    { label: '-- No Resume Attached --', value: '' },
    ...resumes.map((r) => ({
      label: `${r.version_label} (${r.original_filename})`,
      value: r.id,
    })),
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Attached Resume</h2>
        </div>

        <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
          <Link2 className="w-3.5 h-3.5 mr-1" />
          {application.resumes ? 'Change Resume' : 'Attach Resume'}
        </Button>
      </div>

      {application.resumes ? (
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                {application.resumes.version_label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {application.resumes.original_filename}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {application.resumes.download_url && (
              <a
                href={application.resumes.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download / View</span>
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-400">
          No resume version attached to this application.{' '}
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sky-600 dark:text-sky-400 hover:underline font-medium"
          >
            Attach one now
          </button>
          {' or '}
          <Link href="/resumes" className="text-sky-600 dark:text-sky-400 hover:underline font-medium">
            manage your resumes
          </Link>
          .
        </div>
      )}

      {/* Attach/Change Resume Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Attach Resume Version"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Select
            label="Select Resume Version"
            options={resumeOptions}
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
          />

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Need to upload a new resume version? Go to the{' '}
            <Link href="/resumes" className="text-sky-600 dark:text-sky-400 underline" target="_blank">
              Resumes Vault <ExternalLink className="inline w-3 h-3" />
            </Link>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save Attachment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
