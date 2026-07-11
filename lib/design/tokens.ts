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

/** Vorgefertigte HELPY-Oberflächen (Premium Glassmorphism). */
export const surfaces = {
  card: "helpy-glass-card",
  cardHover:
    "transition-all duration-200 hover:shadow-[0_8px_12px_rgba(0,0,0,0.06),0_20px_60px_rgba(99,102,241,0.12)] hover:-translate-y-px",
  panelAside:
    "flex h-full shrink-0 flex-col border-l border-[var(--card-border)] helpy-glass-card rounded-none border-y-0 border-r-0",
  panelGlass:
    "helpy-glass-card border border-[var(--card-border)] shadow-[var(--card-shadow)]",
  infoBox: "rounded-[16px] border border-[var(--primary)]/20 bg-[var(--primary-light)]/60",
  primaryButton: "helpy-btn-primary",
} as const;

export type HelpySurface = keyof typeof surfaces;
