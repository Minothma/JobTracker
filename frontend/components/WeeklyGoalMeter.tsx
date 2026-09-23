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
    <div className="p-3.5 rounded-lg bg-[#121214] border border-[#27272A] text-[#FAFAFA]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Target & Progress Info */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#A1A1AA]">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>Weekly Target:</span>
            </div>

            {isEditingTarget ? (
              <div className="flex items-center gap-1 font-mono text-xs">
                {[3, 5, 8, 10, 15].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleTargetChange(num)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      progress.weeklyTarget === num
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#18181B] border border-[#27272A] hover:bg-[#27272A] text-[#A1A1AA]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="font-semibold text-[#FAFAFA]">
                  {progress.appliedThisWeek} / {progress.weeklyTarget}
                </span>
                <span className="text-[#71717A] text-[11px]">applications</span>
                <button
                  onClick={() => setIsEditingTarget(true)}
                  className="p-0.5 rounded text-[#71717A] hover:text-[#FAFAFA] transition-colors"
                  title="Change weekly target"
                >
                  <Sliders className="w-3 h-3" />
                </button>
              </div>
            )}

            {progress.isGoalAchieved ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                <Trophy className="w-3 h-3 text-emerald-400" />
                <span>Target Achieved</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-[#71717A]">
                ({progress.progressPercent}% achieved)
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#18181B] rounded-full h-1.5 overflow-hidden border border-[#27272A] max-w-xl">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress.isGoalAchieved ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Active Streak Card */}
        <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-md bg-[#18181B] border border-[#27272A]">
          <Flame className={`w-3.5 h-3.5 ${progress.activeStreakDays > 0 ? 'text-amber-400 fill-amber-400' : 'text-[#71717A]'}`} />
          <div className="text-right font-mono">
            <span className="text-xs font-semibold text-[#FAFAFA]">
              {progress.activeStreakDays}d
            </span>
            <span className="text-[10px] text-[#71717A] ml-1">
              streak
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
