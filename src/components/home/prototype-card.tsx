import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icons";
import type { Prototype } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface PrototypeCardProps {
  prototype: Prototype;
}

export function PrototypeCard({ prototype }: PrototypeCardProps) {
  const { meta, path } = prototype;

  return (
    <Link href={path} className="group block">
      <Card className="p-5 transition-shadow hover:shadow-card-hover">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
            {meta.title}
          </h3>
          {meta.status && (
            <Badge
              variant={meta.status === "complete" ? "status" : "default"}
              className="shrink-0"
            >
              {meta.status === "complete" ? (
                <span className="flex items-center gap-1">
                  <Icon name="check" size={12} />
                  Done
                </span>
              ) : meta.status === "archived" ? (
                "Archived"
              ) : (
                <span className="flex items-center gap-1">
                  <Icon name="clock" size={12} />
                  WIP
                </span>
              )}
            </Badge>
          )}
        </div>
        <p className="text-sm text-text-secondary line-clamp-2 mb-4">
          {meta.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {meta.tags?.map((tag) => (
              <Badge key={tag} variant="subtle">
                {tag}
              </Badge>
            ))}
          </div>
          <span className="text-xs text-text-tertiary flex items-center gap-1">
            <Icon name="calendar" size={12} />
            {formatDate(meta.date)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
