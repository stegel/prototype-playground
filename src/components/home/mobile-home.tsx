"use client";

import Link from "next/link";
import type { RecentPrototype } from "@/lib/discovery";
import type { DesignerGroup } from "@/lib/types";
import { displayName } from "@/lib/utils";

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

interface MobileHomeProps {
  recentPrototypes: RecentPrototype[];
  designerGroups: DesignerGroup[];
  currentDesigner?: string | null;
}

export function MobileHome({ recentPrototypes, designerGroups, currentDesigner }: MobileHomeProps) {
  // Sort designer groups to put current user first
  const sortedGroups = currentDesigner
    ? [...designerGroups].sort((a, b) => {
        if (a.designer === currentDesigner) return -1;
        if (b.designer === currentDesigner) return 1;
        return 0;
      })
    : designerGroups;

  return (
    <div className="md:hidden">
      {/* Recent Updates Section */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-3">
          Recent Updates
        </h2>
        <ul className="space-y-1">
          {recentPrototypes.map((proto) => (
            <li key={proto.path} className="flex items-center gap-2">
              <span className="text-base-content/40">•</span>
              <Link
                href={proto.path}
                className="text-sm text-base-content hover:text-primary transition-colors flex-1 truncate"
              >
                {proto.title}
              </Link>
              <span className="text-xs text-base-content/40 shrink-0">
                {timeAgo(proto.updatedAt)}
              </span>
            </li>
          ))}
          {recentPrototypes.length === 0 && (
            <li className="text-sm text-base-content/40">No recent updates.</li>
          )}
        </ul>
      </section>

      {/* Prototypes by User Section */}
      <section>
        <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-4">
          By Designer
        </h2>
        <div className="space-y-6">
          {sortedGroups.map((group) => (
            <div key={group.designer}>
              <h3 className="text-base font-semibold text-base-content mb-2 flex items-center gap-2">
                {displayName(group.designer)}
                {group.designer === currentDesigner && (
                  <span className="badge badge-sm badge-primary">You</span>
                )}
              </h3>
              <ul className="space-y-1 pl-1">
                {group.prototypes.map((entry) => {
                  const title = entry.type === "local" ? entry.meta.title : entry.title;
                  const path = entry.type === "local" ? entry.path : entry.url;
                  const isExternal = entry.type === "external";

                  return (
                    <li key={path}>
                      {isExternal ? (
                        <a
                          href={path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md hover:bg-base-200 transition-colors"
                        >
                          <span className="text-sm text-base-content truncate flex-1">
                            {title}
                          </span>
                          <span className="text-xs text-base-content/40 shrink-0">
                            {entry.platform}
                          </span>
                          <svg
                            className="w-3 h-3 text-base-content/40 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      ) : (
                        <Link
                          href={path}
                          className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md hover:bg-base-200 transition-colors"
                        >
                          <span className="text-sm text-base-content truncate flex-1">
                            {title}
                          </span>
                          {entry.meta.status && (
                            <span
                              className={`text-xs shrink-0 ${
                                entry.meta.status === "complete"
                                  ? "text-success"
                                  : entry.meta.status === "archived"
                                  ? "text-base-content/40"
                                  : "text-warning"
                              }`}
                            >
                              {entry.meta.status === "complete"
                                ? "✓"
                                : entry.meta.status === "archived"
                                ? "archived"
                                : "WIP"}
                            </span>
                          )}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {sortedGroups.length === 0 && (
            <p className="text-sm text-base-content/40">No prototypes yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
