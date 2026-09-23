'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  fetchUserOffers,
  calculateTotalCompensation,
  formatCurrency,
  convertCurrency,
  OFFERS_CHANGED_EVENT,
} from '../../../lib/offers';

import { OfferPackage } from '../../../lib/types';
import {
  Award,
  Trophy,
  Building2,
  Sparkles,
  ArrowRight,
  Globe,
} from 'lucide-react';

const NORMALIZED_CURRENCIES = [
  { label: 'Original Currencies', value: 'ORIGINAL' },
  { label: 'Normalized in USD ($)', value: 'USD' },
  { label: 'Normalized in EUR (€)', value: 'EUR' },
  { label: 'Normalized in GBP (£)', value: 'GBP' },
  { label: 'Normalized in LKR (Rs.)', value: 'LKR' },
  { label: 'Normalized in CAD (CA$)', value: 'CAD' },
  { label: 'Normalized in AUD (AU$)', value: 'AUD' },
];

export const OfferComparisonMatrix: React.FC = () => {
  const [offers, setOffers] = useState<OfferPackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [normalizedCurrency, setNormalizedCurrency] = useState<string>('ORIGINAL');

  const loadOffers = async () => {
    try {
      setLoading(true);
      const data = await fetchUserOffers();
      setOffers(data || []);
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();

    const handleChanged = () => {
      loadOffers();
    };

    window.addEventListener(OFFERS_CHANGED_EVENT, handleChanged);
    return () => {
      window.removeEventListener(OFFERS_CHANGED_EVENT, handleChanged);
    };
  }, []);

  const offersList = useMemo(() => {
    return [...offers].sort((a, b) => {
      const aTc = calculateTotalCompensation(a);
      const bTc = calculateTotalCompensation(b);

      const aNorm = normalizedCurrency === 'ORIGINAL'
        ? convertCurrency(aTc, a.currency, 'USD')
        : convertCurrency(aTc, a.currency, normalizedCurrency);

      const bNorm = normalizedCurrency === 'ORIGINAL'
        ? convertCurrency(bTc, b.currency, 'USD')
        : convertCurrency(bTc, b.currency, normalizedCurrency);

      return bNorm - aNorm;
    });
  }, [offers, normalizedCurrency]);

  if (loading && offersList.length === 0) {
    return (
      <div className="bg-[#121214] border border-[#27272A] rounded-lg p-6 text-center py-12 text-zinc-400">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-mono">Loading offer packages...</p>
      </div>
    );
  }

  if (offersList.length === 0) {
    return (
      <div className="bg-[#121214] border border-[#27272A] rounded-lg p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-md bg-[#18181B] text-zinc-300 mx-auto flex items-center justify-center border border-[#27272A]">
          <Award className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-[#FAFAFA]">
          Offer & Compensation Comparison Matrix
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Log compensation packages (Base, Bonus, Equity, Work Mode) on your job applications to compare multiple offers side-by-side.
        </p>
        <div>
          <Link
            href="/board"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-400 hover:underline"
          >
            <span>Go to Applications Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const topOffer = offersList[0];
  const rawTopTc = calculateTotalCompensation(topOffer);
  const normalizedTopTc = normalizedCurrency === 'ORIGINAL'
    ? rawTopTc
    : convertCurrency(rawTopTc, topOffer.currency, normalizedCurrency);

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-lg p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#27272A]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[#18181B] text-zinc-300 border border-[#27272A]">
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#FAFAFA] flex items-center gap-2">
              <span>Offer & Compensation Matrix</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#18181B] text-zinc-300 border border-[#27272A]">
                {offersList.length} {offersList.length === 1 ? 'Offer' : 'Offers'} Logged
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Side-by-side total compensation (TC), bonus, equity, and perk comparison
            </p>
          </div>
        </div>

        {/* Currency Converter & Top Offer Highlight Badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Currency Normalizer Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#0A0A0B] px-2.5 py-1.5 rounded-md border border-[#27272A] text-xs font-mono">
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400">Currency:</span>
            <select
              value={normalizedCurrency}
              onChange={(e) => setNormalizedCurrency(e.target.value)}
              className="bg-transparent font-medium text-zinc-200 focus:outline-none cursor-pointer"
            >
              {NORMALIZED_CURRENCIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#121214] text-zinc-200">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {topOffer && (
            <div className="px-3 py-1.5 rounded-md bg-[#0A0A0B] border border-[#27272A] flex items-center gap-2 font-mono text-xs">
              <span className="text-zinc-400">Top Offer: </span>
              <span className="font-semibold text-zinc-200">
                {topOffer.applications?.company_name || 'Offer'}
              </span>
              <span className="font-semibold text-emerald-400">
                ({formatCurrency(
                  normalizedCurrency === 'ORIGINAL' ? rawTopTc : normalizedTopTc,
                  normalizedCurrency === 'ORIGINAL' ? topOffer.currency : normalizedCurrency
                )} TC)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0A0A0B] border-b border-[#27272A] text-zinc-400 text-xs font-mono uppercase tracking-wider">
              <th className="py-2.5 px-3.5">Company & Role</th>
              <th className="py-2.5 px-3.5 text-right">Total Annual Comp</th>
              <th className="py-2.5 px-3.5 text-right">Base Salary</th>
              <th className="py-2.5 px-3.5 text-right">Bonus</th>
              <th className="py-2.5 px-3.5 text-right">Equity / RSU</th>
              <th className="py-2.5 px-3.5 text-center">Work Mode</th>
              <th className="py-2.5 px-3.5">Perks & Details</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#27272A] text-xs">
            {offersList.map((item, idx) => {
              const rawTc = calculateTotalCompensation(item);
              const isTop = idx === 0;

              const isNormalized = normalizedCurrency !== 'ORIGINAL' && normalizedCurrency !== item.currency;
              const displayCurrency = normalizedCurrency === 'ORIGINAL' ? item.currency : normalizedCurrency;

              const displayTc = isNormalized
                ? convertCurrency(rawTc, item.currency, normalizedCurrency)
                : rawTc;

              const displayBase = isNormalized
                ? convertCurrency(Number(item.base_salary), item.currency, normalizedCurrency)
                : Number(item.base_salary);

              const displayBonus = isNormalized && Number(item.bonus) > 0
                ? convertCurrency(Number(item.bonus), item.currency, normalizedCurrency)
                : Number(item.bonus);

              const displayEquity = isNormalized && Number(item.equity) > 0
                ? convertCurrency(Number(item.equity), item.currency, normalizedCurrency)
                : Number(item.equity);

              return (
                <tr
                  key={item.id || item.application_id}
                  className={`hover:bg-[#18181B] transition-colors ${
                    isTop ? 'bg-emerald-500/5' : ''
                  }`}
                >
                  {/* Company & Role Column */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-[#18181B] text-zinc-400 border border-[#27272A]">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/applications/${item.application_id}`}
                            className="font-semibold text-zinc-100 hover:text-indigo-400 transition-colors"
                          >
                            {item.applications?.company_name || 'Company'}
                          </Link>
                          {isTop && (
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Top TC
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {item.applications?.role_title || 'Role'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Total Compensation */}
                  <td className="py-3 px-3.5 text-right font-mono">
                    <span
                      className={`text-sm font-semibold ${
                        isTop ? 'text-emerald-400' : 'text-zinc-100'
                      }`}
                    >
                      {formatCurrency(displayTc, displayCurrency)}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      {isNormalized ? `(Orig: ${formatCurrency(rawTc, item.currency)})` : '/ yr'}
                    </span>
                  </td>

                  {/* Base Salary */}
                  <td className="py-3 px-3.5 text-right text-zinc-300 font-mono text-xs">
                    <div>{formatCurrency(displayBase, displayCurrency)}</div>
                    {isNormalized && (
                      <span className="text-[10px] text-zinc-400 font-normal">
                        {formatCurrency(Number(item.base_salary), item.currency)}
                      </span>
                    )}
                  </td>

                  {/* Bonus */}
                  <td className="py-3 px-3.5 text-right font-mono text-xs">
                    {Number(item.bonus) > 0 ? (
                      <div>
                        <span className="text-zinc-300">
                          {formatCurrency(displayBonus, displayCurrency)}
                        </span>
                        {isNormalized && (
                          <span className="text-[10px] text-zinc-400 block font-normal">
                            {formatCurrency(Number(item.bonus), item.currency)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>

                  {/* Equity */}
                  <td className="py-3 px-3.5 text-right font-mono text-xs">
                    {Number(item.equity) > 0 ? (
                      <div>
                        <span className="text-zinc-300">
                          {formatCurrency(displayEquity, displayCurrency)}
                        </span>
                        {isNormalized && (
                          <span className="text-[10px] text-zinc-400 block font-normal">
                            {formatCurrency(Number(item.equity), item.currency)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>

                  {/* Work Mode */}
                  <td className="py-3 px-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
                        item.work_mode === 'REMOTE'
                          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                          : item.work_mode === 'HYBRID'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-[#18181B] text-zinc-300 border-[#27272A]'
                      }`}
                    >
                      {item.work_mode}
                    </span>
                  </td>

                  {/* Perks / Benefits */}
                  <td className="py-3 px-3.5 text-xs text-zinc-400 max-w-xs">
                    {item.benefits_summary ? (
                      <p className="line-clamp-2 leading-relaxed text-[11px]">
                        {item.benefits_summary}
                      </p>
                    ) : item.offer_deadline ? (
                      <span className="text-amber-400 font-mono text-[11px]">
                        Deadline: {new Date(item.offer_deadline).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
