'use client';

import React, { useState, useEffect } from 'react';
import { Application, OfferPackage, OfferCurrency, WorkMode } from '../../../../lib/types';
import {
  fetchApplicationOffer,
  saveOfferToApi,
  deleteOfferFromApi,
  formatCurrency,
  calculateTotalCompensation,
  OFFERS_CHANGED_EVENT,
} from '../../../../lib/offers';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { Input } from '../../../../components/ui/Input';
import { useToast } from '../../../../components/ui/Toast';
import {
  Award,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { AiOfferNegotiationModal } from '../../../../components/AiOfferNegotiationModal';

interface OfferPackageSectionProps {
  application: Application;
}

const CURRENCIES: { label: string; value: OfferCurrency }[] = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'LKR (Rs.)', value: 'LKR' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'CAD (CA$)', value: 'CAD' },
  { label: 'AUD (AU$)', value: 'AUD' },
  { label: 'SGD (SG$)', value: 'SGD' },
  { label: 'INR (₹)', value: 'INR' },
];

const WORK_MODES: { label: string; value: WorkMode }[] = [
  { label: 'Remote', value: 'REMOTE' },
  { label: 'Hybrid', value: 'HYBRID' },
  { label: 'On-site', value: 'ONSITE' },
];

export const OfferPackageSection: React.FC<OfferPackageSectionProps> = ({ application }) => {
  const { showToast } = useToast();
  const [offer, setOffer] = useState<OfferPackage | null>(application.offers || null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form inputs
  const [baseSalary, setBaseSalary] = useState<string>('');
  const [currency, setCurrency] = useState<OfferCurrency>('USD');
  const [bonus, setBonus] = useState<string>('');
  const [equity, setEquity] = useState<string>('');
  const [workMode, setWorkMode] = useState<WorkMode>('REMOTE');
  const [benefitsSummary, setBenefitsSummary] = useState<string>('');
  const [offerDeadline, setOfferDeadline] = useState<string>('');

  const populateForm = (data: OfferPackage | null) => {
    if (data) {
      setBaseSalary(String(data.base_salary || ''));
      setCurrency(data.currency || 'USD');
      setBonus(String(data.bonus || ''));
      setEquity(String(data.equity || ''));
      setWorkMode(data.work_mode || 'REMOTE');
      setBenefitsSummary(data.benefits_summary || '');
      setOfferDeadline(data.offer_deadline ? data.offer_deadline.split('T')[0] : '');
    } else {
      setBaseSalary('');
      setCurrency('USD');
      setBonus('');
      setEquity('');
      setWorkMode('REMOTE');
      setBenefitsSummary('');
      setOfferDeadline('');
    }
  };

  const loadOffer = async () => {
    const remoteOffer = await fetchApplicationOffer(application.id);
    if (remoteOffer) {
      setOffer(remoteOffer);
      populateForm(remoteOffer);
    }
  };

  useEffect(() => {
    if (application.offers) {
      setOffer(application.offers);
      populateForm(application.offers);
    } else {
      loadOffer();
    }

    const handleChanged = () => {
      loadOffer();
    };

    window.addEventListener(OFFERS_CHANGED_EVENT, handleChanged);
    return () => {
      window.removeEventListener(OFFERS_CHANGED_EVENT, handleChanged);
    };
  }, [application.id, application.offers]);

  const handleOpenModal = () => {
    populateForm(offer);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numBase = parseFloat(baseSalary) || 0;
    if (numBase <= 0) {
      showToast('Please enter a valid base salary', 'info');
      return;
    }

    try {
      setIsSaving(true);
      const savedOffer = await saveOfferToApi(application.id, {
        base_salary: numBase,
        currency,
        bonus: parseFloat(bonus) || 0,
        equity: parseFloat(equity) || 0,
        work_mode: workMode,
        benefits_summary: benefitsSummary.trim() || undefined,
        offer_deadline: offerDeadline || undefined,
      });

      setOffer(savedOffer);
      setIsModalOpen(false);
      showToast('Offer package saved to database! 🎉', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save offer package', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove this offer package?')) return;
    try {
      await deleteOfferFromApi(application.id);
      setOffer(null);
      populateForm(null);
      showToast('Offer package removed from database', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete offer package', 'error');
    }
  };

  const totalComp = offer ? calculateTotalCompensation(offer) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Award className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Compensation & Offer Package
          </h2>
        </div>

        {offer && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleOpenModal}
              className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Edit Offer Package"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Delete Offer Package"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {offer ? (
        <div className="space-y-4">
          {/* Total Compensation Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Total Annual Compensation
                </p>
                <p className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-0.5">
                  {formatCurrency(totalComp, offer.currency)}
                  <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400 ml-1">
                    / year
                  </span>
                </p>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{offer.work_mode}</span>
              </div>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Base Salary</p>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {formatCurrency(Number(offer.base_salary), offer.currency)}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Bonus</p>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {Number(offer.bonus) > 0 ? formatCurrency(Number(offer.bonus), offer.currency) : '—'}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Equity / RSU</p>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {Number(offer.equity) > 0 ? formatCurrency(Number(offer.equity), offer.currency) : '—'}
              </p>
            </div>
          </div>

          {/* Deadline and Benefits */}
          {(offer.offer_deadline || offer.benefits_summary) && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              {offer.offer_deadline && (
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Acceptance Deadline: {new Date(offer.offer_deadline).toLocaleDateString()}</span>
                </div>
              )}

              {offer.benefits_summary && (
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px] bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                  💡 <span className="font-semibold">Perks:</span> {offer.benefits_summary}
                </p>
              )}
            </div>
          )}

          {/* AI Counter-Strategy Trigger Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNegotiationModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs py-2 shadow-sm font-semibold"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>AI Counter-Offer Strategy & Script</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No offer package logged yet for this application.
          </p>
          <Button
            size="sm"
            onClick={handleOpenModal}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Log Offer Package
          </Button>
        </div>
      )}

      {/* Log / Edit Offer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={offer ? 'Edit Offer Package' : 'Log Job Offer Package'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Base Annual Salary *"
                type="number"
                min="0"
                step="1000"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="e.g. 120000"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as OfferCurrency)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-sky-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Annual / Sign-on Bonus (Optional)"
              type="number"
              min="0"
              step="500"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              placeholder="e.g. 15000"
            />

            <Input
              label="Annual Stock / Equity (Optional)"
              type="number"
              min="0"
              step="1000"
              value={equity}
              onChange={(e) => setEquity(e.target.value)}
              placeholder="e.g. 20000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Work Mode
              </label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-sky-500"
              >
                {WORK_MODES.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Acceptance Deadline (Optional)"
              type="date"
              value={offerDeadline}
              onChange={(e) => setOfferDeadline(e.target.value)}
            />
          </div>

          <Input
            label="Benefits, Insurance & Perks Summary (Optional)"
            value={benefitsSummary}
            onChange={(e) => setBenefitsSummary(e.target.value)}
            placeholder="e.g. 401(k) 5% match, Health & Dental, $2k home office stipend"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save Offer Package
            </Button>
          </div>
        </form>
      </Modal>

      {/* AI Salary Negotiation & Counter-Strategy Modal */}
      {offer && (
        <AiOfferNegotiationModal
          isOpen={isNegotiationModalOpen}
          onClose={() => setIsNegotiationModalOpen(false)}
          companyName={application.company_name}
          roleTitle={application.role_title}
          currentBase={Number(offer.base_salary)}
          currentBonus={Number(offer.bonus)}
          currentEquity={Number(offer.equity)}
          currency={offer.currency}
          workMode={offer.work_mode}
        />
      )}
    </div>
  );
};
