import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function displayName(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Converts an email address to a folder slug.
 * Example: "aj.siegel@servicenow.com" -> "aj-siegel"
 */
export function emailToFolderSlug(email: string): string {
  // Extract the local part (before @)
  const localPart = email.split("@")[0] || "";
  // Replace dots and underscores with hyphens, lowercase
  return localPart
    .toLowerCase()
    .replace(/[._]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
