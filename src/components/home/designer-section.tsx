import type { DesignerGroup } from "@/lib/types";
import { displayName } from "@/lib/utils";
import { PrototypeCard } from "./prototype-card";
import { ExternalLinkCard } from "./external-link-card";

interface DesignerSectionProps {
  group: DesignerGroup;
}

export function DesignerSection({ group }: DesignerSectionProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-text-primary mb-4">
        {displayName(group.designer)}
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
