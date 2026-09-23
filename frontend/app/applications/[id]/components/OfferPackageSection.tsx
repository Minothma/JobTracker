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
      showToast('Offer package saved', 'success');
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
      showToast('Offer package removed', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete offer package', 'error');
    }
  };

  const totalComp = offer ? calculateTotalCompensation(offer) : 0;

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-lg p-5 space-y-4 text-[#FAFAFA]">
      <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#18181B] text-emerald-400 border border-[#27272A]">
            <Award className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-[#FAFAFA]">
            Compensation & Offer
          </h2>
        </div>

        {offer && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleOpenModal}
              className="p-1.5 text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B] rounded transition-colors"
              title="Edit Offer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-[#71717A] hover:text-rose-400 hover:bg-[#18181B] rounded transition-colors"
              title="Delete Offer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {offer ? (
        <div className="space-y-3.5">
          {/* Total Compensation Banner */}
          <div className="p-3.5 rounded-lg bg-[#0E0E10] border border-emerald-900/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                  Total Annual Compensation
                </p>
                <p className="text-2xl font-mono font-semibold text-[#FAFAFA] mt-0.5">
                  {formatCurrency(totalComp, offer.currency)}
                  <span className="text-xs font-normal text-[#71717A] ml-1">
                    / year
                  </span>
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[#A1A1AA] text-xs font-mono">
                {offer.work_mode.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2.5 rounded bg-[#0E0E10] border border-[#27272A]">
              <p className="text-[10px] text-[#71717A]">Base Salary</p>
              <p className="text-xs font-semibold text-[#FAFAFA] mt-0.5">
                {formatCurrency(Number(offer.base_salary), offer.currency)}
              </p>
            </div>

            <div className="p-2.5 rounded bg-[#0E0E10] border border-[#27272A]">
              <p className="text-[10px] text-[#71717A]">Bonus</p>
              <p className="text-xs font-semibold text-[#FAFAFA] mt-0.5">
                {Number(offer.bonus) > 0 ? formatCurrency(Number(offer.bonus), offer.currency) : '—'}
              </p>
            </div>

            <div className="p-2.5 rounded bg-[#0E0E10] border border-[#27272A]">
              <p className="text-[10px] text-[#71717A]">Equity / RSU</p>
              <p className="text-xs font-semibold text-[#FAFAFA] mt-0.5">
                {Number(offer.equity) > 0 ? formatCurrency(Number(offer.equity), offer.currency) : '—'}
              </p>
            </div>
          </div>

          {/* Deadline and Benefits */}
          {(offer.offer_deadline || offer.benefits_summary) && (
            <div className="space-y-1.5 pt-2 border-t border-[#27272A] text-xs font-mono text-[#71717A]">
              {offer.offer_deadline && (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>deadline: {offer.offer_deadline.split('T')[0]}</span>
                </div>
              )}

              {offer.benefits_summary && (
                <p className="text-[#A1A1AA] text-xs font-sans bg-[#0E0E10] p-2 rounded border border-[#27272A]">
                  <span className="font-semibold text-[#FAFAFA]">Perks:</span> {offer.benefits_summary}
                </p>
              )}
            </div>
          )}

          {/* AI Counter-Strategy Trigger Button */}
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNegotiationModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-mono"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Negotiation Strategy & Counter</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 space-y-2.5">
          <p className="text-xs text-[#71717A] font-mono">
            No offer package logged yet.
          </p>
          <Button
            size="sm"
            onClick={handleOpenModal}
            className="text-xs"
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
        <form onSubmit={handleSave} className="space-y-3.5">
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
              <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as OfferCurrency)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#0A0A0B] border border-[#27272A] rounded-md text-[#FAFAFA] focus:border-indigo-500 font-mono"
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
              label="Bonus (Optional)"
              type="number"
              min="0"
              step="500"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              placeholder="e.g. 15000"
            />

            <Input
              label="Equity / RSU (Optional)"
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
              <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
                Work Mode
              </label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#0A0A0B] border border-[#27272A] rounded-md text-[#FAFAFA] focus:border-indigo-500 font-mono"
              >
                {WORK_MODES.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Deadline (Optional)"
              type="date"
              value={offerDeadline}
              onChange={(e) => setOfferDeadline(e.target.value)}
            />
          </div>

          <Input
            label="Benefits & Perks (Optional)"
            value={benefitsSummary}
            onChange={(e) => setBenefitsSummary(e.target.value)}
            placeholder="e.g. 401(k) 5% match, Health & Dental, home office stipend"
          />

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#27272A]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSaving}
            >
              Save Offer
            </Button>
          </div>
        </form>
      </Modal>

      {/* AI Salary Negotiation Modal */}
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
