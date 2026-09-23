'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { apiFetch } from '../lib/api-client';
import { AiNegotiateOfferRequest, AiNegotiateOfferResponse } from '../lib/types';
import { formatCurrency } from '../lib/offers';
import {
  Sparkles,
  TrendingUp,
  PhoneCall,
  Mail,
  Copy,
  Check,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';

interface AiOfferNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  roleTitle: string;
  currentBase?: number;
  currentBonus?: number;
  currentEquity?: number;
  currency?: string;
  workMode?: string;
}

export const AiOfferNegotiationModal: React.FC<AiOfferNegotiationModalProps> = ({
  isOpen,
  onClose,
  companyName,
  roleTitle,
  currentBase = 100000,
  currentBonus = 0,
  currentEquity = 0,
  currency = 'USD',
  workMode = 'REMOTE',
}) => {
  const { showToast } = useToast();

  const [targetBase, setTargetBase] = useState<string>('');
  const [targetBonus, setTargetBonus] = useState<string>('');
  const [targetEquity, setTargetEquity] = useState<string>('');
  const [leveragePoints, setLeveragePoints] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [result, setResult] = useState<AiNegotiateOfferResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const suggestedBase = Math.round(Number(currentBase || 0) * 1.12);
      setTargetBase(String(suggestedBase || ''));
      setTargetBonus(String(currentBonus || ''));
      setTargetEquity(String(currentEquity || ''));
      setResult(null);
    }
  }, [isOpen, currentBase, currentBonus, currentEquity]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const payload: AiNegotiateOfferRequest = {
        company_name: companyName,
        role_title: roleTitle,
        current_base: Number(currentBase) || 0,
        current_bonus: Number(currentBonus) || 0,
        current_equity: Number(currentEquity) || 0,
        target_base: targetBase ? Number(targetBase) : undefined,
        target_bonus: targetBonus ? Number(targetBonus) : undefined,
        target_equity: targetEquity ? Number(targetEquity) : undefined,
        currency,
        work_mode: workMode,
        leverage_points: leveragePoints.trim() || undefined,
      };

      const res = await apiFetch<AiNegotiateOfferResponse>('/ai/negotiate-offer', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setResult(res);
      showToast('Negotiation strategy and counter drafts generated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate negotiation strategy', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (text: string, key: string, message: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(message, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Salary Negotiation: ${companyName}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-[#FAFAFA]">
        {/* Input Form Box */}
        <div className="p-3.5 rounded-lg bg-[#0E0E10] border border-[#27272A] space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div>
              <label className="block text-xs font-medium text-[#D4D4D8] mb-1 font-sans">
                Target Base ({currency})
              </label>
              <input
                type="number"
                value={targetBase}
                onChange={(e) => setTargetBase(e.target.value)}
                placeholder="e.g. 120000"
                className="w-full text-xs px-2.5 py-1.5 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] focus:outline-none focus:border-indigo-500 font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#D4D4D8] mb-1 font-sans">
                Target Bonus ({currency})
              </label>
              <input
                type="number"
                value={targetBonus}
                onChange={(e) => setTargetBonus(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full text-xs px-2.5 py-1.5 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#D4D4D8] mb-1 font-sans">
                Target Equity ({currency})
              </label>
              <input
                type="number"
                value={targetEquity}
                onChange={(e) => setTargetEquity(e.target.value)}
                placeholder="e.g. 20000"
                className="w-full text-xs px-2.5 py-1.5 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
              Leverage Points / Competing Offers (Optional)
            </label>
            <textarea
              value={leveragePoints}
              onChange={(e) => setLeveragePoints(e.target.value)}
              placeholder="e.g. Competing offer at $130k; top performance in technical rounds; deep expertise in PostgreSQL scaling..."
              rows={2}
              className="w-full text-xs px-2.5 py-1.5 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !targetBase}
            className="w-full text-xs py-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                <span>Formulating Negotiation Strategy...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                <span>Generate Strategy & Scripts</span>
              </>
            )}
          </Button>
        </div>

        {/* Results Area */}
        {result && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Target Breakdown & Risk Card */}
            <div className="p-3 rounded-lg bg-[#0E0E10] border border-[#27272A] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-[#FAFAFA]">
                    Proposed Counter: +{result.recommended_counter.increase_percentage}% increase
                  </span>
                </div>
                <p className="text-xs font-mono text-[#71717A] mt-0.5">
                  Total Compensation: {formatCurrency(result.recommended_counter.total_comp, currency as any)} / year
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded border ${
                    result.risk_level === 'LOW'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                      : result.risk_level === 'MEDIUM'
                      ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                      : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                  }`}
                >
                  risk: {result.risk_level.toLowerCase()}
                </span>
              </div>
            </div>

            {/* Strategic Summary */}
            <div className="p-3 rounded-lg bg-[#0E0E10] border border-[#27272A] text-xs space-y-1">
              <div className="flex items-center gap-1 text-indigo-400 font-mono text-[11px]">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Strategy Summary</span>
              </div>
              <p className="text-[#A1A1AA] leading-relaxed">{result.strategy_summary}</p>
            </div>

            {/* Key Talking Points */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-[#71717A] block">
                talking points:
              </span>
              <ul className="space-y-1 text-xs font-mono">
                {result.talking_points.map((tp, idx) => (
                  <li
                    key={idx}
                    className="p-2 rounded bg-[#0E0E10] border border-[#27272A] text-[#A1A1AA] flex items-start gap-2"
                  >
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{tp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Verbal Phone Script */}
            <div className="p-3 rounded-lg bg-[#0E0E10] border border-[#27272A] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FAFAFA]">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Phone Script</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(result.phone_script, 'phone', 'Copied phone script')
                  }
                  className="text-xs font-mono text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {copiedKey === 'phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'phone' ? 'copied' : 'copy'}</span>
                </button>
              </div>
              <p className="text-xs text-[#A1A1AA] italic bg-[#0A0A0B] p-2 rounded border border-[#27272A] leading-relaxed font-mono">
                {result.phone_script}
              </p>
            </div>

            {/* Formal Counter Email Draft */}
            <div className="p-3 rounded-lg bg-[#0E0E10] border border-[#27272A] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FAFAFA]">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Counter Email Draft</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(result.counter_email_draft, 'email', 'Copied counter-offer email')
                  }
                  className="px-2 py-0.5 rounded text-xs font-mono bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-1 transition-colors"
                >
                  {copiedKey === 'email' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'email' ? 'copied' : 'copy email'}</span>
                </button>
              </div>
              <div className="text-xs text-[#FAFAFA] whitespace-pre-wrap font-sans bg-[#0A0A0B] p-2.5 rounded border border-[#27272A] leading-relaxed max-h-52 overflow-y-auto">
                {result.counter_email_draft}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
