'use client';

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import {
  Bookmark,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Scissors,
  ArrowRight,
  MousePointerClick,
  Layers,
} from 'lucide-react';

interface JobClipperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JobClipperModal: React.FC<JobClipperModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [copiedScript, setCopiedScript] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const bookmarkletCode = `javascript:(function(){var u=window.location.href;var t=document.title;var s=window.getSelection?window.getSelection().toString():'';var target='${origin}/board?clip_url='+encodeURIComponent(u)+'&clip_title='+encodeURIComponent(t)+'&clip_desc='+encodeURIComponent(s);window.open(target,'_blank');})();`;

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedScript(true);
    showToast('Bookmarklet script copied to clipboard!', 'success');
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="✂️ 1-Click Browser Job Clipper Bookmarklet"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-violet-500/10 border border-sky-200 dark:border-sky-900/50 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-sky-600 text-white shadow-sm mt-0.5">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Clip Jobs from LinkedIn, Indeed, & Glassdoor in 1-Click
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              No browser extensions to install. Drag the bookmarklet below into your browser&apos;s Bookmarks bar to clip any job opening directly into your JobTracker board!
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            How to Set Up:
          </h4>

          <div className="space-y-2.5">
            {/* Step 1 */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div className="space-y-2 flex-1">
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Drag the button below directly to your browser&apos;s <strong>Bookmarks Bar</strong> (press <kbd className="px-1 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 font-mono text-[10px]">Ctrl+Shift+B</kbd> or <kbd className="px-1 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 font-mono text-[10px]">⌘+Shift+B</kbd> to show the bar):
                </p>

                {/* Draggable Bookmarklet Button */}
                <div className="pt-1 flex items-center gap-3">
                  <a
                    href={bookmarkletCode}
                    onClick={(e) => {
                      e.preventDefault();
                      showToast('Drag this button to your Bookmarks Bar instead of clicking it!', 'info');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-105"
                    title="Drag me to your Bookmarks toolbar!"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>📥 Clip to JobTracker</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyBookmarklet}
                    className="text-xs text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 flex items-center gap-1"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copied' : 'Copy JavaScript'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                  Browse any job posting
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Open LinkedIn, Indeed, Glassdoor, Greenhouse, or Lever job listings in your browser. (Optional: Highlight key requirements text with your mouse).
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                  Click &quot;📥 Clip to JobTracker&quot;
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  JobTracker automatically opens with the company name, role title, job URL, and highlighted description pre-filled in your &quot;Add Application&quot; modal!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} size="md">
            Got It!
          </Button>
        </div>
      </div>
    </Modal>
  );
};
