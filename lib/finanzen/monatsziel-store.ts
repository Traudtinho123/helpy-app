const devMonatsziel = new Map<string, number>();

export function getMonatszielForCompany(companyId: string): number {
  return devMonatsziel.get(companyId) ?? 0;
}

export function setMonatszielForCompany(
  companyId: string,
  value: number
): number {
  const sanitized = Math.max(0, value);
  devMonatsziel.set(companyId, sanitized);
  return sanitized;
}
