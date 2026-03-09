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
    <aside className="w-72 shrink-0">
      <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-3">
        Recently Updated
      </h2>
      <div className="flex flex-col gap-2">
        {prototypes.map((proto) => (
          <div
            key={proto.path}
            className="flex items-start justify-between gap-2 py-2 border-b border-base-300 last:border-0"
          >
            <Link
              href={proto.path}
              className="text-sm text-base-content hover:text-primary transition-colors font-medium leading-snug"
            >
              {proto.title}
            </Link>
            <span className="text-xs text-base-content/40 whitespace-nowrap shrink-0 mt-0.5">
              {timeAgo(proto.updatedAt)}
            </span>
          </div>
        ))}
        {prototypes.length === 0 && (
          <p className="text-sm text-base-content/40">No prototypes yet.</p>
        )}
      </div>
    </aside>
  );
}
