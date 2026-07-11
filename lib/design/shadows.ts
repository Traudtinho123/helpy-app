/** HELPY Shadow — sm, md, lg. */

export const shadows = {
  sm: "0 2px 8px rgba(15, 23, 42, 0.04)",
  md: "0 8px 24px rgba(37, 99, 235, 0.08)",
  lg: "0 24px 64px rgba(15, 23, 42, 0.18)",
} as const;

export type HelpyShadow = keyof typeof shadows;

export const shadowClass = {
  sm: "shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
  md: "shadow-[0_8px_24px_rgba(37,99,235,0.08)]",
  lg: "shadow-[0_24px_64px_rgba(15,23,42,0.18)]",
  panel: "shadow-[-4px_0_24px_rgba(15,23,42,0.04)]",
  button: "shadow-[0_4px_16px_rgba(37,99,235,0.32)]",
} as const;
