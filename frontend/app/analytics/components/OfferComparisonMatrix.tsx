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
  DollarSign,
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
    // Load default currency preference if set
    const savedCurrency = localStorage.getItem('jobtracker_default_currency');
    if (savedCurrency && savedCurrency !== 'USD') {
      // Optional: initialize with preferred currency if multiple offers exist
    }

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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs text-center py-12 text-slate-400">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading offer packages...</p>
      </div>
    );
  }

  if (offersList.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
          <Award className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Job Offer & Compensation Comparison Matrix
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Log compensation packages (Base, Bonus, Equity, Work Mode) on your job applications to compare multiple offers side-by-side!
        </p>
        <div>
          <Link
            href="/board"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Offer & Compensation Matrix</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {offersList.length} {offersList.length === 1 ? 'Offer' : 'Offers'} Logged
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Side-by-side total compensation (TC), bonus, equity, and perk comparison
            </p>
          </div>
        </div>

        {/* Currency Converter & Top Offer Highlight Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Currency Normalizer Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Currency:</span>
            <select
              value={normalizedCurrency}
              onChange={(e) => setNormalizedCurrency(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {NORMALIZED_CURRENCIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {topOffer && (
            <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-amber-950/30 dark:to-emerald-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-500 dark:text-slate-400">Top Offer: </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {topOffer.applications?.company_name || 'Offer'}
                </span>{' '}
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  ({formatCurrency(
                    normalizedCurrency === 'ORIGINAL' ? rawTopTc : normalizedTopTc,
                    normalizedCurrency === 'ORIGINAL' ? topOffer.currency : normalizedCurrency
                  )} TC)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Company & Role</th>
              <th className="py-3 px-4 text-right">Total Annual Comp</th>
              <th className="py-3 px-4 text-right">Base Salary</th>
              <th className="py-3 px-4 text-right">Bonus</th>
              <th className="py-3 px-4 text-right">Equity / RSU</th>
              <th className="py-3 px-4 text-center">Work Mode</th>
              <th className="py-3 px-4">Perks & Details</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
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
                  className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                    isTop ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                  }`}
                >
                  {/* Company & Role Column */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/applications/${item.application_id}`}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                          >
                            {item.applications?.company_name || 'Company'}
                          </Link>
                          {isTop && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              🏆 Highest TC
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.applications?.role_title || 'Role'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Total Compensation */}
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`text-base font-extrabold ${
                        isTop
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {formatCurrency(displayTc, displayCurrency)}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {isNormalized ? `(Orig: ${formatCurrency(rawTc, item.currency)})` : '/ year'}
                    </span>
                  </td>

                  {/* Base Salary */}
                  <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300 font-semibold text-xs">
                    <div>{formatCurrency(displayBase, displayCurrency)}</div>
                    {isNormalized && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        {formatCurrency(Number(item.base_salary), item.currency)}
                      </span>
                    )}
                  </td>

                  {/* Bonus */}
                  <td className="py-3.5 px-4 text-right text-xs">
                    {Number(item.bonus) > 0 ? (
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(displayBonus, displayCurrency)}
                        </span>
                        {isNormalized && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {formatCurrency(Number(item.bonus), item.currency)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Equity */}
                  <td className="py-3.5 px-4 text-right text-xs">
                    {Number(item.equity) > 0 ? (
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(displayEquity, displayCurrency)}
                        </span>
                        {isNormalized && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {formatCurrency(Number(item.equity), item.currency)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Work Mode */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        item.work_mode === 'REMOTE'
                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                          : item.work_mode === 'HYBRID'
                          ? 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {item.work_mode}
                    </span>
                  </td>

                  {/* Perks / Benefits */}
                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                    {item.benefits_summary ? (
                      <p className="line-clamp-2 leading-relaxed text-[11px]">
                        {item.benefits_summary}
                      </p>
                    ) : item.offer_deadline ? (
                      <span className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                        Deadline: {new Date(item.offer_deadline).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
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
