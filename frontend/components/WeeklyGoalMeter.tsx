'use client';

import React, { useState, useEffect } from 'react';
import { Application, WeeklyGoalProgress } from '../lib/types';
import {
  calculateWeeklyGoalProgress,
  setWeeklyGoalTarget,
  GOALS_UPDATED_EVENT,
} from '../lib/goals';
import { Target, Flame, Trophy, Sliders, CheckCircle2 } from 'lucide-react';
import { useToast } from './ui/Toast';

interface WeeklyGoalMeterProps {
  applications: Application[];
}

export const WeeklyGoalMeter: React.FC<WeeklyGoalMeterProps> = ({ applications }) => {
  const { showToast } = useToast();
  const [progress, setProgress] = useState<WeeklyGoalProgress>(() =>
    calculateWeeklyGoalProgress(applications),
  );
  const [isEditingTarget, setIsEditingTarget] = useState(false);

  useEffect(() => {
    setProgress(calculateWeeklyGoalProgress(applications));

    const handleUpdated = () => {
      setProgress(calculateWeeklyGoalProgress(applications));
    };

    window.addEventListener(GOALS_UPDATED_EVENT, handleUpdated);
    return () => window.removeEventListener(GOALS_UPDATED_EVENT, handleUpdated);
  }, [applications]);

  const handleTargetChange = (newTarget: number) => {
    setWeeklyGoalTarget(newTarget);
    setIsEditingTarget(false);
    showToast(`Weekly application goal set to ${newTarget} applications/week`, 'success');
  };

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-sky-950/80 to-indigo-950 border border-slate-800 text-white shadow-md relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        {/* Left: Target & Progress Info */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
              <Target className="w-4 h-4 text-sky-400" />
              <span>Weekly Target:</span>
            </div>

            {isEditingTarget ? (
              <div className="flex items-center gap-1">
                {[3, 5, 8, 10, 15].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleTargetChange(num)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                      progress.weeklyTarget === num
                        ? 'bg-sky-500 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-slate-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white">
                  {progress.appliedThisWeek} / {progress.weeklyTarget} Applications
                </span>
                <button
                  onClick={() => setIsEditingTarget(true)}
                  className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-white/10 transition-colors"
                  title="Change weekly target"
                >
                  <Sliders className="w-3 h-3" />
                </button>
              </div>
            )}

            {progress.isGoalAchieved ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>Goal Achieved! 🎉</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">
                ({progress.progressPercent}% completed)
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/60 max-w-xl">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress.isGoalAchieved
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                  : 'bg-gradient-to-r from-sky-400 to-indigo-500'
              }`}
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Active Streak Card */}
        <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
          <Flame className={`w-4 h-4 ${progress.activeStreakDays > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
          <div className="text-right">
            <span className="text-xs font-bold text-slate-100">
              {progress.activeStreakDays} Day{progress.activeStreakDays !== 1 ? 's' : ''}
            </span>
            <span className="text-[10px] text-slate-400 block -mt-0.5">
              Active Streak
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
