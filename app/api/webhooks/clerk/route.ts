import { NextRequest } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { users, workspaces, workspaceMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;
const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000000";

async function getDbUserId(clerkUserId: string): Promise<string | null> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.externalId, clerkUserId));
  return existing?.id || null;
}

async function ensureUser(clerkUserId: string, email: string, name: string, imageUrl?: string): Promise<string> {
  const existingId = await getDbUserId(clerkUserId);
  if (existingId) return existingId;

  const [created] = await db
    .insert(users)
    .values({
      externalId: clerkUserId,
      email,
      name,
      avatarUrl: imageUrl || null,
    })
    .onConflictDoNothing()
    .returning({ id: users.id });

  if (created) return created.id;

  const retry = await getDbUserId(clerkUserId);
  if (retry) return retry;

  throw new Error("Failed to create user");
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  const wh = new Webhook(webhookSecret);
  let event: { type: string; data: Record<string, unknown> };

  try {
    event = wh.verify(payload, headers) as typeof event;
  } catch {
    return new Response("Invalid webhook signature", { status: 401 });
  }

  switch (event.type) {
    // ─── User Events ─────────────────────────────────────
    case "user.created": {
      const { id, email_addresses, first_name, last_name, image_url } = event.data;
      const email =
        (email_addresses as Array<{ email_address: string }>)?.[0]
          ?.email_address || `${id}@placeholder.dev`;
      const name = [first_name, last_name].filter(Boolean).join(" ") || email.split("@")[0] || "Unnamed";

      const [user] = await db
        .insert(users)
        .values({
          externalId: id as string,
          email,
          name,
          avatarUrl: (image_url as string) || null,
        })
        .onConflictDoNothing()
        .returning();

      if (user) {
        await db
          .insert(workspaceMembers)
          .values({
            workspaceId: DEFAULT_WORKSPACE_ID,
            userId: user.id,
            role: "admin",
          })
          .onConflictDoNothing();
      }

      break;
    }

    case "user.updated": {
      const { id, email_addresses } = event.data;
      const email =
        (email_addresses as Array<{ email_address: string }>)?.[0]
          ?.email_address || undefined;

      const updateData: Record<string, unknown> = {};
      if (email) updateData.email = email;

      if (Object.keys(updateData).length > 0) {
        await db
          .update(users)
          .set(updateData)
          .where(eq(users.externalId, id as string));
      }
      break;
    }

    case "user.deleted": {
      const { id } = event.data;
      await db.delete(users).where(eq(users.externalId, id as string));
      break;
    }

    // ─── Organization Events ──────────────────────────────
    case "organization.created": {
      const { id, name, slug, image_url } = event.data;

      await db
        .insert(workspaces)
        .values({
          clerkOrganizationId: id as string,
          name: name as string,
          slug: slug as string,
          logoUrl: (image_url as string) || null,
        })
        .onConflictDoNothing();

      break;
    }

    case "organization.updated": {
      const { id, name, slug, image_url } = event.data;

      await db
        .update(workspaces)
        .set({
          name: name as string,
          slug: slug as string,
          logoUrl: (image_url as string) || null,
        })
        .where(eq(workspaces.clerkOrganizationId, id as string));

      break;
    }

    case "organization.deleted": {
      const { id } = event.data;

      const [ws] = await db
        .select({ wsId: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.clerkOrganizationId, id as string));

      if (ws && ws.wsId !== DEFAULT_WORKSPACE_ID) {
        await db.delete(workspaces).where(eq(workspaces.id, ws.wsId));
      }

      break;
    }

    // ─── Organization Membership Events ──────────────────
    case "organizationMembership.created": {
      const membershipData = event.data as Record<string, unknown>;
      const orgData = membershipData.organization as Record<string, unknown> | undefined;
      const userData = membershipData.public_user_data as Record<string, unknown> | undefined;

      if (!orgData || !userData) break;

      const clerkOrgId = orgData.id as string;
      const clerkUserId = userData.user_id as string;

      const [ws] = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.clerkOrganizationId, clerkOrgId));

      if (!ws) break;

      const dbUserId = await getDbUserId(clerkUserId);
      if (!dbUserId) break;

      await db
        .insert(workspaceMembers)
        .values({
          workspaceId: ws.id,
          userId: dbUserId,
          role: "editor",
        })
        .onConflictDoNothing();

      break;
    }

    case "organizationMembership.deleted": {
      const membershipData = event.data as Record<string, unknown>;
      const orgData = membershipData.organization as Record<string, unknown> | undefined;
      const userData = membershipData.public_user_data as Record<string, unknown> | undefined;

      if (!orgData || !userData) break;

      const clerkOrgId = orgData.id as string;
      const clerkUserId = userData.user_id as string;

      const [ws] = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.clerkOrganizationId, clerkOrgId));

      if (!ws) break;

      const dbUserId = await getDbUserId(clerkUserId);
      if (!dbUserId) break;

      await db
        .delete(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, ws.id),
            eq(workspaceMembers.userId, dbUserId)
          )
        );

      break;
    }

    case "organizationMembership.updated": {
      const membershipData = event.data as Record<string, unknown>;
      const orgData = membershipData.organization as Record<string, unknown> | undefined;
      const userData = membershipData.public_user_data as Record<string, unknown> | undefined;

      if (!orgData || !userData) break;

      const clerkOrgId = orgData.id as string;
      const clerkUserId = userData.user_id as string;
      const role = membershipData.role as string || "editor";

      const [ws] = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.clerkOrganizationId, clerkOrgId));

      if (!ws) break;

      const dbUserId = await getDbUserId(clerkUserId);
      if (!dbUserId) break;

      await db
        .update(workspaceMembers)
        .set({ role: role as "admin" | "editor" | "commenter" | "viewer" })
        .where(
          and(
            eq(workspaceMembers.workspaceId, ws.id),
            eq(workspaceMembers.userId, dbUserId)
          )
        );

      break;
    }
  }

  return new Response("OK", { status: 200 });
}
