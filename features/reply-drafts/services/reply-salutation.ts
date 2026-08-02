/** Anrede für Antwort-Mails: Herr/Frau/Guten Tag + Nachname */

const MALE_FIRST_NAMES = new Set([
  "thomas",
  "michael",
  "peter",
  "andreas",
  "markus",
  "stefan",
  "martin",
  "daniel",
  "christian",
  "marco",
  "david",
  "alexander",
  "hans",
  "paul",
  "lukas",
  "simon",
  "jan",
  "florian",
  "benjamin",
  "patrick",
]);

const FEMALE_FIRST_NAMES = new Set([
  "sandra",
  "maria",
  "anna",
  "lisa",
  "julia",
  "sabine",
  "nicole",
  "claudia",
  "petra",
  "monika",
  "sarah",
  "laura",
  "sophie",
  "emma",
  "nina",
  "barbara",
  "karin",
  "heike",
  "andrea",
  "christine",
]);

export type ReplySalutation = {
  line: string;
  title: "Herr" | "Frau" | null;
  lastName: string | null;
  firstName: string | null;
};

function extractLastName(fullName: string): string | null {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length >= 2 && !part.includes("@"));
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0] ?? null;
  return parts[parts.length - 1] ?? null;
}

function extractFirstName(fullName: string): string | null {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length >= 2 && !part.includes("@"));
  return parts[0]?.toLowerCase() ?? null;
}

function looksLikeCompany(name: string): boolean {
  return /\b(gmbh|ag|sa|sarl|ltd|inc|corp|immobilien|treuhand|anwalt|rechtsanwalt)\b/i.test(
    name
  );
}

export function buildReplySalutation(senderName: string): ReplySalutation {
  const trimmed = senderName.trim();
  if (!trimmed || trimmed.includes("@")) {
    return {
      line: "Guten Tag,",
      title: null,
      lastName: null,
      firstName: null,
    };
  }

  if (looksLikeCompany(trimmed)) {
    return {
      line: "Guten Tag,",
      title: null,
      lastName: null,
      firstName: null,
    };
  }

  const firstName = extractFirstName(trimmed);
  const lastName = extractLastName(trimmed);

  if (!lastName) {
    return {
      line: `Guten Tag ${trimmed},`,
      title: null,
      lastName: null,
      firstName,
    };
  }

  let title: "Herr" | "Frau" | null = null;
  if (firstName && MALE_FIRST_NAMES.has(firstName)) title = "Herr";
  if (firstName && FEMALE_FIRST_NAMES.has(firstName)) title = "Frau";

  if (title) {
    return {
      line: `Guten Tag ${title} ${lastName},`,
      title,
      lastName,
      firstName,
    };
  }

  return {
    line: `Guten Tag ${lastName},`,
    title: null,
    lastName,
    firstName,
  };
}
