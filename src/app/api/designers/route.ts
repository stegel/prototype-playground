import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const PROTOTYPES_DIR = path.join(process.cwd(), "prototypes-repo", "src", "prototypes");

export async function GET() {
  if (!fs.existsSync(PROTOTYPES_DIR)) {
    return NextResponse.json({ designers: [] });
  }

  const entries = fs.readdirSync(PROTOTYPES_DIR, { withFileTypes: true });
  const designers = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .map((e) => e.name)
    .sort();

  return NextResponse.json({ designers });
}
