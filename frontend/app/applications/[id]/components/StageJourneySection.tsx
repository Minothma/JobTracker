'use client';

import React, { useState } from 'react';
import { Application, AiEmailType } from '../../../../lib/types';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { AiEmailGeneratorModal } from '../../../../components/AiEmailGeneratorModal';
import { AiInterviewPrepModal } from '../../../../components/AiInterviewPrepModal';
import {
  Compass,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Mail,
  Brain,
  Award,
  ArrowRight,
} from 'lucide-react';

interface StageJourneySectionProps {
  application: Application;
}

export const StageJourneySection: React.FC<StageJourneySectionProps> = ({ application }) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPrepModalOpen, setIsPrepModalOpen] = useState(false);
  const [defaultEmailType, setDefaultEmailType] = useState<AiEmailType>('FOLLOW_UP');

  // Compute days since applied
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Application Lifecycle & Pipeline Velocity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Applied on {appliedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {daysWaiting} {daysWaiting === 1 ? 'day' : 'days'} active in pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge status={application.status} />
          {isStale && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Follow-up Recommended
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Contextual Action Card */}
      {application.status === 'APPLIED' && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isStale
              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
              : 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/50'
          }`}
        >
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              {isStale ? 'Awaiting Initial Response (>14 Days)' : 'Application Under Review'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isStale
                ? 'This application has been active for over 2 weeks without an interview update. Sending a courteous follow-up email significantly boosts recruiter engagement.'
                : 'Recruiters typically review candidates within 5–10 business days. You can prepare tailored cover notes or practice interview questions while waiting.'}
            </p>
          </div>

          <Button
            size="sm"
            onClick={openFollowUpEmail}
            className="shrink-0 bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
          >
            <Mail className="w-3.5 h-3.5 mr-1.5" />
            <span>Generate Follow-up Email</span>
          </Button>
        </div>
      )}

      {application.status === 'INTERVIEW' && (
        <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Active Interview Pipeline
            </h4>
            <p className="text-xs text-purple-800/90 dark:text-purple-300/90 leading-relaxed">
              You are currently interviewing with {application.company_name}. Practice realistic technical & STAR behavioral interview questions tailored specifically for this role.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setIsPrepModalOpen(true)}
            className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
          >
            <Brain className="w-3.5 h-3.5 mr-1.5" />
            <span>AI Mock Interview Prep</span>
          </Button>
        </div>
      )}

      {application.status === 'OFFER' && (
        <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Offer Received!
            </h4>
            <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
              Log your base salary, bonus, and equity in the Compensation Package section below, or draft a professional negotiation email with AI.
            </p>
          </div>

          <Button
            size="sm"
            onClick={openNegotiationEmail}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Mail className="w-3.5 h-3.5 mr-1.5" />
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
