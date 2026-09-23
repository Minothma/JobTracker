'use client';

import React, { useMemo } from 'react';
import { AnalyticsOverview } from '../../../lib/types';
import {
  ShieldCheck,
  TrendingUp,
  Award,
  Zap,
  Printer,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface PipelineHealthScorecardProps {
  analytics: AnalyticsOverview;
}

export const PipelineHealthScorecard: React.FC<PipelineHealthScorecardProps> = ({ analytics }) => {
  const scorecard = useMemo(() => {
    let score = 50;

    // 1. Volume Score (Up to 25 pts)
    if (analytics.totalApplications >= 20) score += 25;
    else if (analytics.totalApplications >= 10) score += 18;
    else if (analytics.totalApplications >= 5) score += 10;
    else score += 5;

    // 2. Interview Rate Score (Up to 35 pts) - Benchmark is ~15-20%
    const interviewRate = analytics.appliedToInterviewRate || 0;
    if (interviewRate >= 25) score += 35;
    else if (interviewRate >= 15) score += 28;
    else if (interviewRate >= 8) score += 18;
    else if (interviewRate > 0) score += 10;

    // 3. Offer Rate Score (Up to 25 pts) - Benchmark is ~20-30%
    const offerRate = analytics.interviewToOfferRate || 0;
    if (offerRate >= 30) score += 25;
    else if (offerRate >= 15) score += 18;
    else if (analytics.statusCounts?.OFFER > 0) score += 12;

    // 4. Momentum & Velocity (Up to 15 pts)
    if (analytics.activeApplications >= 3) score += 15;
    else if (analytics.activeApplications >= 1) score += 8;

    score = Math.min(100, Math.max(20, score));

    let grade = 'B';
    let gradeColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    let summaryText = 'Healthy pipeline with active opportunities progressing through interview stages.';

    if (score >= 90) {
      grade = 'A+';
      gradeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      summaryText = 'Outstanding momentum! High conversion rate from applied to interview with strong closing velocity.';
    } else if (score >= 80) {
      grade = 'A';
      gradeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      summaryText = 'Strong pipeline health. Consistently passing resume screenings with strong candidate market fit.';
    } else if (score >= 70) {
      grade = 'B+';
      gradeColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      summaryText = 'Good foundational momentum. Focus on interview round closing and following up on pending applications.';
    } else if (score < 60) {
      grade = 'NEEDS PUSH';
      gradeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      summaryText = 'Pipeline needs replenishment. Increase weekly application volume and leverage AI ATS resume tailoring.';
    }

    // Dynamic recommendations
    const recommendations: string[] = [];

    if (interviewRate < 15) {
      recommendations.push(
        'Tailor your PDF resumes for each application using the AI ATS Matcher to boost keyword relevance and callback rates above 20%.',
      );
    } else {
      recommendations.push(
        `Strong resume pass rate (${interviewRate}%). Maintain this standard by aligning project bullets with domain requirements.`,
      );
    }

    if (analytics.totalInterviewsCount > 0 && offerRate < 25) {
      recommendations.push(
        'Practice STAR framework responses in the AI Mock Interview prep tool to turn screening calls into final-round offers.',
      );
    } else if (analytics.statusCounts?.OFFER > 0) {
      recommendations.push(
        'Use the AI Salary Negotiation Advisor to formulate diplomatic counter-offers and maximize total compensation.',
      );
    }

    if (analytics.activeApplications < 5) {
      recommendations.push(
        'Keep top-of-funnel momentum active by using the 1-Click Browser Job Clipper to clip 3-5 new roles weekly.',
      );
    }

    return {
      score,
      grade,
      gradeColor,
      summaryText,
      recommendations,
    };
  }, [analytics]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="p-5 rounded-lg bg-[#121214] border border-[#27272A] text-zinc-100 space-y-5 print:bg-white print:text-black print:border-none print:shadow-none">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#18181B] text-zinc-300 border border-[#27272A]">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-base font-semibold tracking-tight text-[#FAFAFA]">
              Pipeline Health Scorecard
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Real-time diagnostics measuring conversion efficiency, momentum velocity, and compensation potential
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handlePrintReport}
          className="text-xs font-mono self-start sm:self-center print:hidden flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5 mr-1" />
          <span>Export / Print</span>
        </Button>
      </div>

      {/* Grade & Score Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        {/* Overall Grade Card */}
        <div className="md:col-span-1 p-4 rounded-md bg-[#0A0A0B] border border-[#27272A] flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
            Health Grade
          </span>
          <div
            className={`text-2xl font-mono font-bold px-3.5 py-1 rounded border ${scorecard.gradeColor}`}
          >
            {scorecard.grade}
          </div>
          <span className="text-xs font-mono text-zinc-300">
            Score: {scorecard.score}/100
          </span>
        </div>

        {/* 3 Pillars Summary */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-md bg-[#0A0A0B] border border-[#27272A] space-y-1 font-mono">
            <span className="text-[11px] text-zinc-400">Applied ➔ Interview</span>
            <p className="text-lg font-semibold text-zinc-100">
              {analytics.appliedToInterviewRate}%
            </p>
            <p className="text-[10px] text-zinc-400">
              Benchmark: ~15-20%
            </p>
          </div>

          <div className="p-3.5 rounded-md bg-[#0A0A0B] border border-[#27272A] space-y-1 font-mono">
            <span className="text-[11px] text-zinc-400">Interview ➔ Offer</span>
            <p className="text-lg font-semibold text-emerald-400">
              {analytics.interviewToOfferRate}%
            </p>
            <p className="text-[10px] text-zinc-400">
              Benchmark: ~20-30%
            </p>
          </div>

          <div className="p-3.5 rounded-md bg-[#0A0A0B] border border-[#27272A] space-y-1 font-mono">
            <span className="text-[11px] text-zinc-400">Active Pipeline</span>
            <p className="text-lg font-semibold text-amber-400">
              {analytics.activeApplications} Active
            </p>
            <p className="text-[10px] text-zinc-400">
              {analytics.totalApplications} Total
            </p>
          </div>
        </div>
      </div>

      {/* Summary Narrative */}
      <div className="text-xs text-zinc-300 leading-relaxed bg-[#0A0A0B] p-3 rounded-md border border-[#27272A] flex items-start gap-2">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#FAFAFA] font-mono">Summary:</strong> {scorecard.summaryText}
        </p>
      </div>

      {/* Actionable Recommendations */}
      <div className="space-y-2">
        <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>Action Plan for Callback Rate Optimization</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {scorecard.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3 rounded-md bg-[#0A0A0B] border border-[#27272A] text-xs text-zinc-300 leading-relaxed flex items-start gap-2"
            >
              <span className="text-indigo-400 font-mono font-semibold text-xs mt-0.5">0{idx + 1}</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
