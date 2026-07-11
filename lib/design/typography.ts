/** HELPY Typografie — nutzt CSS Custom Properties aus globals.css */

export const typography = {
  pageTitle: "helpy-h1 lg:text-[2rem]",
  sectionTitle: "helpy-h2",
  cardTitle: "text-[14px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]",
  panelTitle: "text-sm font-semibold tracking-[-0.02em] text-[var(--text-primary)]",
  label: "helpy-label",
  body: "text-[13px] leading-[1.65] text-[var(--text-secondary)]",
  bodySm: "text-[12px] leading-relaxed text-[var(--text-secondary)]",
  muted: "text-[12px] leading-relaxed text-[var(--text-muted)]",
  caption: "text-[11px] font-medium text-[var(--text-muted)]",
  badge: "text-[11px] font-semibold tracking-[-0.01em]",
  greeting: "helpy-h1",
  greetingSub: "helpy-greeting-sub",
} as const;
