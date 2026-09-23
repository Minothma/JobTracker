'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api-client';
import { Application } from '../../../lib/types';
import { ApplicationHeader } from './components/ApplicationHeader';
import { StageJourneySection } from './components/StageJourneySection';
import { InterviewSection } from './components/InterviewSection';
import { TasksSection } from './components/TasksSection';
import { NotesSection } from './components/NotesSection';
import { AttachedResumeSection } from './components/AttachedResumeSection';
import { OfferPackageSection } from './components/OfferPackageSection';
import { ActivityTimelineSection } from './components/ActivityTimelineSection';
import { useToast } from '../../../components/ui/Toast';

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const applicationId = params?.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!applicationId) return;

    apiFetch<Application>(`/applications/${applicationId}`)
      .then((data) => {
        setApplication(data);
      })
      .catch(() => {
        showToast('Application not found or inaccessible', 'error');
        router.push('/board');
      })
      .finally(() => setLoading(false));
  }, [applicationId, router, showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <div className="w-7 h-7 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <ApplicationHeader
        application={application}
        onUpdate={(updated) => setApplication((prev) => (prev ? { ...prev, ...updated } : updated))}
      />

      {/* Stage Journey & Pipeline Velocity Card */}
      <StageJourneySection application={application} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Action Items, Interview rounds & Notes */}
        <div className="lg:col-span-2 space-y-6">
          <TasksSection
            applicationId={application.id}
            companyName={application.company_name}
            roleTitle={application.role_title}
          />

          <InterviewSection
            applicationId={application.id}
            companyName={application.company_name}
            roleTitle={application.role_title}
            interviews={application.interviews || []}
            onInterviewsChange={(updatedInterviews) =>
              setApplication((prev) => (prev ? { ...prev, interviews: updatedInterviews } : prev))
            }
          />

          <NotesSection
            applicationId={application.id}
            notes={application.notes || []}
            onNotesChange={(updatedNotes) =>
              setApplication((prev) => (prev ? { ...prev, notes: updatedNotes } : prev))
            }
          />
        </div>

        {/* Right Column (1/3): Attached Resume & Offer Package */}
        <div className="space-y-6">
          <OfferPackageSection application={application} />

          <AttachedResumeSection
            application={application}
            onUpdate={(updated) => setApplication((prev) => (prev ? { ...prev, ...updated } : updated))}
          />
        </div>
      </div>

      {/* Chronological Activity & Audit Timeline */}
      <ActivityTimelineSection application={application} />
    </div>
  );
}


