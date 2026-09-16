'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  OfferPackage,
  getAllOfferPackages,
  calculateTotalCompensation,
  formatCurrency,
  OFFERS_CHANGED_EVENT,
} from '../../../lib/offers';
import {
  Award,
  Trophy,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  ExternalLink,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const OfferComparisonMatrix: React.FC = () => {
  const [offersMap, setOffersMap] = useState<Record<string, OfferPackage>>({});

  const loadOffers = () => {
    setOffersMap(getAllOfferPackages());
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
    const list = Object.values(offersMap);
    // Sort descending by Total Compensation
    return list.sort(
      (a, b) => calculateTotalCompensation(b) - calculateTotalCompensation(a),
    );
  }, [offersMap]);

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
  const maxTC = calculateTotalCompensation(topOffer);

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

        {/* Top Offer Highlight Badge */}
        {topOffer && (
          <div className="px-3.5 py-2 rounded-xl bg-linear-to-r from-amber-50 to-emerald-50 dark:from-amber-950/30 dark:to-emerald-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Top Offer: </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {topOffer.companyName}
              </span>{' '}
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                ({formatCurrency(maxTC, topOffer.currency)} TC)
              </span>
            </div>
          </div>
        )}
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
            {offersList.map((offer, idx) => {
              const tc = calculateTotalCompensation(offer);
              const isTop = idx === 0;

              return (
                <tr
                  key={offer.applicationId}
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
                            href={`/applications/${offer.applicationId}`}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                          >
                            {offer.companyName}
                          </Link>
                          {isTop && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              🏆 Highest TC
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{offer.roleTitle}</p>
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
                      {formatCurrency(tc, offer.currency)}
                    </span>
                    <span className="text-[11px] text-slate-400 block">/ year</span>
                  </td>

                  {/* Base Salary */}
                  <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300 font-semibold text-xs">
                    {formatCurrency(offer.baseSalary, offer.currency)}
                  </td>

                  {/* Bonus */}
                  <td className="py-3.5 px-4 text-right text-xs">
                    {offer.bonus ? (
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(offer.bonus, offer.currency)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Equity */}
                  <td className="py-3.5 px-4 text-right text-xs">
                    {offer.equity ? (
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(offer.equity, offer.currency)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Work Mode */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        offer.workMode === 'REMOTE'
                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                          : offer.workMode === 'HYBRID'
                          ? 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {offer.workMode}
                    </span>
                  </td>

                  {/* Perks / Benefits */}
                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                    {offer.benefitsSummary ? (
                      <p className="line-clamp-2 leading-relaxed text-[11px]">
                        {offer.benefitsSummary}
                      </p>
                    ) : offer.offerDeadline ? (
                      <span className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                        Deadline: {new Date(offer.offerDeadline).toLocaleDateString()}
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
