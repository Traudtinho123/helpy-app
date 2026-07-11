/** @deprecated Import from `@/lib/design` — RC1-Kompatibilität. */
import { surfaces } from "@/lib/design/tokens";
import { typography } from "@/lib/design/typography";

export { surfaces, tokens, typography, spacing, radius, shadows, animationClass } from "@/lib/design";

export const helpyCard = surfaces.card;
export const helpyCardHover = surfaces.cardHover;
export const helpyPanelAside = surfaces.panelAside;
export const helpyPanelWidth = "w-full lg:w-[340px] xl:w-[380px]";
export const helpyGlassSurface = surfaces.panelGlass;
export const helpyPrimaryButton = surfaces.primaryButton;
export const helpyBadgeReady =
  "rounded-full border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]";
export const helpySectionLabel = typography.label;
export const helpyBodyText = typography.bodySm;
export const helpyMutedText = typography.muted;
