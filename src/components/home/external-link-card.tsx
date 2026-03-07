import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/icons";
import type { ExternalPrototype } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface ExternalLinkCardProps {
  prototype: ExternalPrototype;
}

const platformIcons: Record<ExternalPrototype["platform"], IconName> = {
  figma: "figma",
  v0: "code",
  codepen: "code",
  codesandbox: "code",
  other: "globe",
};

const platformLabels: Record<ExternalPrototype["platform"], string> = {
  figma: "Figma",
  v0: "V0",
  codepen: "CodePen",
  codesandbox: "CodeSandbox",
  other: "External",
};

export function ExternalLinkCard({ prototype }: ExternalLinkCardProps) {
  return (
    <a
      href={prototype.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <Card className="p-5 transition-shadow hover:shadow-card-hover border-dashed">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
            {prototype.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="default" className="flex items-center gap-1">
              <Icon
                name={platformIcons[prototype.platform]}
                size={12}
              />
              {platformLabels[prototype.platform]}
            </Badge>
            <Icon
              name="external-link"
              size={14}
              className="text-text-tertiary group-hover:text-accent transition-colors"
            />
          </div>
        </div>
        <p className="text-sm text-text-secondary line-clamp-2 mb-4">
          {prototype.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {prototype.tags?.map((tag) => (
              <Badge key={tag} variant="subtle">
                {tag}
              </Badge>
            ))}
          </div>
          <span className="text-xs text-text-tertiary flex items-center gap-1">
            <Icon name="calendar" size={12} />
            {formatDate(prototype.date)}
          </span>
        </div>
      </Card>
    </a>
  );
}
