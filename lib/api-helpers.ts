import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, workspaces, workspaceMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000000";

export async function getCurrentUserId() {
  const session = await auth();
  const userId = session.userId;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function getDbUserId() {
  const clerkId = await getCurrentUserId();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.externalId, clerkId));
  if (existing) return existing.id;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkId);
  const email = clerkUser.emailAddresses?.[0]?.emailAddress || `${clerkId}@placeholder.dev`;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User";

  const [created] = await db
    .insert(users)
    .values({
      externalId: clerkId,
      email,
      name,
      avatarUrl: clerkUser.imageUrl || null,
    })
    .returning({ id: users.id });

  await db
    .insert(workspaceMembers)
    .values({
      workspaceId: DEFAULT_WORKSPACE_ID,
      userId: created.id,
      role: "admin",
    })
    .onConflictDoNothing();

  return created.id;
}

export async function ensureDefaultWorkspace() {
  const [existing] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.id, DEFAULT_WORKSPACE_ID));
  if (!existing) {
    await db.insert(workspaces).values({
      id: DEFAULT_WORKSPACE_ID,
      name: "My Workspace",
      slug: "my-workspace",
    });
  }
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}
