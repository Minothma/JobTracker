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
      setResumes(data || []);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg bg-[#121214] border border-[#27272A] text-zinc-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#18181B] text-zinc-300 border border-[#27272A]">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[#FAFAFA]">
              Resume Versions Vault
            </h1>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Store and manage tailored PDF resume versions with AWS S3 direct upload
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchResumes}
            disabled={loading}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-[#18181B] border border-[#27272A] transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Button size="sm" onClick={() => setIsUploadModalOpen(true)} className="text-xs font-mono">
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Upload Resume</span>
          </Button>
        </div>
      </div>

      {/* Resumes Grid */}
      {loading && resumes.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Loading resumes...</p>
          </div>
        </div>
      ) : resumes.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#27272A] rounded-lg bg-[#121214]">
          <div className="max-w-md mx-auto space-y-3">
            <div className="p-3 rounded-md bg-[#18181B] text-zinc-300 border border-[#27272A] w-fit mx-auto">
              <FileText className="w-6 h-6 text-zinc-400" />
            </div>
            <h2 className="text-sm font-semibold text-[#FAFAFA]">No resumes uploaded yet</h2>
            <p className="text-xs text-zinc-400">
              Upload different versions of your resume (e.g., Backend, Frontend, Fullstack) to attach them to specific applications.
            </p>
            <Button size="sm" onClick={() => setIsUploadModalOpen(true)} className="text-xs font-mono">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Upload Your First Resume</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
