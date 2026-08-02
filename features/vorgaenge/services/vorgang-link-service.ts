import {
  getRealEstateObjectById,
  upsertRealEstateObject,
} from "@/features/real-estate/object/object-memory";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

/** Verknüpft ein bestehendes Objekt mit einem Vorgang (client-seitig). */
export function linkRealEstateObjectToVorgang(
  objectId: string,
  vorgangId: string
): RealEstateObject | null {
  const object = getRealEstateObjectById(objectId);
  if (!object) return null;

  const updated: RealEstateObject = {
    ...object,
    vorgangIds: uniqueStrings([...object.vorgangIds, vorgangId]),
    updatedAt: new Date().toISOString(),
  };

  return upsertRealEstateObject(updated);
}

export async function patchVorgangLinks(input: {
  vorgangId: string;
  kundenId?: string | null;
  objektId?: string | null;
}): Promise<boolean> {
  const response = await fetch(`/api/vorgaenge/${input.vorgangId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kunden_id: input.kundenId,
      objekt_id: input.objektId,
    }),
  });

  return response.ok;
}

export async function fetchVorgangIntelligence(input: {
  fromEmail: string | null;
  fromName: string;
  subject: string;
  body: string;
  isSpam?: boolean;
}) {
  const response = await fetch("/api/vorgaenge/intelligence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as {
    intelligence?: import("@/lib/vorgaenge/sender-intelligence").VorgangSenderIntelligence;
  };
  return payload.intelligence ?? null;
}
