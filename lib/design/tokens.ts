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

/** Vorgefertigte HELPY-Oberflächen (RC1-kompatibel). */
export const surfaces = {
  card: `${radiusClass.lg} border border-[#CBD5E1]/40 bg-white/90 ${shadowClass.sm} backdrop-blur-xl`,
  cardHover:
    "transition-all duration-300 hover:border-[#BFDBFE]/60 hover:shadow-[0_8px_24px_rgba(37,99,235,0.08)]",
  panelAside:
    "flex h-full shrink-0 flex-col border-l border-[#CBD5E1]/50 bg-white/85 backdrop-blur-2xl",
  panelGlass:
    `border border-[#CBD5E1]/50 bg-white/80 ${shadowClass.panel} backdrop-blur-2xl`,
  infoBox: `${radiusClass.md} border border-[#BFDBFE]/50 bg-[#EFF6FF]/50`,
  primaryButton:
    "rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-sm transition-all duration-300 hover:shadow-md",
} as const;

export type HelpySurface = keyof typeof surfaces;
