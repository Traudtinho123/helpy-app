import { Avatar as HelpyAvatarComponent } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

type HelpyAvatarProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function HelpyAvatar({ size = "md", className }: HelpyAvatarProps) {
  return (
    <HelpyAvatarComponent
      helpy
      size={size}
      className={cn(className)}
    />
  );
}
