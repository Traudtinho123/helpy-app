/** Maskiert Telefonnummern für die UI: +41 ** *** ** 34 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone?.trim()) return "Unbekannt";

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "** **";

  const lastFour = digits.slice(-4);
  const prefix = phone.trim().startsWith("+") ? "+" : "";

  if (digits.startsWith("41") && digits.length >= 10) {
    return `${prefix}41 ** *** ** ${lastFour}`;
  }

  const hidden = "*".repeat(Math.max(0, digits.length - 4));
  const spaced = hidden.replace(/(.{2})/g, "$1 ").trim();
  return `${prefix}${spaced} ${lastFour}`.trim();
}
