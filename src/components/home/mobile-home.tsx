"use client";

import Link from "next/link";
import type { RecentPrototype } from "@/lib/discovery";
import type { DesignerGroup } from "@/lib/types";
import { displayName, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icons";

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
        <ul className="divide-y divide-base-300">
          {recentPrototypes.map((proto) => (
            <li key={proto.path} className="flex items-center gap-2 py-3">
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
            <li className="text-sm text-base-content/40 py-3">No recent updates.</li>
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
              <h3 className="text-base font-semibold text-base-content mb-3 flex items-center gap-2">
                {displayName(group.designer)}
                {group.designer === currentDesigner && (
                  <span className="badge badge-sm badge-primary">You</span>
                )}
              </h3>
              <div className="space-y-3">
                {group.prototypes.map((entry) => {
                  const title = entry.type === "local" ? entry.meta.title : entry.title;
                  const path = entry.type === "local" ? entry.path : entry.url;
                  const isExternal = entry.type === "external";
                  const description = entry.type === "local" ? entry.meta.description : entry.description;
                  const tags = entry.type === "local" ? entry.meta.tags : entry.tags;
                  const status = entry.type === "local" ? entry.meta.status : undefined;
                  const date = entry.type === "local" ? entry.meta.date : entry.date;

                  return (
                    <div
                      key={path}
                      className="rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm"
                    >
                      {isExternal ? (
                        <a
                          href={path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-sm font-semibold text-base-content hover:text-primary transition-colors flex-1">
                              {title}
                            </h4>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge variant="default" className="text-xs">
                                {entry.platform}
                              </Badge>
                              <svg
                                className="w-3.5 h-3.5 text-base-content/40"
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
                            </div>
                          </div>
                          {description && (
                            <p className="text-xs text-base-content/60 line-clamp-2 mb-3">
                              {description}
                            </p>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-1">
                              {tags?.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="subtle" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <span className="text-xs text-base-content/40 flex items-center gap-1">
                              <Icon name="calendar" size={10} />
                              {formatDate(date)}
                            </span>
                          </div>
                        </a>
                      ) : (
                        <Link href={path} className="block">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-sm font-semibold text-base-content hover:text-primary transition-colors flex-1">
                              {title}
                            </h4>
                            {status && (
                              <Badge
                                variant={status === "complete" ? "status" : "default"}
                                className="text-xs shrink-0"
                              >
                                {status === "complete" ? (
                                  <span className="flex items-center gap-1">
                                    <Icon name="check" size={10} />
                                    Done
                                  </span>
                                ) : status === "archived" ? (
                                  "Archived"
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Icon name="clock" size={10} />
                                    WIP
                                  </span>
                                )}
                              </Badge>
                            )}
                          </div>
                          {description && (
                            <p className="text-xs text-base-content/60 line-clamp-2 mb-3">
                              {description}
                            </p>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-1">
                              {tags?.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="subtle" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <span className="text-xs text-base-content/40 flex items-center gap-1">
                              <Icon name="calendar" size={10} />
                              {formatDate(date)}
                            </span>
                          </div>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
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
