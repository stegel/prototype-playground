"use client";

import { useTheme, DAISY_THEMES, type Theme } from "./theme-provider";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("dropdown dropdown-end", className)}>
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-sm gap-1 normal-case"
      >
        <Icon name="sun" size={15} className="hidden dark:inline" />
        <Icon name="moon" size={15} className="inline dark:hidden" />
        <span className="hidden sm:inline text-xs">{theme}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-60"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 max-h-80 overflow-y-auto p-2 shadow-lg border border-base-300 flex-nowrap"
      >
        {DAISY_THEMES.map((t) => (
          <li key={t}>
            <button
              onClick={() => setTheme(t)}
              className={cn(
                "flex items-center justify-between",
                theme === t && "active"
              )}
            >
              <span className="capitalize">{t}</span>
              {theme === t && <Icon name="check" size={14} />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
