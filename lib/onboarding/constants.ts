export const ONBOARDING_TOTAL_STEPS = 6;

export const ONBOARDING_SKIPPABLE_STEPS = new Set([4, 5]);

export const ONBOARDING_REQUIRED_STEPS = new Set([2, 3]);

export type OnboardingIndustry = {
  value: string;
  label: string;
  emoji: string;
  skill: string;
};

export const ONBOARDING_INDUSTRIES: OnboardingIndustry[] = [
  { value: "real-estate", label: "Immobilien", emoji: "🏢", skill: "real-estate" },
  { value: "beauty", label: "Coiffeur / Beauty", emoji: "✂️", skill: "friseur" },
  { value: "fitness", label: "Fitness / Gym", emoji: "💪", skill: "other" },
  { value: "medical", label: "Arztpraxis", emoji: "🏥", skill: "other" },
  { value: "gastro", label: "Restaurant / Gastro", emoji: "🍽️", skill: "other" },
  { value: "cleaning", label: "Reinigung", emoji: "🧹", skill: "other" },
  { value: "gardening", label: "Gartenbau", emoji: "🌿", skill: "other" },
  { value: "consulting", label: "Beratung / Recht", emoji: "⚖️", skill: "consulting-legal" },
  { value: "construction", label: "Handwerk / Bau", emoji: "🔨", skill: "construction" },
  { value: "other", label: "Anderes", emoji: "📦", skill: "other" },
];

export function resolveSkillFromIndustry(value: string): string {
  const match = ONBOARDING_INDUSTRIES.find((item) => item.value === value);
  return match?.skill ?? "other";
}

export function onboardingStepPath(step: number): string {
  const clamped = Math.min(Math.max(step, 1), ONBOARDING_TOTAL_STEPS);
  return `/onboarding/schritt-${clamped}`;
}

export function parseOnboardingStep(pathname: string): number | null {
  const match = pathname.match(/\/onboarding\/schritt-(\d+)/);
  if (!match) return null;
  const step = Number(match[1]);
  if (!Number.isFinite(step) || step < 1 || step > ONBOARDING_TOTAL_STEPS) {
    return null;
  }
  return step;
}

export function nextOnboardingStepAfter(completedStep: number): number {
  return Math.min(completedStep + 1, ONBOARDING_TOTAL_STEPS);
}

export type ReplyStyleChoice = "formal" | "friendly" | "casual";

export const REPLY_STYLE_OPTIONS: Array<{
  id: ReplyStyleChoice;
  label: string;
  description: string;
}> = [
  { id: "formal", label: "Formell (Sie)", description: "Klassisch und professionell" },
  {
    id: "friendly",
    label: "Freundlich-professionell",
    description: "Warm und klar — empfohlen",
  },
  { id: "casual", label: "Locker (du)", description: "Nahbar und direkt" },
];

export function buildDefaultGreeting(companyName: string): string {
  return `Herzlich willkommen bei ${companyName}.\nIch bin HELPY, Ihr KI-Assistent.\nWie kann ich Ihnen helfen?`;
}
