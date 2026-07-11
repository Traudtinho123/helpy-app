import type { ObjectDossier } from "@/features/real-estate/dossier/object-dossier-types";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import { getCoverImageUrl } from "@/features/real-estate/object/object-image-utils";
import type { DossierPayload } from "@/features/documents/pdf/types";
import { resolveCompanyKnowledge } from "@/features/company-knowledge/services/company-knowledge-context";
import { getCompanyProfileSnapshot } from "@/lib/company/company-profile-service";

export function buildDossierPayloadFromObject(
  dossier: ObjectDossier,
  object: RealEstateObject
): DossierPayload {
  const profile = getCompanyProfileSnapshot();
  const resolved = resolveCompanyKnowledge(profile);
  const cover = getCoverImageUrl(object.images);

  return {
    kind: "dossier",
    title: dossier.titel,
    subtitle: `${dossier.objectType} · ${dossier.transaktion}`,
    objectType: dossier.objectType,
    address: dossier.adresse,
    cityLine: `${dossier.plz} ${dossier.ort}, ${dossier.land}`,
    priceLabel: dossier.preisLabel,
    transactionLabel: dossier.transaktion !== "—" ? dossier.transaktion : undefined,
    eckdaten: dossier.eckdaten.map((item) => ({
      label: item.label,
      value: item.value,
    })),
    description: dossier.description,
    highlights: dossier.highlights,
    nextStepActions: dossier.nextStepActions,
    contact: {
      company: resolved.companyName,
      name: resolved.companyName,
      email: resolved.generalEmail,
      phone: resolved.phone,
      address: resolved.address,
    },
    imageUrls: cover ? [cover] : [],
  };
}
