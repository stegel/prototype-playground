import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const PROTOTYPES_DIR = path.join(process.cwd(), "prototypes-repo", "src", "prototypes");

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function toComponentName(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { designer, title, description, tags, status } = body as {
    designer?: string;
    title?: string;
    description?: string;
    tags?: string[];
    status?: string;
  };

  if (!designer || !title) {
    return NextResponse.json(
      { error: "designer and title are required" },
      { status: 400 }
    );
  }

  // Sanitize designer name
  const safeDesigner = designer
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!safeDesigner) {
    return NextResponse.json({ error: "Invalid designer name" }, { status: 400 });
  }

  const slug = toSlug(title);
  if (!slug) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }

  const protoDir = path.join(PROTOTYPES_DIR, safeDesigner, slug);

  if (fs.existsSync(protoDir)) {
    return NextResponse.json(
      { error: `A prototype named "${slug}" already exists for ${safeDesigner}` },
      { status: 409 }
    );
  }

  fs.mkdirSync(protoDir, { recursive: true });

  const today = new Date().toISOString().split("T")[0];
  const meta = {
    title,
    description: description || "",
    author: safeDesigner,
    date: today,
    tags: tags ?? [],
    status: status || "in-progress",
  };

  fs.writeFileSync(
    path.join(protoDir, "meta.json"),
    JSON.stringify(meta, null, 2)
  );

  const componentName = toComponentName(title) || "MyPrototype";
  const pageContent = `"use client";

import { Card } from "@/components/ui";

export default function ${componentName}() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200 p-8">
      <Card className="max-w-md w-full p-8 text-center">
        <h2 className="text-xl font-semibold text-base-content mb-4">
          ${title}
        </h2>
        <p className="text-base-content/60 text-sm">
          ${description || "Start building your prototype here."}
        </p>
      </Card>
    </div>
  );
}
`;

  fs.writeFileSync(path.join(protoDir, "page.tsx"), pageContent);

  return NextResponse.json({
    success: true,
    path: `/prototypes/${safeDesigner}/${slug}`,
    designer: safeDesigner,
    slug,
  });
}
