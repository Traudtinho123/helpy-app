import type { PreparedDocument } from "@/features/documents/services/types";
import type {
  RealEstateObject,
  RealEstateObjectStatus,
} from "@/features/real-estate/object/object-types";
import type { ObjectImage } from "@/features/real-estate/object/object-image-types";

export type PortfolioObjectSummary = {
  objectId: string;
  titel: string;
  adresse: string;
  plz: string;
  ort: string;
  preis: string;
  transaktion: RealEstateObject["transaktion"];
  listingBadge: "Miete" | "Kauf" | null;
  formattedPreis: string;
  status: RealEstateObjectStatus;
  statusLabel: string;
  quelle: string;
  interessentenCount: number;
  besichtigungenCount: number;
  dokumenteCount: number;
  letzteAktivitaet: string;
  fromHelpy: boolean;
  coverImageUrl: string | null;
  imagesCount: number;
};

export type ObjektInteressent = {
  vorgangId: string;
  name: string;
  email: string;
  status: string;
  letzteAktivitaet: string;
};

export type ObjektBesichtigung = {
  id: string;
  datum: string;
  uhrzeit: string;
  interessent: string;
  status: string;
  kalenderquelle: string;
};

export type ObjektKommunikation = {
  id: string;
  quelle: string;
  betreff: string;
  kunde: string;
  datum: string;
  status: string;
};

export type ObjektEnrichment = {
  baujahr: string;
  verfuegbarkeit: string;
  interessenten: ObjektInteressent[];
  besichtigungen: ObjektBesichtigung[];
  kommunikation: ObjektKommunikation[];
  helpyWissen: string[];
};

export type ObjektakteDetail = {
  object: RealEstateObject;
  summary: string;
  baujahr: string;
  verfuegbarkeit: string;
  interessenten: ObjektInteressent[];
  besichtigungen: ObjektBesichtigung[];
  dokumente: PreparedDocument[];
  kommunikation: ObjektKommunikation[];
  helpyWissen: string[];
  interessentenCount: number;
  besichtigungenCount: number;
  dokumenteCount: number;
  letzteAktivitaet: string;
  images: ObjectImage[];
};
