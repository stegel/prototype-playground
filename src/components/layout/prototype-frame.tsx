import Link from "next/link";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import type { PrototypeMeta } from "@/lib/types";
import { displayName, formatDate } from "@/lib/utils";

interface PrototypeFrameProps {
  meta: PrototypeMeta | null;
  designer: string;
  slug: string;
  children: React.ReactNode;
}

export function PrototypeFrame({
  meta,
  designer,
  slug,
  children,
}: PrototypeFrameProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-3 flex items-center gap-4 bg-white">
        <Link
          href="/"
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <Icon name="arrow-left" size={16} />
          <span className="text-sm">Back</span>
        </Link>
        <div className="h-4 w-px bg-border" />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium text-text-primary truncate">
            {meta?.title ?? displayName(slug)}
          </h1>
          <p className="text-xs text-text-tertiary">
            {displayName(designer)}
            {meta?.date && ` · ${formatDate(meta.date)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {meta?.status && (
            <Badge variant={meta.status === "complete" ? "status" : "default"}>
              {meta.status}
            </Badge>
          )}
          {meta?.tags?.map((tag) => (
            <Badge key={tag} variant="subtle">
              {tag}
            </Badge>
          ))}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
