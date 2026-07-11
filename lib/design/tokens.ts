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

/** Glass card ohne Backdrop-Blur (z. B. Modals — Overlay blur reicht). */
const CARD_BASE_CLASSES =
  "rounded-[16px] border border-white/60 bg-[rgba(255,255,255,0.75)] shadow-[0_4px_6px_rgba(0,0,0,0.04),0_10px_40px_rgba(99,102,241,0.08)]";

const CARD_BLUR_CLASSES =
  "backdrop-blur-[20px] [-webkit-backdrop-filter:blur(20px)]";

/** Vorgefertigte HELPY-Oberflächen (Premium Glassmorphism). */
export const surfaces = {
  cardBase: CARD_BASE_CLASSES,
  card: `${CARD_BASE_CLASSES} ${CARD_BLUR_CLASSES}`,
  /** Modals: undurchsichtiger als Glass-Cards, ohne eigenen backdrop-blur. */
  modalCard: `${CARD_BASE_CLASSES} bg-[rgba(255,255,255,0.95)]`,
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
