import { animationClass, duration, easing, iconSize, iconSizeClass } from "@/lib/design/animation";
import { colors } from "@/lib/design/colors";
import { radius, radiusClass } from "@/lib/design/radius";
import { cardPadding, cardPaddingSm, panelHeaderPadding, panelPadding, sectionGap, spacing, spacingClass } from "@/lib/design/spacing";
import { shadowClass, shadows } from "@/lib/design/shadows";
import { typography } from "@/lib/design/typography";

/** Zusammengeführte HELPY Design Tokens. */
export const tokens = {
  colors,
  spacing,
  spacingClass,
  radius,
  radiusClass,
  shadows,
  shadowClass,
  duration,
  easing,
  animationClass,
  iconSize,
  iconSizeClass,
  typography,
  panelPadding,
  panelHeaderPadding,
  sectionGap,
  cardPadding,
  cardPaddingSm,
} as const;

const CARD_BASE_CLASSES =
  "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]";

/** Vorgefertigte HELPY-Oberflächen (Premium v3). */
export const surfaces = {
  cardBase: CARD_BASE_CLASSES,
  card: CARD_BASE_CLASSES,
  modalCard: `${CARD_BASE_CLASSES} shadow-[var(--shadow-lg)]`,
  cardHover:
    "transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-px hover:border-[var(--color-border-strong)]",
  panelAside:
    "flex h-full shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)]",
  panelGlass:
    "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]",
  infoBox:
    "rounded-[var(--radius-lg)] border border-[var(--color-primary-mid)] bg-[var(--color-primary-light)]",
  primaryButton: "helpy-btn-primary",
} as const;

export type HelpySurface = keyof typeof surfaces;
