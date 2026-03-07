"use client";

import { useTheme } from "./theme-provider";
import { Icon } from "@/components/icons";

interface DarkModeToggleProps {
  className?: string;
}

export function DarkModeToggle({ className }: DarkModeToggleProps) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={
        className ??
        "flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-secondary border border-border transition-colors"
      }
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
    </button>
  );
}
