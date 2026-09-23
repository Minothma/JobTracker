'use client';

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import {
  Bookmark,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';

interface JobClipperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JobClipperModal: React.FC<JobClipperModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [copiedScript, setCopiedScript] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';

  const bookmarkletCode = `javascript:(function(){var u=window.location.href;var t=document.title;var s=window.getSelection?window.getSelection().toString():'';var target='${origin}/board?clip_url='+encodeURIComponent(u)+'&clip_title='+encodeURIComponent(t)+'&clip_desc='+encodeURIComponent(s);window.open(target,'_blank');})();`;

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedScript(true);
    showToast('Bookmarklet script copied to clipboard', 'success');
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Job Clipper Bookmarklet"
      maxWidth="lg"
    >
      <div className="space-y-4 text-[#FAFAFA]">
        {/* Banner */}
        <div className="p-3.5 rounded-lg bg-[#0E0E10] border border-[#27272A] flex items-start gap-3">
          <div className="p-2 rounded-md bg-[#18181B] border border-[#27272A] text-indigo-400 mt-0.5">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#FAFAFA]">
              1-Click Browser Clipper
            </h4>
            <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed">
              Drag the button below to your browser bookmarks bar to clip any job opening directly into your pipeline.
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-2.5 font-mono text-xs">
          {/* Step 1 */}
          <div className="p-3 rounded-lg bg-[#0E0E10] border border-[#27272A] flex items-start gap-3">
            <span className="w-5 h-5 rounded bg-[#18181B] border border-[#27272A] text-indigo-400 text-xs font-mono flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div className="space-y-2 flex-1">
              <p className="text-xs text-[#A1A1AA] font-sans">
                Drag the button below into your browser&apos;s Bookmarks bar (press <kbd className="px-1 py-0.5 bg-[#18181B] rounded border border-[#27272A] font-mono text-[10px]">Ctrl+Shift+B</kbd> to toggle bar):
              </p>

              {/* Draggable Bookmarklet Button */}
              <div className="pt-1 flex items-center gap-3">
                <a
                  href={bookmarkletCode}
                  onClick={(e) => {
                    e.preventDefault();
                    showToast('Drag this button to your Bookmarks Bar instead of clicking it', 'info');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs cursor-grab active:cursor-grabbing select-none transition-colors"
                  title="Drag me to your Bookmarks toolbar!"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>+ Clip to JobTracker</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyBookmarklet}
                  className="text-xs text-[#71717A] hover:text-[#FAFAFA] flex items-center gap-1 font-mono transition-colors"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'copied' : 'copy code'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3 rounded-lg bg-[#0E0E10] border border-[#27272A] flex items-start gap-3 font-sans">
            <span className="w-5 h-5 rounded bg-[#18181B] border border-[#27272A] text-indigo-400 text-xs font-mono flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="text-xs text-[#FAFAFA] font-medium">
                Browse any job posting
              </p>
              <p className="text-xs text-[#71717A] mt-0.5">
                Navigate to LinkedIn, Indeed, Greenhouse, or Lever job listings.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3 rounded-lg bg-[#0E0E10] border border-[#27272A] flex items-start gap-3 font-sans">
            <span className="w-5 h-5 rounded bg-[#18181B] border border-[#27272A] text-indigo-400 text-xs font-mono flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="text-xs text-[#FAFAFA] font-medium">
                Click bookmarklet
              </p>
              <p className="text-xs text-[#71717A] mt-0.5">
                JobTracker will open with the job URL, company name, and role title pre-filled.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} size="sm">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
