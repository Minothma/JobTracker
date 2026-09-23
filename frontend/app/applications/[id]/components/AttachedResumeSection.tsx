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

    try {
      const updated = await apiFetch<Application>(`/applications/${application.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          resume_id: newResume.id,
        }),
      });
      onUpdate(updated);
      showToast(`Attached "${newResume.version_label}" to application`, 'success');
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
    <div className="bg-[#121214] border border-[#27272A] rounded-lg p-5 space-y-4 text-[#FAFAFA]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#18181B] text-indigo-400 border border-[#27272A]">
            <FileText className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-[#FAFAFA]">Attached Resume</h2>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
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
          <div className="p-3 rounded-md border border-[#27272A] bg-[#0E0E10] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-[#18181B] text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-xs text-[#FAFAFA]">
                  {application.resumes.version_label}
                </p>
                <p className="text-[11px] font-mono text-[#71717A]">
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
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono rounded bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#27272A] transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>view</span>
                </a>
              )}
            </div>
          </div>

          {/* AI ATS Match Button */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-md border border-[#27272A] bg-[#0E0E10] hover:bg-[#18181B] text-indigo-400 font-mono text-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Check AI ATS Match & Keyword Gaps</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="py-5 px-4 text-center border border-dashed border-[#27272A] rounded-lg text-xs font-mono text-[#52525B] flex flex-col items-center justify-center gap-1.5">
            <UploadCloud className="w-6 h-6 text-[#52525B] mb-0.5" />
            <p className="font-medium text-[#A1A1AA]">
              No resume attached.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
                <UploadCloud className="w-3 h-3 mr-1" />
                Upload PDF
              </Button>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-indigo-400 hover:underline font-mono"
              >
                select existing
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 p-2 rounded-md border border-[#27272A] hover:bg-[#18181B] text-[#A1A1AA] font-mono text-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
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
        <form onSubmit={handleSave} className="space-y-3.5">
          {resumes.length === 0 ? (
            <div className="p-4 rounded-lg border border-dashed border-[#27272A] bg-[#0E0E10] text-center space-y-2.5">
              <UploadCloud className="w-6 h-6 mx-auto text-indigo-400" />
              <div>
                <p className="text-xs font-semibold text-[#FAFAFA]">
                  No Resumes in Vault
                </p>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Upload your PDF resume to attach it to this job application.
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
                <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                Upload PDF Resume
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

              <div className="flex items-center justify-between text-xs font-mono text-[#71717A] pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsUploadModalOpen(true);
                  }}
                  className="text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> upload new version
                </button>
                <Link
                  href="/resumes"
                  className="text-[#71717A] hover:text-[#FAFAFA] underline"
                  target="_blank"
                >
                  manage vault <ExternalLink className="inline w-3 h-3" />
                </Link>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#27272A]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            {resumes.length > 0 && (
              <Button type="submit" size="sm" isLoading={isSaving}>
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
