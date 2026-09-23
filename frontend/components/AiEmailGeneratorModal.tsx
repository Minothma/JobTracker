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
  User,
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
    desc: 'Check in on status 1-2 weeks post-submission',
  },
  {
    type: 'THANK_YOU',
    label: 'Post-Interview Thank You',
    desc: 'Express gratitude and highlight discussion topics',
  },
  {
    type: 'COLD_OUTREACH',
    label: 'Recruiter Outreach / Referral',
    desc: 'Brief networking message introducing skills',
  },
  {
    type: 'OFFER_NEGOTIATION',
    label: 'Offer Negotiation',
    desc: 'Diplomatic discussion on compensation alignment',
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
      showToast('Email draft generated', 'success');
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
      title="AI Email Assistant"
      maxWidth="lg"
    >
      <div className="space-y-4 text-[#FAFAFA]">
        {/* Email Type Selection */}
        <div>
          <label className="block text-xs font-medium text-[#D4D4D8] mb-1.5">
            Communication Goal
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EMAIL_TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => setSelectedType(t.type)}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  selectedType === t.type
                    ? 'border-indigo-500 bg-[#18181B] text-[#FAFAFA]'
                    : 'border-[#27272A] bg-[#0E0E10] text-[#A1A1AA] hover:bg-[#151518]'
                }`}
              >
                <p className="text-xs font-medium text-[#FAFAFA]">{t.label}</p>
                <p className="text-[11px] text-[#71717A] mt-0.5 line-clamp-1">
                  {t.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Recipient & Tone Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
              Recipient Name (Optional)
            </label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717A]" />
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#0A0A0B] border border-[#27272A] rounded-md text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
              Tone
            </label>
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value as AiEmailTone)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#0A0A0B] border border-[#27272A] rounded-md text-[#FAFAFA] focus:outline-none focus:border-indigo-500 font-mono"
            >
              {TONES.map((tone) => (
                <option key={tone.tone} value={tone.tone}>
                  {tone.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Extra Notes */}
        <div>
          <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
            Custom Talking Points (Optional)
          </label>
          <input
            type="text"
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            placeholder="e.g. Discussed our distributed indexing & Docker container workflows..."
            className="w-full px-2.5 py-1.5 text-xs bg-[#0A0A0B] border border-[#27272A] rounded-md text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          isLoading={loading}
          className="w-full text-xs py-2"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          {emailResult ? 'Regenerate Draft' : 'Generate Email Draft'}
        </Button>

        {/* Generated Email Result Display */}
        {emailResult && (
          <div className="space-y-3 pt-3 border-t border-[#27272A]">
            {/* Subject Line */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-[#71717A] mb-1">
                <span>subject:</span>
                <button
                  onClick={() => copyToClipboard(emailResult.subject, true)}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:underline"
                >
                  {copiedSubject ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSubject ? 'copied' : 'copy'}</span>
                </button>
              </div>
              <div className="p-2 rounded bg-[#0A0A0B] border border-[#27272A] text-xs font-medium text-[#FAFAFA]">
                {emailResult.subject}
              </div>
            </div>

            {/* Email Body */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-[#71717A] mb-1">
                <span>body:</span>
                <button
                  onClick={() => copyToClipboard(emailResult.body, false)}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:underline"
                >
                  {copiedBody ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBody ? 'copied' : 'copy body'}</span>
                </button>
              </div>
              <div className="p-3 rounded-md bg-[#0A0A0B] border border-[#27272A] text-xs text-[#FAFAFA] whitespace-pre-line leading-relaxed font-sans max-h-56 overflow-y-auto">
                {emailResult.body}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 font-mono text-xs">
              <span className="text-[10px] text-[#52525B]">
                engine: {emailResult.generated_with}
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`${emailResult.subject}\n\n${emailResult.body}`, false)}
                  className="text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy All
                </Button>

                <Button
                  size="sm"
                  onClick={handleOpenMailClient}
                  className="text-xs"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Open in Mail Client
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
