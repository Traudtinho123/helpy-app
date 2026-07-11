import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

/**
 * Vorgänge Service — aggregiert normalisierte Arbeitsobjekte aus HELPY Brain.
 * UI konsumiert ausschließlich Vorgänge, nie Rohdaten einzelner Plattformen.
 */
export class VorgaengeService {
  /** Später: Brain + Connect → Vorgänge */
  async getVorgaenge(): Promise<Vorgang[]> {
    const { getBrainV2Vorgaenge, sortVorgaengeByPriority } = await import(
      "@/features/workspace/services/vorgaenge/mock-vorgaenge"
    );
    return sortVorgaengeByPriority(getBrainV2Vorgaenge());
  }

  async getVorgangById(id: string): Promise<Vorgang | null> {
    const { getBrainV2Vorgaenge } = await import(
      "@/features/workspace/services/vorgaenge/mock-vorgaenge"
    );
    return getBrainV2Vorgaenge().find((v) => v.id === id) ?? null;
  }
}

export const vorgaengeService = new VorgaengeService();

export function createVorgaengeService(): VorgaengeService {
  return new VorgaengeService();
}
