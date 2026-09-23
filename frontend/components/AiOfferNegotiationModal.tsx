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
  DollarSign,
  TrendingUp,
  PhoneCall,
  Mail,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
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
      // Auto-suggest +12% target
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
      showToast('Negotiation strategy and counter-offer drafts generated!', 'success');
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
      title={`AI Salary Negotiation Advisor: ${companyName}`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Formulate a tactful, data-driven counter-offer plan, phone script, and diplomatic email draft to maximize your total compensation.
        </p>

        {/* Input Form Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Base ({currency})
              </label>
              <input
                type="number"
                value={targetBase}
                onChange={(e) => setTargetBase(e.target.value)}
                placeholder="e.g. 120000"
                className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Bonus ({currency})
              </label>
              <input
                type="number"
                value={targetBonus}
                onChange={(e) => setTargetBonus(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Equity / Year ({currency})
              </label>
              <input
                type="number"
                value={targetEquity}
                onChange={(e) => setTargetEquity(e.target.value)}
                placeholder="e.g. 20000"
                className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Key Leverage Points / Competing Offers (Optional)
            </label>
            <textarea
              value={leveragePoints}
              onChange={(e) => setLeveragePoints(e.target.value)}
              placeholder="e.g. Have a competing offer at $130k; scored highest in system design interview; 5+ years specialized experience in PostgreSQL scaling..."
              rows={2}
              className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={isGenerating || !targetBase}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white font-semibold text-xs shadow-md"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Formulating Strategic Plan with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Counter-Offer Strategy & Email</span>
              </>
            )}
          </Button>
        </div>

        {/* Results Area */}
        {result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Target Breakdown & Risk Card */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Proposed Counter: +{result.recommended_counter.increase_percentage}% Increase
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total Compensation: {formatCurrency(result.recommended_counter.total_comp, currency as any)} / year
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    result.risk_level === 'LOW'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : result.risk_level === 'MEDIUM'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                >
                  Risk Level: {result.risk_level}
                </span>
                <span className="text-[11px] text-slate-400">
                  {result.generated_with}
                </span>
              </div>
            </div>

            {/* Strategic Summary */}
            <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 text-xs text-sky-900 dark:text-sky-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sky-700 dark:text-sky-400">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Negotiation Strategy & Leverage</span>
              </div>
              <p className="leading-relaxed">{result.strategy_summary}</p>
            </div>

            {/* Key Talking Points */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                Key Negotiation Talking Points
              </span>
              <ul className="space-y-1.5 text-xs">
                {result.talking_points.map((tp, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{tp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Verbal Phone Script */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verbal Phone Call Script</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(result.phone_script, 'phone', 'Copied phone script!')
                  }
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  {copiedKey === 'phone' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'phone' ? 'Copied' : 'Copy Script'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded border border-slate-200/60 dark:border-slate-700/60 leading-relaxed">
                {result.phone_script}
              </p>
            </div>

            {/* Formal Counter Email Draft */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Diplomatic Counter-Offer Email Draft</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(result.counter_email_draft, 'email', 'Copied counter-offer email!')
                  }
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 flex items-center gap-1 transition-colors shadow-sm"
                >
                  {copiedKey === 'email' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'email' ? 'Copied' : 'Copy Email'}</span>
                </button>
              </div>
              <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans bg-slate-50 dark:bg-slate-800/60 p-3 rounded border border-slate-200/60 dark:border-slate-700/60 leading-relaxed max-h-56 overflow-y-auto">
                {result.counter_email_draft}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
