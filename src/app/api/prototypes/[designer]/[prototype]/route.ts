import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const PROTOTYPES_DIR = path.join(process.cwd(), "prototypes-repo", "src", "prototypes");

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ designer: string; prototype: string }> }
) {
  const { designer, prototype } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { description } = body as { description?: string };

  if (typeof description !== "string") {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  const metaPath = path.join(PROTOTYPES_DIR, designer, prototype, "meta.json");

  if (!fs.existsSync(metaPath)) {
    return NextResponse.json({ error: "Prototype not found" }, { status: 404 });
  }

  let meta: Record<string, unknown>;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  } catch {
    return NextResponse.json({ error: "Failed to read meta.json" }, { status: 500 });
  }

  meta.description = description;

  try {
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  } catch {
    return NextResponse.json({ error: "Failed to write meta.json" }, { status: 500 });
  }

  return NextResponse.json({ success: true, description });
}
