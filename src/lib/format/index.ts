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
