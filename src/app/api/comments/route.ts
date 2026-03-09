import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { auth } from "@/lib/auth";

interface CommentAuthor {
  name: string | null;
  image: string | null;
}

interface Reply {
  id: string;
  text: string;
  createdAt: string;
  author?: CommentAuthor;
}

interface Comment {
  id: string;
  x: number;
  y: number;
  text: string;
  createdAt: string;
  resolved: boolean;
  author?: CommentAuthor;
  replies?: Reply[];
}

function key(designer: string, slug: string) {
  return `comments:${designer}:${slug}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json([]);
  }

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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { designer, slug, comment, parentId } = (await req.json()) as {
    designer: string;
    slug: string;
    comment: Comment | Reply;
    parentId?: string;
  };

  if (!designer || !slug || !comment) {
    return NextResponse.json({ error: "designer, slug, and comment required" }, { status: 400 });
  }

  const author: CommentAuthor = {
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  };

  const k = key(designer, slug);
  const comments = (await redis.get<Comment[]>(k)) ?? [];

  if (parentId) {
    // Adding a reply to an existing comment
    const reply: Reply = { ...(comment as Reply), author };
    const updated = comments.map((c) =>
      c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c
    );
    await redis.set(k, updated);
    return NextResponse.json(reply, { status: 201 });
  }

  // Adding a new top-level comment
  const commentWithAuthor: Comment = { ...(comment as Comment), author };
  comments.push(commentWithAuthor);
  await redis.set(k, comments);

  return NextResponse.json(commentWithAuthor, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { designer, slug, id, parentId } = (await req.json()) as {
    designer: string;
    slug: string;
    id: string;
    parentId?: string;
  };

  const k = key(designer, slug);
  const comments = (await redis.get<Comment[]>(k)) ?? [];

  if (parentId) {
    // Deleting a reply
    const updated = comments.map((c) =>
      c.id === parentId ? { ...c, replies: (c.replies ?? []).filter((r) => r.id !== id) } : c
    );
    await redis.set(k, updated);
    return NextResponse.json({ ok: true });
  }

  const filtered = comments.filter((c) => c.id !== id);
  await redis.set(k, filtered);

  return NextResponse.json({ ok: true });
}
