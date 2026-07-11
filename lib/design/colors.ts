/** HELPY Farbpalette — Premium SaaS. */

export const colors = {
  brand: {
    primary: "#2563EB",
    primaryDark: "#1D4ED8",
    primaryLight: "#3B82F6",
    accent: "#60A5FA",
  },
  surface: {
    page: "#EEF4FC",
    pageGradientFrom: "#EEF4FC",
    pageGradientVia: "#E8F0FA",
    pageGradientTo: "#DBEAFE",
    card: "rgba(255, 255, 255, 0.9)",
    cardMuted: "#F8FAFC",
    glass: "rgba(255, 255, 255, 0.85)",
    glassStrong: "rgba(255, 255, 255, 0.8)",
  },
  text: {
    primary: "#0F172A",
    secondary: "#334155",
    muted: "#64748B",
    subtle: "#94A3B8",
    inverse: "#FFFFFF",
  },
  border: {
    default: "#CBD5E1",
    muted: "#E2E8F0",
    focus: "#BFDBFE",
    strong: "rgba(203, 213, 225, 0.5)",
  },
  status: {
    neu: { border: "#BFDBFE", bg: "#EFF6FF", text: "#2563EB" },
    vorbereitet: { border: "#C4B5FD", bg: "#F5F3FF", text: "#7C3AED" },
    inPruefung: { border: "#FDE68A", bg: "#FFFBEB", text: "#B45309" },
    bestaetigt: { border: "#A7F3D0", bg: "#ECFDF5", text: "#047857" },
    erledigt: { border: "#CBD5E1", bg: "#F8FAFC", text: "#64748B" },
    kritisch: { border: "#FECACA", bg: "#FEF2F2", text: "#DC2626" },
    hoch: { border: "#FDE68A", bg: "#FFFBEB", text: "#B45309" },
    mittel: { border: "#BFDBFE", bg: "#EFF6FF", text: "#2563EB" },
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
