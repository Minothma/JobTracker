'use client';

import { apiFetch } from './api-client';
import { OfferCurrency, WorkMode, OfferPackage } from './types';

export { type OfferCurrency, type WorkMode, type OfferPackage };

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
export function calculateTotalCompensation(offer: Pick<OfferPackage, 'base_salary' | 'bonus' | 'equity'>): number {
  return (Number(offer.base_salary) || 0) + (Number(offer.bonus) || 0) + (Number(offer.equity) || 0);
}

/**
 * Fetch all offers for the current user from backend API
 */
export async function fetchUserOffers(): Promise<OfferPackage[]> {
  try {
    const data = await apiFetch<OfferPackage[]>('/offers');
    if (typeof window !== 'undefined' && Array.isArray(data)) {
      const map: Record<string, OfferPackage> = {};
      data.forEach((item) => {
        if (item.application_id) {
          map[item.application_id] = item;
        }
      });
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(map));
    }
    return data;
  } catch {
    return Object.values(getAllOfferPackages());
  }
}

/**
 * Fetch offer package for a specific application from API
 */
export async function fetchApplicationOffer(applicationId: string): Promise<OfferPackage | null> {
  try {
    const offer = await apiFetch<OfferPackage | null>(`/applications/${applicationId}/offer`);
    if (offer && typeof window !== 'undefined') {
      const all = getAllOfferPackages();
      all[applicationId] = offer;
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(all));
    }
    return offer;
  } catch {
    return getOfferPackage(applicationId);
  }
}

/**
 * Save or update offer package to backend API
 */
export async function saveOfferToApi(
  applicationId: string,
  dto: {
    base_salary: number;
    currency?: OfferCurrency;
    bonus?: number;
    equity?: number;
    work_mode?: WorkMode;
    benefits_summary?: string;
    offer_deadline?: string;
  },
): Promise<OfferPackage> {
  const saved = await apiFetch<OfferPackage>(`/applications/${applicationId}/offer`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });

  if (typeof window !== 'undefined') {
    const all = getAllOfferPackages();
    all[applicationId] = saved;
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent(OFFERS_CHANGED_EVENT, { detail: { applicationId } }));
  }

  return saved;
}

/**
 * Delete offer package from backend API
 */
export async function deleteOfferFromApi(applicationId: string): Promise<void> {
  await apiFetch(`/applications/${applicationId}/offer`, {
    method: 'DELETE',
  });

  if (typeof window !== 'undefined') {
    const all = getAllOfferPackages();
    if (all[applicationId]) {
      delete all[applicationId];
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent(OFFERS_CHANGED_EVENT, { detail: { applicationId } }));
    }
  }
}

/**
 * Retrieves all stored offer packages from localStorage (offline/cache)
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
 * Retrieves offer package for a specific application from cache
 */
export function getOfferPackage(applicationId: string): OfferPackage | null {
  const all = getAllOfferPackages();
  return all[applicationId] || null;
}
