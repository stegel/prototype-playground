import type { DesignerGroup } from "@/lib/types";
import { displayName } from "@/lib/utils";
import { PrototypeCard } from "./prototype-card";
import { ExternalLinkCard } from "./external-link-card";

interface DesignerSectionProps {
  group: DesignerGroup;
  isCurrentUser?: boolean;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
