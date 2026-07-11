import { cn } from "@/lib/utils";

type CompanyLogoProps = {
  initials: string;
  colorClass: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeStyles = {
  sm: "size-9 text-[11px] rounded-[10px]",
  md: "size-11 text-[13px] rounded-[12px]",
  lg: "size-16 text-[18px] rounded-[16px]",
};

export function CompanyLogo({
  initials,
  colorClass,
  size = "md",
  className,
}: CompanyLogoProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-gradient-to-br font-semibold text-white shadow-sm",
        colorClass,
        sizeStyles[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
