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
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email.split("@")[0] || "Unnamed";

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

/**
 * Resolve the active organization's workspace ID from the Clerk session.
 * Falls back to DEFAULT_WORKSPACE_ID if no org is selected (backward compat).
 */
export async function getCurrentOrgId(): Promise<string> {
  const session = await auth();
  const orgId = session.orgId;

  if (orgId) {
    const [ws] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.clerkOrganizationId, orgId));

    if (ws) return ws.id;
  }

  return DEFAULT_WORKSPACE_ID;
}

export async function getCurrentOrgClerkId(): Promise<string | null> {
  const session = await auth();
  return session.orgId || null;
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
