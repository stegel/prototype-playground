import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { auth } from "@/lib/auth";
import { getRedis } from "@/lib/redis";

const PROTOTYPES_DIR = path.join(process.cwd(), "src", "prototypes");

interface UserMapping {
  designerFolder: string;
  email: string;
  name: string;
}

interface FolderClaim {
  userId: string;
  email: string;
  claimedAt: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redis = getRedis();

  // Get all designer folders from filesystem
  const allFolders: string[] = [];
  if (fs.existsSync(PROTOTYPES_DIR)) {
    const entries = fs.readdirSync(PROTOTYPES_DIR, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith("_")) {
        allFolders.push(e.name);
      }
    }
  }

  // Get current user's mapping
  let currentFolder: string | null = null;
  if (redis) {
    const mapping = await redis.get<UserMapping>(
      `user:mapping:${session.user.id}`
    );
    currentFolder = mapping?.designerFolder ?? null;
  }

  // Determine which folders are claimed
  const unclaimed: string[] = [];
  if (redis) {
    for (const folder of allFolders) {
      const claim = await redis.get<FolderClaim>(`folder:claim:${folder}`);
      if (!claim) {
        unclaimed.push(folder);
      }
    }
  } else {
    unclaimed.push(...allFolders);
  }

  return NextResponse.json({
    currentFolder,
    unclaimed,
    allFolders,
  });
  return NextResponse.json({ currentFolder, unclaimed, allFolders });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }

  const { folder } = (await req.json()) as { folder?: string };
  if (!folder) {
    return NextResponse.json(
      { error: "folder is required" },
      { status: 400 }
    );
  }

  // Verify folder exists on filesystem
  const folderPath = path.join(PROTOTYPES_DIR, folder);
  if (!fs.existsSync(folderPath)) {
    return NextResponse.json(
      { error: "Folder does not exist" },
      { status: 404 }
    );
  }

  // Check user doesn't already have a folder
  const existingMapping = await redis.get<UserMapping>(
    `user:mapping:${session.user.id}`
  );
  if (existingMapping?.designerFolder) {
    return NextResponse.json(
      { error: "You already have a claimed folder" },
      { status: 409 }
    );
  }

  // Check folder isn't already claimed (atomic check)
  const existingClaim = await redis.get<FolderClaim>(
    `folder:claim:${folder}`
  );
  if (existingClaim) {
    return NextResponse.json(
      { error: "This folder is already claimed" },
      { status: 409 }
    );
  }

  // Set both mappings
  await redis.set(`folder:claim:${folder}`, {
    userId: session.user.id,
    email: session.user.email || "",
    claimedAt: new Date().toISOString(),
  } satisfies FolderClaim);

  await redis.set(`user:mapping:${session.user.id}`, {
    designerFolder: folder,
    email: session.user.email || "",
    name: session.user.name || "",
  } satisfies UserMapping);

  return NextResponse.json({ success: true, folder });
}
