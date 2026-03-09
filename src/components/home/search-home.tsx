"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { DesignerSection } from "./designer-section";
import type { DesignerGroup } from "@/lib/types";
import { displayName } from "@/lib/utils";

type FilterMode = "all" | "user" | "project";

interface SearchHomeProps {
  designerGroups: DesignerGroup[];
  currentDesigner?: string | null;
}

export function SearchHome({ designerGroups, currentDesigner }: SearchHomeProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<FilterMode>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return designerGroups;

    return designerGroups
      .filter((group) => {
        const matchesUser = displayName(group.designer)
          .toLowerCase()
          .includes(q) || group.designer.toLowerCase().includes(q);

        if (mode === "user") return matchesUser;

        const matchingProtos = group.prototypes.filter((entry) => {
          const title =
            entry.type === "local" ? entry.meta.title : entry.title;
          const desc =
            entry.type === "local" ? entry.meta.description : entry.description;
          const tags =
            entry.type === "local" ? entry.meta.tags : entry.tags;
          return (
            title.toLowerCase().includes(q) ||
            desc.toLowerCase().includes(q) ||
            tags?.some((t) => t.toLowerCase().includes(q))
          );
        });

        if (mode === "project") return matchingProtos.length > 0;

        // "all": match user OR any project
        return matchesUser || matchingProtos.length > 0;
      })
      .map((group) => {
        if (mode === "user") return group;

        const q2 = q;
        const matchesUser =
          mode === "all" &&
          (displayName(group.designer).toLowerCase().includes(q2) ||
            group.designer.toLowerCase().includes(q2));

        if (matchesUser) return group;

        // filter down to matching prototypes only
        const matchingProtos = group.prototypes.filter((entry) => {
          const title =
            entry.type === "local" ? entry.meta.title : entry.title;
          const desc =
            entry.type === "local" ? entry.meta.description : entry.description;
          const tags =
            entry.type === "local" ? entry.meta.tags : entry.tags;
          return (
            title.toLowerCase().includes(q2) ||
            desc.toLowerCase().includes(q2) ||
            tags?.some((t) => t.toLowerCase().includes(q2))
          );
        });

        return { ...group, prototypes: matchingProtos };
      });
  }, [query, mode, designerGroups]);

  const sorted = useMemo(() => {
    if (!currentDesigner) return filtered;
    return [...filtered].sort((a, b) => {
      if (a.designer === currentDesigner) return -1;
      if (b.designer === currentDesigner) return 1;
      return 0;
    });
  }, [filtered, currentDesigner]);

  const tabs: { label: string; value: FilterMode }[] = [
    { label: "All", value: "all" },
    { label: "By user", value: "user" },
    { label: "By project", value: "project" },
  ];

  return (
    <>
      <div className="flex items-center gap-3 mb-8">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <Input
            type="search"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-1 bg-base-200 border border-base-300 rounded-md p-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setMode(tab.value)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                mode === tab.value
                  ? "bg-base-100 text-base-content font-medium shadow-sm"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length > 0 ? (
        <div className="space-y-12">
          {sorted.map((group) => (
            <DesignerSection
              key={group.designer}
              group={group}
              isCurrentUser={group.designer === currentDesigner}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-base-content/40">
          <p className="text-lg mb-1">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-sm">Try a different search or filter.</p>
        </div>
      )}
    </>
  );
}
