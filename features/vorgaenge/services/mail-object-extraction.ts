/** Extrahiert Objekt-Hinweise aus Betreff und Mail-Text (regelbasiert). */

export function extractNamedObjectsFromMail(subject: string, body: string): string[] {
  const objects = new Set<string>();
  const haystack = `${subject}\n${body}`;

  const streetMatches =
    haystack.match(
      /\b([A-ZÄÖÜ][a-zäöüß]+(?:straße|strasse|weg|gasse|platz|str\.)\s*\d+[a-zA-Z]?)\b/g
    ) ?? [];
  streetMatches.forEach((match) => objects.add(match.trim()));

  const portalRef =
    haystack.match(/\b(?:immoscout|homegate|newhome)[^\n]{0,40}#?\d{4,}\b/gi) ?? [];
  portalRef.forEach((match) => objects.add(match.trim()));

  const roomMatch = haystack.match(/\b\d(?:[.,]\d)?\s*[-–]?\s*Zimmer\b/i);
  if (roomMatch) {
    const context = haystack.slice(
      Math.max(0, haystack.indexOf(roomMatch[0]!) - 40),
      haystack.indexOf(roomMatch[0]!) + 80
    );
    objects.add(context.trim().slice(0, 80));
  }

  const quoted = haystack.match(/[„"']([^„"']{4,80})[“"']/g) ?? [];
  quoted.forEach((match) => {
    const inner = match.replace(/^[„"']|[“"']$/g, "").trim();
    if (inner.length >= 4) objects.add(inner);
  });

  if (subject.trim().length >= 4) {
    objects.add(subject.trim());
  }

  return [...objects].slice(0, 5);
}

const STREET_HINT_PATTERN =
  /\b(strasse|straße|weg|gasse|platz|str\.)\s*\d+/i;

/** Bevorzugt Straßenadressen gegenüber Betreff-Zeilen. */
export function pickPrimaryObjectHint(queries: string[]): string | null {
  if (queries.length === 0) return null;

  const street = queries.find((query) => STREET_HINT_PATTERN.test(query));
  if (street?.trim()) return street.trim();

  const concise = queries.find(
    (query) => query.trim().length >= 4 && query.trim().length <= 80
  );
  return (concise ?? queries[0])?.trim() ?? null;
}
