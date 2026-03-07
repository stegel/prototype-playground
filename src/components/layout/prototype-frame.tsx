import { CommentLayer } from "./comment-layer";
import type { PrototypeMeta } from "@/lib/types";

interface PrototypeFrameProps {
  meta: PrototypeMeta | null;
  designer: string;
  slug: string;
  children: React.ReactNode;
}

export function PrototypeFrame({ meta, designer, slug, children }: PrototypeFrameProps) {
  return (
    <CommentLayer meta={meta} designer={designer} slug={slug}>
      {children}
    </CommentLayer>
  );
}
