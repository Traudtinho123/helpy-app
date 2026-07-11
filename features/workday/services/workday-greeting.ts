export const WORKDAY_GREETING_PLACEHOLDER = "Willkommen 👋";

type GreetingUser = {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

function capitalizeWord(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function firstNameFromMetadataName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function firstNameFromEmail(email: string): string {
  const localPart = email.split("@")[0]?.trim() ?? "";
  if (!localPart) return "";

  const segment = localPart.split(/[._-]/)[0] ?? localPart;
  return capitalizeWord(segment);
}

/** Extrahiert den Vornamen aus der Supabase-Session. */
export function extractFirstNameFromUser(
  user: GreetingUser | null | undefined
): string | null {
  if (!user) return null;

  const metadata = user.user_metadata ?? {};

  if (typeof metadata.first_name === "string" && metadata.first_name.trim()) {
    return metadata.first_name.trim();
  }

  if (typeof metadata.name === "string" && metadata.name.trim()) {
    const firstName = firstNameFromMetadataName(metadata.name);
    if (firstName) return firstName;
  }

  if (user.email) {
    const fromEmail = firstNameFromEmail(user.email);
    if (fromEmail) return fromEmail;
  }

  return null;
}

function greetingPrefixForHour(hour: number): string {
  if (hour >= 6 && hour < 12) return "Guten Morgen";
  if (hour >= 12 && hour < 18) return "Guten Tag";
  if (hour >= 18 && hour < 24) return "Guten Abend";
  return "Hallo";
}

/** Baut die tageszeitabhängige Begrüßung — nur clientseitig nach Mount verwenden. */
export function buildWorkdayGreeting(
  firstName: string | null | undefined,
  date: Date = new Date()
): string {
  if (!firstName) return WORKDAY_GREETING_PLACEHOLDER;

  const prefix = greetingPrefixForHour(date.getHours());
  return `${prefix} ${firstName} 👋`;
}

export function resolveWorkdayGreetingFromUser(
  user: GreetingUser | null | undefined,
  date: Date = new Date()
): string {
  return buildWorkdayGreeting(extractFirstNameFromUser(user), date);
}
