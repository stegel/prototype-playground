import Link from "next/link";
import type { RecentPrototype } from "@/lib/discovery";

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  return `${Math.floor(months / 12)}y ago`;
}

interface RecentFeedProps {
  prototypes: RecentPrototype[];
}

export function RecentFeed({ prototypes }: RecentFeedProps) {
  return (
    <aside>
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
        Recently Updated
      </h2>

      {/* Mobile: simple bullet list */}
      <ul className="md:hidden space-y-1 list-none">
        {prototypes.map((proto) => (
          <li key={proto.path} className="flex items-center gap-2">
            <span className="text-text-tertiary text-xs">•</span>
            <Link
              href={proto.path}
              className="text-sm text-text-primary hover:text-accent transition-colors"
            >
              {proto.title}
            </Link>
          </li>
        ))}
        {prototypes.length === 0 && (
          <li className="text-sm text-text-tertiary">No prototypes yet.</li>
        )}
      </ul>

      {/* Desktop: bordered list with timestamps */}
      <div className="hidden md:flex flex-col gap-2">
        {prototypes.map((proto) => (
          <div
            key={proto.path}
            className="flex items-start justify-between gap-2 py-2 border-b border-border last:border-0"
          >
            <Link
              href={proto.path}
              className="text-sm text-text-primary hover:text-accent transition-colors font-medium leading-snug"
            >
              {proto.title}
            </Link>
            <span className="text-xs text-text-tertiary whitespace-nowrap shrink-0 mt-0.5">
              {timeAgo(proto.updatedAt)}
            </span>
          </div>
        ))}
        {prototypes.length === 0 && (
          <p className="text-sm text-text-tertiary">No prototypes yet.</p>
        )}
      </div>
    </aside>
  );
}
