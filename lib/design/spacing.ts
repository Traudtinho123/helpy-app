/** HELPY Spacing — 4px Basis. */

export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
} as const;

export type HelpySpacing = keyof typeof spacing;

/** Tailwind gap/p padding Klassen */
export const spacingClass = {
  1: "gap-1 p-1",
  2: "gap-2 p-2",
  3: "gap-3 p-3",
  4: "gap-4 p-4",
  6: "gap-6 p-6",
  8: "gap-8 p-8",
  12: "gap-12 p-12",
  16: "gap-16 p-16",
} as const;

export const panelPadding = "px-5 py-5";
export const panelHeaderPadding = "px-6 py-5";
export const sectionGap = "space-y-5";
export const cardPadding = "p-5";
export const cardPaddingSm = "p-4";
