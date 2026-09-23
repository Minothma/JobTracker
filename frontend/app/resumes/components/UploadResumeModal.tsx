'use client';

import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api-client';
import { Resume } from '../../../lib/types';
import { useToast } from '../../../components/ui/Toast';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

interface UploadResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newResume: Resume) => void;
}

export const UploadResumeModal: React.FC<UploadResumeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [versionLabel, setVersionLabel] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setError('Only PDF documents are supported.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      if (!versionLabel) {
        setVersionLabel(file.name.replace('.pdf', ''));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFile || !versionLabel.trim()) {
      setError('Please select a PDF file and provide a version label.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress('Requesting presigned upload URL from AWS S3...');

      // Step 1: Get presigned PUT URL
      const { resume_id, upload_url } = await apiFetch<{
        resume_id: string;
        upload_url: string;
        s3_key: string;
      }>('/resumes/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          filename: selectedFile.name,
          version_label: versionLabel.trim(),
        }),
      });

      // Step 2: Upload directly to S3 via presigned PUT URL (bypass if mock dev URL)
      setUploadProgress('Uploading file bytes directly to S3...');
      if (!upload_url.includes('mock-s3.local')) {
        const s3Response = await fetch(upload_url, {
          method: 'PUT',
          body: selectedFile,
          headers: {
            'Content-Type': 'application/pdf',
          },
        });

        if (!s3Response.ok) {
          throw new Error(`S3 direct upload failed with status ${s3Response.status}`);
        }
      }

      // Step 3: Confirm upload completed
      setUploadProgress('Confirming upload with backend...');
      const confirmedResume = await apiFetch<Resume>(`/resumes/${resume_id}/confirm`, {
        method: 'POST',
      });

      showToast(`Resume "${confirmedResume.version_label}" uploaded successfully!`, 'success');
      onSuccess(confirmedResume);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Resume upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleClose = () => {
    setVersionLabel('');
    setSelectedFile(null);
    setError(null);
    setUploadProgress(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload New Resume Version">
      {error && (
        <div className="mb-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        {/* File Drop / Select Area */}
        <div className="border border-dashed border-[#27272A] bg-[#0A0A0B] rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
          <input
            type="file"
            id="resume-file-input"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <label
            htmlFor="resume-file-input"
            className="flex flex-col items-center gap-2 cursor-pointer"
          >
            {selectedFile ? (
              <>
                <div className="p-2.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="font-medium text-zinc-100 text-xs font-mono">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change
                </p>
              </>
            ) : (
              <>
                <div className="p-2.5 rounded-md bg-[#18181B] text-zinc-300 border border-[#27272A]">
                  <UploadCloud className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="font-medium text-zinc-200 text-xs">
                  Click to select a PDF resume
                </p>
                <p className="text-[11px] text-zinc-400 font-mono">PDF up to 10MB</p>
              </>
            )}
          </label>
        </div>

        <Input
          label="Version Label *"
          placeholder="e.g. Backend-Focused v2, Fullstack 2026"
          value={versionLabel}
          onChange={(e) => setVersionLabel(e.target.value)}
          required
        />

        {uploadProgress && (
          <div className="p-2.5 rounded-md bg-[#0A0A0B] border border-[#27272A] text-zinc-300 text-xs font-mono flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>{uploadProgress}</span>
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#27272A]">
          <Button type="button" variant="secondary" size="sm" onClick={handleClose} className="text-xs font-mono">
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isUploading} disabled={!selectedFile} className="text-xs font-mono">
            Upload Resume
          </Button>
        </div>
      </form>
    </Modal>
  );
};
