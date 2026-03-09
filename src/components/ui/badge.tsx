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
          "bg-base-300 text-base-content/60",
        variant === "subtle" &&
          "bg-primary/15 text-primary",
        variant === "status" &&
          "bg-success/15 text-green-800",
        className
      )}
      {...props}
    />
  );
}

export { Badge, type BadgeProps };
