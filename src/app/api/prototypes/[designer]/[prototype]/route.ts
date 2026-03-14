import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const PROTOTYPES_DIR = path.join(process.cwd(), "prototypes-repo", "src", "prototypes");

async function updateViaGitHub(
  designer: string,
  prototype: string,
  updates: { title: string; description: string; tags: string[] }
): Promise<void> {
  const token  = process.env.GITHUB_TOKEN;
  const repo   = process.env.GITHUB_REPO;   // "stegel/ex-prototypes"
  const branch = process.env.GITHUB_BRANCH ?? "main";

  if (!token || !repo) {
    throw new Error("GITHUB_TOKEN and GITHUB_REPO env vars are required in production");
  }

  const repoFilePath = `src/prototypes/${designer}/${prototype}/meta.json`;
  const apiBase = `https://api.github.com/repos/${repo}/contents/${repoFilePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  // GET current content + SHA
  const getRes = await fetch(`${apiBase}?ref=${branch}`, { headers });
  if (!getRes.ok) throw new Error(`GitHub GET failed: ${getRes.status}`);
  const { sha, content: encoded } = await getRes.json() as { sha: string; content: string };

  // Patch the editable fields
  const meta = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
  meta.title = updates.title;
  meta.description = updates.description;
  meta.tags = updates.tags;
  const updated = JSON.stringify(meta, null, 2) + "\n";

  // PUT updated content
  const putRes = await fetch(apiBase, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `chore: update metadata for ${repoFilePath}`,
      content: Buffer.from(updated).toString("base64"),
      sha,
      branch,
    }),
  });
  if (!putRes.ok) throw new Error(`GitHub PUT failed: ${putRes.status}`);
}

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

  const { title, description, tags } = body as {
    title?: string;
    description?: string;
    tags?: string[];
  };

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

  const updates = {
    title: typeof title === "string" ? title : (meta.title as string) ?? "",
    description,
    tags: Array.isArray(tags) ? tags : (meta.tags as string[]) ?? [],
  };

  try {
    if (process.env.NODE_ENV === "development") {
      meta.title = updates.title;
      meta.description = updates.description;
      meta.tags = updates.tags;
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
      return NextResponse.json({ success: true, mode: "filesystem" });
    } else {
      await updateViaGitHub(designer, prototype, updates);
      return NextResponse.json({ success: true, mode: "github" });
    }
  } catch {
    return NextResponse.json({ error: "Failed to write meta.json" }, { status: 500 });
  }
}
