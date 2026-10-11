/**
 * Utility helper for formatting currency in Sri Lankan Rupees (LKR).
 */
export function formatLKR(
  amount: number | string | undefined | null,
  includeDecimals: boolean = true,
): string {
  const numeric = Number(amount) || 0;
  return `LKR ${numeric.toLocaleString('en-LK', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  })}`;
}
