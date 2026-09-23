'use client';

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { apiFetch } from '../lib/api-client';
import { useToast } from './ui/Toast';
import { AiEmailResponse, AiEmailType, AiEmailTone } from '../lib/types';
import {
  Sparkles,
  Copy,
  Check,
  Mail,
  Send,
  User,
  Building,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface AiEmailGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  roleTitle: string;
  initialType?: AiEmailType;
  initialRecipientName?: string;
}

const EMAIL_TYPES: { type: AiEmailType; label: string; desc: string }[] = [
  {
    type: 'FOLLOW_UP',
    label: 'Application Follow-Up',
    desc: 'Check in on application status 1-2 weeks post-submission',
  },
  {
    type: 'THANK_YOU',
    label: 'Post-Interview Thank You',
    desc: 'Express gratitude & highlight key discussion topics',
  },
  {
    type: 'COLD_OUTREACH',
    label: 'Recruiter Outreach / Referral',
    desc: 'Networking message introducing skills & enthusiasm',
  },
  {
    type: 'OFFER_NEGOTIATION',
    label: 'Offer Negotiation',
    desc: 'Graciously discuss compensation alignment & perks',
  },
];

const TONES: { tone: AiEmailTone; label: string }[] = [
  { tone: 'PROFESSIONAL', label: 'Professional & Polished' },
  { tone: 'ENTHUSIASTIC', label: 'Warm & Enthusiastic' },
  { tone: 'CONCISE', label: 'Concise & Direct' },
];

export const AiEmailGeneratorModal: React.FC<AiEmailGeneratorModalProps> = ({
  isOpen,
  onClose,
  companyName,
  roleTitle,
  initialType,
  initialRecipientName,
}) => {
  const { showToast } = useToast();

  const [selectedType, setSelectedType] = useState<AiEmailType>(initialType || 'FOLLOW_UP');
  const [selectedTone, setSelectedTone] = useState<AiEmailTone>('PROFESSIONAL');
  const [recipientName, setRecipientName] = useState<string>('');
  const [extraNotes, setExtraNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [emailResult, setEmailResult] = useState<AiEmailResponse | null>(null);
  const [copiedSubject, setCopiedSubject] = useState<boolean>(false);
  const [copiedBody, setCopiedBody] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialType) {
        setSelectedType(initialType);
      }
      if (initialRecipientName) {
        setRecipientName(initialRecipientName);
      } else {
        setRecipientName('');
      }
    }
  }, [isOpen, initialType, initialRecipientName]);


  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<AiEmailResponse>('/ai/generate-email', {
        method: 'POST',
        body: JSON.stringify({
          type: selectedType,
          company_name: companyName,
          role_title: roleTitle,
          recipient_name: recipientName.trim() || undefined,
          tone: selectedTone,
          extra_notes: extraNotes.trim() || undefined,
        }),
      });

      setEmailResult(res);
      showToast('Email draft generated with AI!', 'success');
    } catch {
      showToast('Failed to generate email. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, isSubject: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isSubject) {
        setCopiedSubject(true);
        setTimeout(() => setCopiedSubject(false), 2000);
      } else {
        setCopiedBody(true);
        setTimeout(() => setCopiedBody(false), 2000);
      }
      showToast(isSubject ? 'Subject copied to clipboard' : 'Email body copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy text', 'error');
    }
  };

  const handleOpenMailClient = () => {
    if (!emailResult) return;
    const subject = encodeURIComponent(emailResult.subject);
    const body = encodeURIComponent(emailResult.body);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Email & Outreach Assistant"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Header Info Banner */}
        <div className="flex items-center gap-3 p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-lg text-xs text-sky-800 dark:text-sky-300">
          <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
          <div>
            <p className="font-semibold">
              Tailoring communication for <span className="font-bold">{roleTitle}</span> at{' '}
              <span className="font-bold">{companyName}</span>
            </p>
            <p className="text-[11px] opacity-80 mt-0.5">
              Powered by Google Gemini AI & Career Outreach Taxonomy.
            </p>
          </div>
        </div>

        {/* Email Type Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Select Communication Goal
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EMAIL_TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => setSelectedType(t.type)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  selectedType === t.type
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 ring-1 ring-sky-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.label}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {t.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Recipient & Tone Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Recipient Name / Title (Optional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Sarah Jenkins (Hiring Manager)"
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Desired Tone
            </label>
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value as AiEmailTone)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-sky-500"
            >
              {TONES.map((tone) => (
                <option key={tone.tone} value={tone.tone}>
                  {tone.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Extra Notes / Talking Points */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Custom Talking Points / Discussion Highlights (Optional)
          </label>
          <input
            type="text"
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            placeholder="e.g. Discussed our cloud architecture migration, ECS, and Flyway migration strategies"
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          isLoading={loading}
          className="w-full bg-linear-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white shadow-sm"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {emailResult ? 'Regenerate Draft' : 'Generate AI Email Draft'}
        </Button>

        {/* Generated Email Result Display */}
        {emailResult && (
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            {/* Subject Line */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                <span>Subject Line:</span>
                <button
                  onClick={() => copyToClipboard(emailResult.subject, true)}
                  className="flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 dark:text-sky-400 font-medium"
                >
                  {copiedSubject ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSubject ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100">
                {emailResult.subject}
              </div>
            </div>

            {/* Email Body */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                <span>Email Content:</span>
                <button
                  onClick={() => copyToClipboard(emailResult.body, false)}
                  className="flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 dark:text-sky-400 font-medium"
                >
                  {copiedBody ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBody ? 'Copied' : 'Copy Body'}</span>
                </button>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans max-h-64 overflow-y-auto">
                {emailResult.body}
              </div>
            </div>

            {/* Action Buttons & Source */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
              <span className="text-[11px] text-slate-400">
                Generated with: {emailResult.generated_with}
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`${emailResult.subject}\n\n${emailResult.body}`, false)}
                  className="text-xs w-full sm:w-auto"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy All
                </Button>

                <Button
                  size="sm"
                  onClick={handleOpenMailClient}
                  className="text-xs bg-sky-600 hover:bg-sky-700 text-white w-full sm:w-auto"
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  Open in Email Client
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
