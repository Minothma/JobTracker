'use client';

export type OfferCurrency = 'USD' | 'LKR' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'SGD' | 'INR';
export type WorkMode = 'REMOTE' | 'HYBRID' | 'ONSITE';

export interface OfferPackage {
  applicationId: string;
  companyName: string;
  roleTitle: string;
  baseSalary: number;
  currency: OfferCurrency;
  bonus: number;
  equity: number;
  workMode: WorkMode;
  benefitsSummary: string;
  offerDeadline?: string;
  updatedAt: string;
}

const OFFERS_STORAGE_KEY = 'jobtracker_offer_packages';
export const OFFERS_CHANGED_EVENT = 'jobtracker_offers_changed';

export const CURRENCY_SYMBOLS: Record<OfferCurrency, string> = {
  USD: '$',
  LKR: 'Rs. ',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'AU$',
  SGD: 'SG$',
  INR: '₹',
};

/**
 * Formats a monetary amount with currency symbol and commas
 */
export function formatCurrency(amount: number, currency: OfferCurrency = 'USD'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  return `${symbol}${amount.toLocaleString('en-US')}`;
}

/**
 * Computes Total Annual Compensation (TC)
 */
export function calculateTotalCompensation(offer: Pick<OfferPackage, 'baseSalary' | 'bonus' | 'equity'>): number {
  return (offer.baseSalary || 0) + (offer.bonus || 0) + (offer.equity || 0);
}

/**
 * Retrieves all stored offer packages from localStorage
 */
export function getAllOfferPackages(): Record<string, OfferPackage> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

/**
 * Retrieves offer package for a specific application
 */
export function getOfferPackage(applicationId: string): OfferPackage | null {
  const all = getAllOfferPackages();
  return all[applicationId] || null;
}

/**
 * Saves or updates an offer package
 */
export function saveOfferPackage(offer: OfferPackage): void {
  if (typeof window === 'undefined') return;
  const all = getAllOfferPackages();
  all[offer.applicationId] = {
    ...offer,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent(OFFERS_CHANGED_EVENT, { detail: { applicationId: offer.applicationId } }));
  } catch (err) {
    console.error('Failed to save offer package', err);
  }
}

/**
 * Deletes an offer package
 */
export function deleteOfferPackage(applicationId: string): void {
  if (typeof window === 'undefined') return;
  const all = getAllOfferPackages();
  if (all[applicationId]) {
    delete all[applicationId];
    try {
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent(OFFERS_CHANGED_EVENT, { detail: { applicationId } }));
    } catch (err) {
      console.error('Failed to delete offer package', err);
    }
  }
}
