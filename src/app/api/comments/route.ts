import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

interface Comment {
  id: string;
  x: number;
  y: number;
  text: string;
  createdAt: string;
  resolved: boolean;
}

function getRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    return null;
  }
  return new Redis({ url, token });
}

function key(designer: string, slug: string) {
  return `comments:${designer}:${slug}`;
}

export async function GET(req: NextRequest) {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json([]);
  }

  const { searchParams } = req.nextUrl;
  const designer = searchParams.get("designer");
  const slug = searchParams.get("slug");

  if (!designer || !slug) {
    return NextResponse.json({ error: "designer and slug required" }, { status: 400 });
  }

  const comments = (await redis.get<Comment[]>(key(designer, slug))) ?? [];
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { designer, slug, comment } = (await req.json()) as {
    designer: string;
    slug: string;
    comment: Comment;
  };

  if (!designer || !slug || !comment) {
    return NextResponse.json({ error: "designer, slug, and comment required" }, { status: 400 });
  }

  const k = key(designer, slug);
  const comments = (await redis.get<Comment[]>(k)) ?? [];
  comments.push(comment);
  await redis.set(k, comments);

  return NextResponse.json(comment, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { designer, slug, id } = (await req.json()) as {
    designer: string;
    slug: string;
    id: string;
  };

  const k = key(designer, slug);
  const comments = (await redis.get<Comment[]>(k)) ?? [];
  const updated = comments.map((c) =>
    c.id === id ? { ...c, resolved: !c.resolved } : c
  );
  await redis.set(k, updated);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { designer, slug, id } = (await req.json()) as {
    designer: string;
    slug: string;
    id: string;
  };

  const k = key(designer, slug);
  const comments = (await redis.get<Comment[]>(k)) ?? [];
  const filtered = comments.filter((c) => c.id !== id);
  await redis.set(k, filtered);

  return NextResponse.json({ ok: true });
}
