import * as React from "react";

import { cn } from "@/lib/utils";

type CardVariant = "default" | "workspace" | "info" | "action";

const cardVariants: Record<CardVariant, string> = {
  default:
    "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]",
  workspace:
    "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] py-0 shadow-[var(--shadow-sm)]",
  info:
    "rounded-[var(--radius-lg)] border border-[var(--color-primary-mid)] bg-[var(--color-primary-light)] shadow-[var(--shadow-sm)]",
  action:
    "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] cursor-pointer transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)]",
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
  const resolvedVariant = interactive ? "action" : variant;

  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col text-[var(--text-sm)] text-[var(--color-ink)]",
        cardVariants[resolvedVariant],
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
        "flex flex-col gap-1 border-b border-[var(--color-border)] px-[var(--space-6)] py-[var(--space-4)]",
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
        "text-[var(--text-sm)] font-semibold tracking-[var(--tracking-tight)] text-[var(--color-ink)]",
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
      className={cn("text-[var(--text-xs)] text-[var(--color-ink-3)]", className)}
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
    <div
      data-slot="card-content"
      className={cn("px-[var(--space-6)] py-[var(--space-4)]", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-[var(--space-6)] py-[var(--space-4)]",
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
