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
        <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        {/* File Drop / Select Area */}
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-sky-500 transition-colors">
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
                <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change
                </p>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  Click to select a PDF resume
                </p>
                <p className="text-xs text-slate-500">PDF up to 10MB</p>
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
          <div className="p-3 rounded-lg bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 text-xs flex items-center gap-2 animate-pulse">
            <FileText className="w-4 h-4" />
            <span>{uploadProgress}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isUploading} disabled={!selectedFile}>
            Upload Resume
          </Button>
        </div>
      </form>
    </Modal>
  );
};
