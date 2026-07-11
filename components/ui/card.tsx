import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Glassmorphism direkt als Tailwind-Klassen — nicht nur über .helpy-glass-card,
 * damit Styles garantiert greifen (Custom-Utilities in @layer können überschrieben werden).
 */
const GLASS_CARD_CLASSES =
  "rounded-[16px] border border-white/60 bg-[rgba(255,255,255,0.75)] shadow-[0_4px_6px_rgba(0,0,0,0.04),0_10px_40px_rgba(99,102,241,0.08)] backdrop-blur-[20px] [-webkit-backdrop-filter:blur(20px)]";

type CardVariant = "default" | "workspace" | "info" | "action";

const cardVariants: Record<CardVariant, string> = {
  default: GLASS_CARD_CLASSES,
  workspace: `${GLASS_CARD_CLASSES} py-0`,
  info: `${GLASS_CARD_CLASSES} border-[color-mix(in_srgb,var(--primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--primary-light)_60%,transparent)]`,
  action: `${GLASS_CARD_CLASSES} helpy-glass-card-interactive cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_12px_rgba(0,0,0,0.06),0_20px_60px_rgba(99,102,241,0.12)]`,
};

type CardProps = React.ComponentProps<"div"> & {
  variant?: CardVariant;
  size?: "default" | "sm";
  interactive?: boolean;
};

function Card({
  className,
  variant = "default",
  size = "default",
  interactive,
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col text-sm text-card-foreground",
        cardVariants[variant],
        interactive && "helpy-glass-card-interactive cursor-pointer",
        size === "sm" && "rounded-[16px]",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1 border-b border-[var(--card-border)] px-5 py-4",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-[14px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[12px] text-[var(--text-secondary)]", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("ml-auto shrink-0 self-start", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("px-5 py-4", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center border-t border-[var(--card-border)] bg-[var(--background-secondary)]/50 px-5 py-4",
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
