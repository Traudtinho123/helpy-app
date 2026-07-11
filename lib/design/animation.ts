/** HELPY Animation — einheitliche Transitions. */

export const duration = {
  fast: "150ms",
  normal: "300ms",
  slow: "500ms",
} as const;

export const easing = {
  default: "cubic-bezier(0.4, 0, 0.2, 1)",
  enter: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

export const animationClass = {
  transition: "transition-all duration-300",
  transitionFast: "transition-all duration-150",
  transitionSlow: "transition-all duration-500",
  hover: "transition-all duration-300 hover:shadow-md",
  fade: "helpy-fade-in",
  scale: "hover:scale-[1.01] active:scale-[0.99]",
  slide: "transition-transform duration-300",
} as const;

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const iconSizeClass = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
  xl: "size-8",
} as const;
