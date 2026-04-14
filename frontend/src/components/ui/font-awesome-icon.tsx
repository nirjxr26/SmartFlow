import { cn } from "@/lib/utils";

interface FontAwesomeIconProps {
  icon: string; // Font Awesome icon class e.g., "fas fa-tasks"
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
}

export function FontAwesomeIcon({ icon, className, size = "md", color }: FontAwesomeIconProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl",
  };

  const style = color ? { color } : undefined;

  return (
    <i
      className={cn(
        icon,
        sizeClasses[size],
        className
      )}
      style={style}
    />
  );
}
