import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-semibold whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "helpy-btn-primary",
        secondary: "helpy-btn-secondary",
        ghost:
          "rounded-[8px] bg-transparent text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--background-secondary)] hover:text-[var(--text-primary)]",
        danger:
          "rounded-[8px] border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[var(--danger-light)] text-[var(--danger)] transition-all duration-200 hover:opacity-90",
        success:
          "rounded-[8px] border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[var(--success-light)] text-[var(--success)] transition-all duration-200 hover:opacity-90",
        /** Shadcn-kompatible Aliase */
        default: "helpy-btn-primary",
        outline: "helpy-btn-secondary",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-9 gap-2 rounded-[12px] px-4 text-[12px] [&_svg:not([class*='size-'])]:size-4",
        lg: "h-11 gap-2 rounded-[12px] px-5 text-[13px] [&_svg:not([class*='size-'])]:size-4",
        /** Shadcn-kompatible Aliase */
        default:
          "h-8 gap-1.5 rounded-lg px-2.5 text-sm [&_svg:not([class*='size-'])]:size-4",
        xs: "h-6 gap-1 rounded-[10px] px-2 text-[10px] [&_svg:not([class*='size-'])]:size-3",
        icon: "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9 rounded-[12px] [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
