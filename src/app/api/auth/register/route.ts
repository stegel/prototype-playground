import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getRedis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }

  const { name, email, password } = (await req.json()) as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const existing = await redis.get(`user:credentials:${email}`);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();

  await redis.set(`user:credentials:${email}`, {
    id,
    name,
    email,
    hashedPassword,
  });

  return NextResponse.json({ success: true });
}
