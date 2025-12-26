/**
 * Currency conversion utilities for D&D 5e
 * 
 * Exchange rates (in copper):
 * - 1 Platinum (PL) = 1000 copper
 * - 1 Gold (PO) = 100 copper
 * - 1 Electrum (PE) = 50 copper
 * - 1 Silver (PP) = 10 copper
 * - 1 Copper (PC) = 1 copper
 */

export interface FullCurrency {
  platinum?: number;
  gold?: number;
  electrum?: number;
  silver?: number;
  copper?: number;
}

// Conversion rates to copper
export const COPPER_RATES = {
  platinum: 1000,
  gold: 100,
  electrum: 50,
  silver: 10,
  copper: 1,
} as const;

/**
 * Convert all currency to total copper value
 */
export function currencyToCopper(currency: FullCurrency): number {
  return (
    (currency.platinum || 0) * COPPER_RATES.platinum +
    (currency.gold || 0) * COPPER_RATES.gold +
    (currency.electrum || 0) * COPPER_RATES.electrum +
    (currency.silver || 0) * COPPER_RATES.silver +
    (currency.copper || 0) * COPPER_RATES.copper
  );
}

/**
 * Convert copper to normalized currency (largest denominations first)
 * Does not use electrum by default as it's rare
 */
export function copperToCurrency(totalCopper: number, useElectrum = false): FullCurrency {
  let remaining = Math.max(0, Math.floor(totalCopper));
  
  const platinum = Math.floor(remaining / COPPER_RATES.platinum);
  remaining -= platinum * COPPER_RATES.platinum;
  
  const gold = Math.floor(remaining / COPPER_RATES.gold);
  remaining -= gold * COPPER_RATES.gold;
  
  let electrum = 0;
  if (useElectrum) {
    electrum = Math.floor(remaining / COPPER_RATES.electrum);
    remaining -= electrum * COPPER_RATES.electrum;
  }
  
  const silver = Math.floor(remaining / COPPER_RATES.silver);
  remaining -= silver * COPPER_RATES.silver;
  
  const copper = remaining;
  
  return {
    platinum: platinum || 0,
    gold: gold || 0,
    electrum: electrum || 0,
    silver: silver || 0,
    copper: copper || 0,
  };
}

/**
 * Check if wallet has enough currency to pay the required amount
 * Uses total copper comparison with automatic conversion
 */
export function hasEnoughCurrency(wallet: FullCurrency, required: FullCurrency): boolean {
  const walletTotal = currencyToCopper(wallet);
  const requiredTotal = currencyToCopper(required);
  return walletTotal >= requiredTotal;
}

/**
 * Subtract required currency from wallet using automatic conversion
 * Returns the new wallet after payment, or null if insufficient funds
 */
export function subtractCurrency(wallet: FullCurrency, required: FullCurrency): FullCurrency | null {
  const walletTotal = currencyToCopper(wallet);
  const requiredTotal = currencyToCopper(required);
  
  if (walletTotal < requiredTotal) {
    return null; // Insufficient funds
  }
  
  const remainingCopper = walletTotal - requiredTotal;
  return copperToCurrency(remainingCopper);
}

/**
 * Add currency to wallet
 */
export function addCurrency(wallet: FullCurrency, toAdd: FullCurrency): FullCurrency {
  const walletTotal = currencyToCopper(wallet);
  const addTotal = currencyToCopper(toAdd);
  return copperToCurrency(walletTotal + addTotal);
}

/**
 * Format currency for display (compact)
 */
export function formatCurrency(currency: FullCurrency, showZeros = false): string {
  const parts: string[] = [];
  
  if (currency.platinum || showZeros) parts.push(`${currency.platinum || 0} PL`);
  if (currency.gold || showZeros) parts.push(`${currency.gold || 0} PO`);
  if (currency.electrum) parts.push(`${currency.electrum || 0} PE`); // Only show if non-zero
  if (currency.silver || showZeros) parts.push(`${currency.silver || 0} PP`);
  if (currency.copper || showZeros) parts.push(`${currency.copper || 0} PC`);
  
  return parts.length > 0 ? parts.join(', ') : '0 PC';
}

/**
 * Format currency total in gold equivalent
 */
export function formatCurrencyAsGold(currency: FullCurrency): string {
  const totalCopper = currencyToCopper(currency);
  const goldEquivalent = totalCopper / COPPER_RATES.gold;
  return `${goldEquivalent.toFixed(2)} PO`;
}

/**
 * Normalize currency to ensure no field is undefined
 */
export function normalizeCurrency(currency: Partial<FullCurrency> | null | undefined): FullCurrency {
  return {
    platinum: currency?.platinum || 0,
    gold: currency?.gold || 0,
    electrum: currency?.electrum || 0,
    silver: currency?.silver || 0,
    copper: currency?.copper || 0,
  };
}
