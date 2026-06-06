/**
 * Formatting helpers for MF Compass.
 * Per PRODUCT.md §4 (src/lib/format/).
 */

/**
 * Formats a date to IST (Indian Standard Time) string.
 * Output example: "06 Jun 2026, 15:30 IST"
 */
export function formatIST(date: Date | string | null): string {
  if (!date) return "Not available";
  const d = typeof date === "string" ? new Date(date) : date;
  
  try {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
      hour12: false,
    };
    
    // Format to "en-IN" style
    const formatted = new Intl.DateTimeFormat("en-IN", options).format(d);
    
    // Standardize comma format (replace comma with space or keep)
    return `${formatted.replace(",", "")} IST`;
  } catch (e) {
    console.error("Error formatting date to IST", e);
    return d.toUTCString();
  }
}

/**
 * Formats a percentage value with sign.
 * Example: 15.25 -> "+15.25%", -3.4 -> "-3.40%", 0 -> "0.00%"
 */
export function formatPercent(
  value: number | string | null,
  showSign = true,
  allowZero = false
): string {
  if (value === null || value === undefined) return "--";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "--";
  if (num === 0 && !allowZero) return "--";
  
  const formatted = num.toFixed(2) + "%";
  if (!showSign || num === 0) return formatted;
  return num > 0 ? "+" + formatted : formatted;
}

/**
 * Formats currency values in INR (Indian Rupee) format.
 * Example: 5000 -> "₹5,000"
 */
export function formatINR(value: number | string | null, includeSymbol = true): string {
  if (value === null || value === undefined) return "--";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "--";
  
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(num);
  
  return includeSymbol ? "₹" + formatted : formatted;
}

/**
 * Formats NAV with 2 decimal points in INR format.
 * Example: 115.2 -> "₹115.20"
 */
export function formatNAV(value: number | string | null, includeSymbol = true): string {
  if (value === null || value === undefined) return "--";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "--";
  
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  
  return includeSymbol ? "₹" + formatted : formatted;
}

/**
 * Formats AUM in Crores.
 * Example: 1234.56 -> "₹1,234.56 Cr"
 */
export function formatAUM(value: number | string | null): string {
  if (value === null || value === undefined) return "--";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "--";
  
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  
  return "₹" + formatted + " Cr";
}

/**
 * Checks if a return value of 0 is genuine (e.g. daily/weekly return was exactly 0.00%
 * but the fund has history beyond this period) or a placeholder for non-existent history
 * (e.g. 3Y/5Y return of a brand new fund).
 */
export function isReturnGenuine(
  val: string | number | null | undefined,
  period: "1d" | "1w" | "1y" | "3y" | "5y",
  fund: {
    returns1d?: string | number | null;
    returns1w?: string | number | null;
    returns1y?: string | number | null;
    returns3y?: string | number | null;
    returns5y?: string | number | null;
  }
): boolean {
  if (val === null || val === undefined) return false;
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return false;
  if (num !== 0) return true;

  const periodFields = {
    "1d": fund.returns1d,
    "1w": fund.returns1w,
    "1y": fund.returns1y,
    "3y": fund.returns3y,
    "5y": fund.returns5y,
  };

  const periodsOrder = ["1d", "1w", "1y", "3y", "5y"] as const;
  const currentIndex = periodsOrder.indexOf(period);
  
  // Check if any subsequent period to the right has a non-zero value
  for (let i = currentIndex + 1; i < periodsOrder.length; i++) {
    const rightVal = periodFields[periodsOrder[i]];
    if (rightVal !== null && rightVal !== undefined) {
      const rightNum = typeof rightVal === "string" ? parseFloat(rightVal) : rightVal;
      if (!isNaN(rightNum) && rightNum !== 0) {
        return true;
      }
    }
  }

  return false;
}
