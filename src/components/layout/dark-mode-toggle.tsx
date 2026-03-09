"use client";

import { useTheme } from "./theme-provider";
import { ThemeSelector } from "./theme-selector";
import { Icon } from "@/components/icons";

interface DarkModeToggleProps {
  className?: string;
  showSelector?: boolean;
}

export function DarkModeToggle({ className, showSelector = true }: DarkModeToggleProps) {
  const { theme, toggle } = useTheme();

  if (showSelector) {
    return <ThemeSelector className={className} />;
  }

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={
        className ??
        "flex items-center justify-center w-8 h-8 rounded-md text-base-content/60 hover:text-base-content hover:bg-base-200 border border-base-300 transition-colors"
      }
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
    </button>
  );
}
