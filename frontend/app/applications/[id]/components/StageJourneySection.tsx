'use client';

import React, { useState } from 'react';
import { Application, AiEmailType } from '../../../../lib/types';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { AiEmailGeneratorModal } from '../../../../components/AiEmailGeneratorModal';
import { AiInterviewPrepModal } from '../../../../components/AiInterviewPrepModal';
import {
  Compass,
  AlertTriangle,
  Sparkles,
  Mail,
  Brain,
  Award,
} from 'lucide-react';

interface StageJourneySectionProps {
  application: Application;
}

export const StageJourneySection: React.FC<StageJourneySectionProps> = ({ application }) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPrepModalOpen, setIsPrepModalOpen] = useState(false);
  const [defaultEmailType, setDefaultEmailType] = useState<AiEmailType>('FOLLOW_UP');

  const appliedDate = new Date(application.applied_date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - appliedDate.getTime());
  const daysWaiting = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const isStale = application.status === 'APPLIED' && daysWaiting >= 14;

  const openFollowUpEmail = () => {
    setDefaultEmailType('FOLLOW_UP');
    setIsEmailModalOpen(true);
  };

  const openNegotiationEmail = () => {
    setDefaultEmailType('OFFER_NEGOTIATION');
    setIsEmailModalOpen(true);
  };

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-lg p-4 space-y-3.5 text-[#FAFAFA]">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[#18181B] text-indigo-400 border border-[#27272A]">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#FAFAFA]">
              Pipeline Velocity & Lifecycle
            </h3>
            <p className="text-[11px] font-mono text-[#71717A]">
              Applied {appliedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {daysWaiting}d active in pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <Badge status={application.status} />
          {isStale && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Follow-up recommended
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Contextual Action Card */}
      {application.status === 'APPLIED' && (
        <div
          className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isStale
              ? 'bg-[#15130D] border-amber-500/40'
              : 'bg-[#0E0E10] border-[#27272A]'
          }`}
        >
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold text-[#FAFAFA] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              {isStale ? 'Awaiting Response (>14 Days)' : 'Application Under Review'}
            </h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              {isStale
                ? 'This application has had no stage update for over 2 weeks. A polite follow-up email helps re-engage the recruiter.'
                : 'Recruiters typically review applications within 5–10 business days. Prepare tailored cover notes or practice interview questions.'}
            </p>
          </div>

          <Button
            size="sm"
            onClick={openFollowUpEmail}
            className="shrink-0 text-xs"
          >
            <Mail className="w-3 h-3 mr-1.5" />
            <span>Generate Follow-up</span>
          </Button>
        </div>
      )}

      {application.status === 'INTERVIEW' && (
        <div className="p-3.5 rounded-lg bg-[#0E0E10] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold text-[#FAFAFA] flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              Active Interview Pipeline
            </h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              You are currently interviewing with {application.company_name}. Practice STAR behavioral and technical questions tailored specifically for this role.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setIsPrepModalOpen(true)}
            className="shrink-0 text-xs"
          >
            <Brain className="w-3 h-3 mr-1.5" />
            <span>Mock Interview Prep</span>
          </Button>
        </div>
      )}

      {application.status === 'OFFER' && (
        <div className="p-3.5 rounded-lg bg-[#0E0E10] border border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Offer Received
            </h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Log compensation details in the offer section below or formulate a data-driven counter-offer script with AI.
            </p>
          </div>

          <Button
            size="sm"
            onClick={openNegotiationEmail}
            className="shrink-0 text-xs"
          >
            <Mail className="w-3 h-3 mr-1.5" />
            <span>Draft Negotiation Email</span>
          </Button>
        </div>
      )}

      {/* AI Modals */}
      <AiEmailGeneratorModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        companyName={application.company_name}
        roleTitle={application.role_title}
        initialType={defaultEmailType}
      />

      <AiInterviewPrepModal
        isOpen={isPrepModalOpen}
        onClose={() => setIsPrepModalOpen(false)}
        applicationId={application.id}
        companyName={application.company_name}
        roleTitle={application.role_title}
      />
    </div>
  );
};
