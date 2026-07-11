import type {
  BrainEmailInput,
  CalendarDetectionResult,
  ErkannteTermin,
} from "@/features/brain/services/helpy-brain/types";

function detectDeadlines(text: string): ErkannteTermin[] {
  const deadlines: ErkannteTermin[] = [];

  if (/bis\s+freitag/i.test(text)) {
    deadlines.push({
      titel: "Angebotsfrist",
      frist: "Freitag",
      typ: "deadline",
    });
  }

  if (/bis\s+montag/i.test(text)) {
    deadlines.push({
      titel: "Frist",
      frist: "Montag",
      typ: "deadline",
    });
  }

  const dateMatch = text.match(
    /(?:dienstag|mittwoch|donnerstag|freitag|montag)[,\s]+(\d{1,2}:\d{2})/i
  );
  if (dateMatch) {
    const weekdayMatch = text.match(
      /(dienstag|mittwoch|donnerstag|freitag|montag)/i
    );
    deadlines.push({
      titel: "Terminvorschlag",
      datum: weekdayMatch?.[1],
      uhrzeit: dateMatch[1],
      typ: "termin",
    });
  }

  if (/besichtigung/i.test(text)) {
    deadlines.push({
      titel: "Besichtigung",
      typ: "besichtigung",
    });
  }

  if (/telefonat/i.test(text)) {
    deadlines.push({
      titel: "Telefonat",
      typ: "telefonat",
    });
  }

  return deadlines;
}

export function detectCalendarEvents(
  email: BrainEmailInput
): CalendarDetectionResult {
  const text = `${email.betreff ?? ""} ${email.inhalt}`;
  const termine = detectDeadlines(text);
  const deadlines = termine.filter((t) => t.typ === "deadline");

  return { termine, deadlines };
}
