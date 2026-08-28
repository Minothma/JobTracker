'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api-client';
import { Resume } from '../../lib/types';
import { ResumeCard } from './components/ResumeCard';
import { UploadResumeModal } from './components/UploadResumeModal';
import { Button } from '../../components/ui/Button';
import { Plus, RefreshCw, FileText } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

export default function ResumesPage() {
  const { showToast } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Resume[]>('/resumes');
      setResumes(data);
    } catch {
      showToast('Failed to load resumes. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleResumeUploaded = (newResume: Resume) => {
    setResumes((prev) => [newResume, ...prev]);
  };

  const handleResumeDeleted = (deletedId: string) => {
    setResumes((prev) => prev.filter((r) => r.id !== deletedId));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Resume Versions Vault
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Store and manage tailored PDF resume versions with AWS S3 direct upload
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchResumes}
            isLoading={loading}
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Button size="md" onClick={() => setIsUploadModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Upload Resume
          </Button>
        </div>
      </div>

      {/* Resumes Grid */}
      {loading && resumes.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="w-7 h-7 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading resumes...</p>
          </div>
        </div>
      ) : resumes.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/40">
          <div className="max-w-md mx-auto space-y-3">
            <div className="p-3.5 rounded-full bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 w-fit mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">No resumes uploaded yet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload different versions of your resume (e.g., Backend, Frontend, Fullstack) to attach them to specific applications.
            </p>
            <Button size="md" onClick={() => setIsUploadModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Upload Your First Resume
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onDeleted={handleResumeDeleted}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadResumeModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleResumeUploaded}
      />
    </div>
  );
}
