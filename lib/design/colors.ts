/** HELPY Farbpalette — Premium SaaS. */

export const colors = {
  brand: {
    primary: "#6366F1",
    primaryDark: "#4F46E5",
    primaryLight: "#818CF8",
    accent: "#A5B4FC",
  },
  surface: {
    page: "#F4F4F8",
    pageSecondary: "#EEEEF4",
    sidebar: "#0F0E17",
    card: "rgba(255, 255, 255, 0.75)",
    cardMuted: "#EEEEF4",
    glass: "rgba(255, 255, 255, 0.75)",
    glassStrong: "rgba(255, 255, 255, 0.85)",
  },
  text: {
    primary: "#0F0E17",
    secondary: "#6B7280",
    muted: "#9CA3AF",
    subtle: "#9CA3AF",
    inverse: "#FFFFFF",
    sidebar: "#E5E7EB",
    sidebarMuted: "#9CA3AF",
  },
  border: {
    default: "#CBD5E1",
    muted: "#E2E8F0",
    focus: "#BFDBFE",
    strong: "rgba(203, 213, 225, 0.5)",
  },
  status: {
    neu: { border: "#C7D2FE", bg: "#EEF2FF", text: "#6366F1" },
    vorbereitet: { border: "#C4B5FD", bg: "#F5F3FF", text: "#7C3AED" },
    inPruefung: { border: "#FDE68A", bg: "#FFFBEB", text: "#B45309" },
    bestaetigt: { border: "#A7F3D0", bg: "#ECFDF5", text: "#047857" },
    erledigt: { border: "#CBD5E1", bg: "#F8FAFC", text: "#64748B" },
    kritisch: { border: "#FECACA", bg: "#FEF2F2", text: "#DC2626" },
    hoch: { border: "#FDE68A", bg: "#FFFBEB", text: "#B45309" },
    mittel: { border: "#C7D2FE", bg: "#EEF2FF", text: "#6366F1" },
    niedrig: { border: "#CBD5E1", bg: "#F8FAFC", text: "#64748B" },
    success: { border: "#A7F3D0", bg: "#ECFDF5", text: "#047857" },
    danger: { border: "#FECACA", bg: "#FEF2F2", text: "#DC2626" },
  },
  overlay: {
    scrim: "rgba(15, 23, 42, 0.4)",
    scrimLight: "rgba(15, 23, 42, 0.2)",
  },
} as const;

export type HelpyColorToken = keyof typeof colors;
