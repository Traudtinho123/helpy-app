"use client";

import { cn } from "@/lib/utils";

export type HelpyCharacterPose = "idle" | "wave" | "typing";

type HelpyCharacterProps = {
  size?: number;
  pose?: HelpyCharacterPose;
  animated?: boolean;
  showLabel?: boolean;
  className?: string;
  variant?: "full" | "head";
};

const COLORS = {
  body: "#6366F1",
  bodyDark: "#4F46E5",
  bodyLight: "#818CF8",
  face: "#1E1B4B",
  eye: "#C7D2FE",
  accent: "#A5B4FC",
  shadow: "rgba(99,102,241,0.18)",
};

export function HelpyCharacter({
  size = 120,
  pose = "idle",
  animated = true,
  showLabel = true,
  className,
  variant = "full",
}: HelpyCharacterProps) {
  if (variant === "head") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        aria-label="HELPY"
        className={cn(animated && "helpy-char-idle", className)}
      >
        <circle cx="50" cy="50" r="46" fill={COLORS.body} />
        <circle cx="50" cy="50" r="34" fill={COLORS.face} />
        <g className={cn(animated && "helpy-char-blink")} style={{ transformOrigin: "50px 46px" }}>
          <circle cx="40" cy="46" r="5" fill={COLORS.eye} />
          <circle cx="60" cy="46" r="5" fill={COLORS.eye} />
        </g>
        <path
          d="M 38 58 Q 50 66 62 58"
          fill="none"
          stroke={COLORS.eye}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="50" cy="8" r="5" fill={COLORS.accent} />
        <circle cx="14" cy="50" r="5" fill={COLORS.accent} />
        <circle cx="86" cy="50" r="5" fill={COLORS.accent} />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size * 1.35}
      viewBox="0 0 200 270"
      aria-label="HELPY"
      className={cn(animated && pose === "idle" && "helpy-char-idle", className)}
    >
      <ellipse cx="100" cy="258" rx="52" ry="8" fill={COLORS.shadow} />

      {/* Left arm */}
      <g
        className={cn(
          animated && pose === "wave" && "helpy-char-arm-left-wave",
          animated && pose === "typing" && "helpy-char-type-left"
        )}
        style={{ transformOrigin: "58px 168px" }}
      >
        <rect x="38" y="148" width="22" height="48" rx="11" fill={COLORS.bodyLight} />
        <circle cx="49" cy="202" r="12" fill={COLORS.accent} />
      </g>

      {/* Right arm */}
      <g
        className={cn(
          animated && pose === "wave" && "helpy-char-arm-right-wave",
          animated && pose === "typing" && "helpy-char-type-right"
        )}
        style={{ transformOrigin: "142px 168px" }}
      >
        <rect x="140" y="148" width="22" height="48" rx="11" fill={COLORS.bodyLight} />
        <circle cx="151" cy="202" r="12" fill={COLORS.accent} />
      </g>

      {/* Legs */}
      <rect x="72" y="198" width="22" height="44" rx="11" fill={COLORS.body} />
      <rect x="106" y="198" width="22" height="44" rx="11" fill={COLORS.body} />
      <rect x="68" y="232" width="30" height="14" rx="7" fill={COLORS.bodyDark} />
      <rect x="102" y="232" width="30" height="14" rx="7" fill={COLORS.bodyDark} />

      {/* Torso */}
      <rect x="62" y="118" width="76" height="88" rx="28" fill={COLORS.body} />
      <rect x="62" y="186" width="76" height="12" rx="4" fill={COLORS.bodyDark} opacity="0.55" />
      {showLabel && (
        <text
          x="100"
          y="168"
          textAnchor="middle"
          fill="white"
          fontSize="22"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          letterSpacing="2"
        >
          HELPY
        </text>
      )}

      {/* Head */}
      <circle cx="100" cy="72" r="52" fill={COLORS.body} />
      <circle cx="100" cy="76" r="38" fill={COLORS.face} />

      <g className={cn(animated && "helpy-char-blink")} style={{ transformOrigin: "100px 72px" }}>
        <circle cx="84" cy="72" r="9" fill={COLORS.eye} />
        <circle cx="116" cy="72" r="9" fill={COLORS.eye} />
      </g>

      <path
        d="M 82 92 Q 100 104 118 92"
        fill="none"
        stroke={COLORS.eye}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Head nodes */}
      <circle cx="100" cy="24" r="7" fill={COLORS.accent} className={animated ? "helpy-char-node" : undefined} />
      <circle cx="52" cy="72" r="7" fill={COLORS.accent} className={animated ? "helpy-char-node" : undefined} />
      <circle cx="148" cy="72" r="7" fill={COLORS.accent} className={animated ? "helpy-char-node" : undefined} />

      {/* Chest highlight */}
      <ellipse cx="78" cy="138" rx="12" ry="18" fill="white" opacity="0.12" />
    </svg>
  );
}
