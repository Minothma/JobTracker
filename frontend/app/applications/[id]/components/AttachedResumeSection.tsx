'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Application, Resume } from '../../../../lib/types';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { Select } from '../../../../components/ui/Input';
import { apiFetch } from '../../../../lib/api-client';
import { useToast } from '../../../../components/ui/Toast';
import { AiResumeMatcherModal } from '../../../../components/AiResumeMatcherModal';
import { UploadResumeModal } from '../../../resumes/components/UploadResumeModal';
import { FileText, Download, Link2, ExternalLink, Sparkles, UploadCloud, Plus } from 'lucide-react';

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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState(application.resume_id || '');
  const [isSaving, setIsSaving] = useState(false);

  const fetchResumes = async () => {
    try {
      const data = await apiFetch<Resume[]>('/resumes');
      setResumes(data);
      return data;
    } catch {
      setResumes([]);
      return [];
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      setSelectedResumeId(application.resume_id || '');
      fetchResumes();
    }
  }, [isModalOpen, application.resume_id]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleUploadSuccess = async (newResume: Resume) => {
    await fetchResumes();
    setSelectedResumeId(newResume.id);
    setIsUploadModalOpen(false);

    // Auto-attach newly uploaded resume to this application
    try {
      const updated = await apiFetch<Application>(`/applications/${application.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          resume_id: newResume.id,
        }),
      });
      onUpdate(updated);
      showToast(`Attached "${newResume.version_label}" to this application!`, 'success');
      setIsModalOpen(false);
    } catch {
      showToast('Resume uploaded. Click Save Attachment to link it.', 'info');
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

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
            <Link2 className="w-3.5 h-3.5 mr-1" />
            {application.resumes ? 'Change' : 'Attach'}
          </Button>
          {!application.resumes && (
            <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
              <UploadCloud className="w-3.5 h-3.5 mr-1" />
              Upload PDF
            </Button>
          )}
        </div>
      </div>

      {application.resumes ? (
        <div className="space-y-3">
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>View</span>
                </a>
              )}
            </div>
          </div>

          {/* AI ATS Match Button */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-violet-500/10 hover:from-sky-500/20 hover:via-indigo-500/20 hover:to-violet-500/20 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-all shadow-2xs group"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span>Check AI ATS Match & Keyword Gaps</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="py-6 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
            <UploadCloud className="w-8 h-8 text-slate-400 mb-1" />
            <p className="font-medium text-slate-700 dark:text-slate-300">
              No resume version attached to this application.
            </p>
            <p className="text-xs text-slate-500">
              Upload your PDF resume to run AI ATS scoring and match keywords.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
                <UploadCloud className="w-3.5 h-3.5 mr-1" />
                Upload PDF Resume
              </Button>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
              >
                Or select existing
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Test AI Resume Matcher (Direct Text)</span>
          </button>
        </div>
      )}

      {/* Attach/Change Resume Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Attach Resume Version"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {resumes.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-center space-y-3">
              <UploadCloud className="w-8 h-8 mx-auto text-sky-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  No Resumes in your Vault Yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Upload your master or customized resume PDF to attach it to this job application.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={() => {
                  setIsModalOpen(false);
                  setIsUploadModalOpen(true);
                }}
              >
                <UploadCloud className="w-4 h-4 mr-1.5" />
                Upload PDF Resume Now
              </Button>
            </div>
          ) : (
            <>
              <Select
                label="Select Resume Version"
                options={resumeOptions}
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
              />

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsUploadModalOpen(true);
                  }}
                  className="text-sky-600 dark:text-sky-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Upload new version
                </button>
                <Link
                  href="/resumes"
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                  target="_blank"
                >
                  Manage Vault <ExternalLink className="inline w-3 h-3" />
                </Link>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            {resumes.length > 0 && (
              <Button type="submit" isLoading={isSaving}>
                Save Attachment
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {/* Direct Upload Modal */}
      <UploadResumeModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* AI Resume Matcher Modal */}
      <AiResumeMatcherModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        companyName={application.company_name}
        roleTitle={application.role_title}
        initialResumeId={application.resume_id}
        initialResumeName={application.resumes?.version_label}
      />
    </div>
  );
};
