import * as React from "react";

import { surfaces } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "workspace" | "info" | "action";

const cardVariants: Record<CardVariant, string> = {
  default: surfaces.card,
  workspace: `${surfaces.card} py-0`,
  info: "helpy-glass-card rounded-[16px] border border-[var(--primary)]/20 bg-[var(--primary-light)]/60",
  action: `${surfaces.card} ${surfaces.cardHover} helpy-glass-card-interactive cursor-pointer`,
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
