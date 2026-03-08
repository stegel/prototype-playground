import Link from "next/link";
import type { DesignerGroup, PrototypeEntry } from "@/lib/types";
import { displayName } from "@/lib/utils";
import { PrototypeCard } from "./prototype-card";
import { ExternalLinkCard } from "./external-link-card";

interface DesignerSectionProps {
  group: DesignerGroup;
  isCurrentUser?: boolean;
}

function MobilePrototypeRow({ entry }: { entry: PrototypeEntry }) {
  const title = entry.type === "local" ? entry.meta.title : entry.title;
  const isExternal = entry.type === "external";

  const inner = (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-text-primary truncate">{title}</span>
      {isExternal && (
        <span className="text-xs text-text-tertiary shrink-0">↗</span>
      )}
    </div>
  );

  if (entry.type === "local") {
    return (
      <Link href={entry.path} className="block hover:text-accent transition-colors">
        {inner}
      </Link>
    );
  }
  return (
    <a href={entry.url} target="_blank" rel="noopener noreferrer" className="block hover:text-accent transition-colors">
      {inner}
    </a>
  );
}

export function DesignerSection({ group, isCurrentUser }: DesignerSectionProps) {
  return (
    <section
      className={
        isCurrentUser
          ? "bg-accent-light/30 -mx-4 px-4 py-4 rounded-xl border border-accent/20"
          : undefined
      }
    >
      <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        {displayName(group.designer)}
        {isCurrentUser && (
          <span className="badge badge-sm badge-primary">You</span>
        )}
      </h2>

      {/* Mobile: single-line rows */}
      <div className="md:hidden">
        {group.prototypes.map((entry) => (
          <MobilePrototypeRow
            key={entry.type === "local" ? entry.path : entry.url}
            entry={entry}
          />
        ))}
      </div>

      {/* Desktop: card grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
        {group.prototypes.map((entry) => {
          if (entry.type === "local") {
            return (
              <PrototypeCard
                key={entry.path}
                prototype={entry}
              />
            );
          }
          return (
            <ExternalLinkCard
              key={entry.url}
              prototype={entry}
            />
          );
        })}
      </div>
    </section>
  );
}
