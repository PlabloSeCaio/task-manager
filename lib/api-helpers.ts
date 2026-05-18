import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function getCurrentUserId() {
  const session = await auth();
  const userId = session.userId;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function getDbUserId() {
  const clerkId = await getCurrentUserId();
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.externalId, clerkId));
  if (!user) throw new Error("User not found in database");
  return user.id;
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}
