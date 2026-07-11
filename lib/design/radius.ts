/** HELPY Border Radius — nur 12, 16, 20, 24. */

export const radius = {
  sm: "12px",
  md: "16px",
  lg: "20px",
  xl: "24px",
} as const;

export type HelpyRadius = keyof typeof radius;

export const radiusClass = {
  sm: "rounded-[12px]",
  md: "rounded-[16px]",
  lg: "rounded-[20px]",
  xl: "rounded-[24px]",
  full: "rounded-full",
} as const;
