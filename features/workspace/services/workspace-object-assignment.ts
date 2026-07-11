import {
  detectRealEstatePlatformSource,
  extractRealEstateObjectFields,
  hasRecognizedObjectData,
} from "@/features/real-estate/object/object-detector";
import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";
import type { RealEstateObjectFieldExtraction } from "@/features/real-estate/object/object-types";
import type { WorkspaceContext } from "@/features/workspace/context/workspace-context";

export type WorkspaceObjectAssignment =
  | {
      kind: "linked";
      objectId: string;
      title: string;
      adresse: string;
    }
  | {
      kind: "suggested";
      title: string;
      adresse: string;
      preis: string | null;
      quelle: string;
      fields: RealEstateObjectFieldExtraction;
    }
  | {
      kind: "missing";
    };

export function resolveWorkspaceObjectAssignment(
  context: WorkspaceContext
): WorkspaceObjectAssignment {
  const linked = peekRealEstateObjectByVorgangId(context.workspaceId);
  if (linked) {
    return {
      kind: "linked",
      objectId: linked.objectId,
      title: linked.titel,
      adresse: `${linked.adresse}, ${linked.plz} ${linked.ort}`,
    };
  }

  if (context.object?.objectId) {
    return {
      kind: "linked",
      objectId: context.object.objectId,
      title: context.object.titel,
      adresse: context.object.adresse,
    };
  }

  const liste = context.listeVorgang;
  const mail = context.mail;
  const quelle =
    detectRealEstatePlatformSource(
      mail.absender,
      mail.betreff,
      mail.snippet || mail.inhalt,
      liste?.quelle ?? mail.quelle
    ) ?? "Website Anfrage";

  const fields = extractRealEstateObjectFields({
    from: mail.absender,
    subject: mail.betreff,
    snippet: mail.snippet || mail.inhalt,
    quelle,
    detectedContext: [...mail.detectedContext],
  });

  if (hasRecognizedObjectData(fields)) {
    return {
      kind: "suggested",
      title: fields.titel ?? context.object?.titel ?? mail.betreff,
      adresse: fields.adresse ?? context.object?.adresse ?? "—",
      preis: fields.preis,
      quelle,
      fields,
    };
  }

  if (context.object) {
    return {
      kind: "suggested",
      title: context.object.titel,
      adresse: context.object.adresse,
      preis: context.object.preis,
      quelle: context.object.quelle,
      fields,
    };
  }

  return { kind: "missing" };
}
