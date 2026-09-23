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
    let gradeColor = 'text-sky-500 bg-sky-50 dark:bg-sky-950 border-sky-300 dark:border-sky-800';
    let summaryText = 'Healthy pipeline with active opportunities progressing through interview stages.';

    if (score >= 90) {
      grade = 'A+';
      gradeColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800';
      summaryText = 'Outstanding momentum! High conversion rate from applied to interview with strong closing velocity.';
    } else if (score >= 80) {
      grade = 'A';
      gradeColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800';
      summaryText = 'Strong pipeline health. Consistently passing resume screenings with strong candidate market fit.';
    } else if (score >= 70) {
      grade = 'B+';
      gradeColor = 'text-sky-600 bg-sky-50 dark:bg-sky-950 border-sky-300 dark:border-sky-800';
      summaryText = 'Good foundational momentum. Focus on interview round closing and following up on pending applications.';
    } else if (score < 60) {
      grade = 'Needs Push';
      gradeColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800';
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
    <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 border border-slate-800 text-white shadow-xl space-y-6 print:bg-white print:text-black print:border-none print:shadow-none">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Executive Pipeline Health Scorecard
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            Real-time diagnostics measuring conversion efficiency, momentum velocity, and compensation potential
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handlePrintReport}
          className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-xs self-start sm:self-center print:hidden flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Export / Print Summary</span>
        </Button>
      </div>

      {/* Grade & Score Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Grade Card */}
        <div className="md:col-span-1 p-5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Overall Health Grade
          </span>
          <div
            className={`text-3xl font-extrabold px-4 py-2 rounded-2xl border ${scorecard.gradeColor}`}
          >
            {scorecard.grade}
          </div>
          <span className="text-xs text-sky-300 font-bold">
            Health Score: {scorecard.score}/100
          </span>
        </div>

        {/* 3 Pillars Summary */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Applied ➔ Interview</span>
            <p className="text-xl font-bold text-sky-300">
              {analytics.appliedToInterviewRate}%
            </p>
            <p className="text-[10px] text-slate-400">
              Industry Benchmark: ~15-20%
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Interview ➔ Offer</span>
            <p className="text-xl font-bold text-emerald-300">
              {analytics.interviewToOfferRate}%
            </p>
            <p className="text-[10px] text-slate-400">
              Industry Benchmark: ~20-30%
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Active Pipeline</span>
            <p className="text-xl font-bold text-amber-300">
              {analytics.activeApplications} Active
            </p>
            <p className="text-[10px] text-slate-400">
              Across {analytics.totalApplications} total applications
            </p>
          </div>
        </div>
      </div>

      {/* Summary Narrative */}
      <p className="text-xs text-slate-200 leading-relaxed bg-white/5 p-3.5 rounded-xl border border-white/10">
        💡 <strong>Executive Summary:</strong> {scorecard.summaryText}
      </p>

      {/* Actionable Recommendations */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-sky-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Diagnostic Action Plan for Maximum Callback Rates</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {scorecard.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 leading-relaxed flex items-start gap-2"
            >
              <span className="text-emerald-400 font-bold mt-0.5">#{idx + 1}</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
