import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "subtle" | "status";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" &&
          "bg-bg-tertiary text-text-secondary",
        variant === "subtle" &&
          "bg-accent-light text-accent",
        variant === "status" &&
          "bg-tag-green text-green-800",
        className
      )}
      {...props}
    />
  );
}

export { Badge, type BadgeProps };
