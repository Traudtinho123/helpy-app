/** HELPY Farbpalette — Premium v3. */

export const colors = {
  brand: {
    primary: "#4F46E5",
    primaryDark: "#4338CA",
    primaryLight: "#EEF2FF",
    accent: "#C7D2FE",
  },
  surface: {
    page: "#F7F6F2",
    pageSecondary: "#F0EFE9",
    sidebar: "#08080F",
    card: "#FFFFFF",
    cardMuted: "#F0EFE9",
    glass: "#FFFFFF",
    glassStrong: "#FFFFFF",
  },
  text: {
    primary: "#0A0A0A",
    secondary: "#6B7280",
    muted: "#9CA3AF",
    subtle: "#9CA3AF",
    inverse: "#FFFFFF",
    sidebar: "rgba(255,255,255,0.85)",
    sidebarMuted: "rgba(255,255,255,0.45)",
  },
  border: {
    default: "rgba(10,10,10,0.08)",
    muted: "rgba(10,10,10,0.08)",
    focus: "#4F46E5",
    strong: "rgba(10,10,10,0.16)",
  },
  status: {
    neu: { border: "#C7D2FE", bg: "#EEF2FF", text: "#4F46E5" },
    vorbereitet: { border: "#C7D2FE", bg: "#EEF2FF", text: "#4338CA" },
    inPruefung: { border: "#FDE68A", bg: "#FFFBEB", text: "#D97706" },
    bestaetigt: { border: "#A7F3D0", bg: "#ECFDF5", text: "#059669" },
    erledigt: { border: "rgba(10,10,10,0.08)", bg: "#F0EFE9", text: "#6B7280" },
    kritisch: { border: "#FECACA", bg: "#FEF2F2", text: "#DC2626" },
    hoch: { border: "#FDE68A", bg: "#FFFBEB", text: "#D97706" },
    mittel: { border: "#C7D2FE", bg: "#EEF2FF", text: "#4F46E5" },
    niedrig: { border: "rgba(10,10,10,0.08)", bg: "#F0EFE9", text: "#6B7280" },
    success: { border: "#A7F3D0", bg: "#ECFDF5", text: "#059669" },
    danger: { border: "#FECACA", bg: "#FEF2F2", text: "#DC2626" },
  },
  overlay: {
    scrim: "rgba(10, 10, 10, 0.4)",
    scrimLight: "rgba(10, 10, 10, 0.2)",
  },
} as const;

export type HelpyColorToken = keyof typeof colors;
