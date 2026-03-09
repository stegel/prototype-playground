import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import dynamic from "next/dynamic";
import { discoverLocalPrototypes } from "@/lib/discovery";
import { PrototypeFrame } from "@/components/layout/prototype-frame";
import type { PrototypeMeta } from "@/lib/types";

interface Props {
  params: Promise<{
    designer: string;
    prototype: string;
  }>;
}

export async function generateStaticParams() {
  const prototypes = discoverLocalPrototypes();
  return prototypes.map((p) => ({
    designer: p.designer,
    prototype: p.slug,
  }));
}

export const dynamicParams = true;

export default async function PrototypePage({ params }: Props) {
  const { designer, prototype: protoSlug } = await params;

  const protoDir = path.join(
    process.cwd(),
    "prototypes-repo",
    "src",
    "prototypes",
    designer,
    protoSlug
  );

  if (!fs.existsSync(protoDir)) {
    notFound();
  }

  const PrototypeComponent = dynamic(
    () => import(`@prototypes/${designer}/${protoSlug}/page`),
    {
      loading: () => (
        <div className="flex items-center justify-center h-64">
          <p className="text-base-content/60">Loading prototype...</p>
        </div>
      ),
    }
  );

  let meta: PrototypeMeta | null = null;
  const metaPath = path.join(protoDir, "meta.json");
  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    } catch {
      /* ignore */
    }
  }

  return (
    <PrototypeFrame meta={meta} designer={designer} slug={protoSlug}>
      <PrototypeComponent />
    </PrototypeFrame>
  );
}
