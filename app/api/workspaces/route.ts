import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  getCurrentUserId,
  getDbUserId,
  apiError,
  apiSuccess,
} from "@/lib/api-helpers";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
});

export async function GET() {
  try {
    const dbUserId = await getDbUserId();

    const memberships = await db
      .select({
        workspace: workspaces,
      })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, dbUserId))
      .innerJoin(
        workspaces,
        eq(workspaceMembers.workspaceId, workspaces.id)
      );

    return apiSuccess(memberships.map((m) => m.workspace));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const clerkId = await getCurrentUserId();
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const [workspace] = await db
      .insert(workspaces)
      .values({
        name: parsed.name,
        slug: parsed.slug,
      })
      .returning();

    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: clerkId,
      role: "admin",
    });

    return apiSuccess(workspace, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(error.issues[0].message, 400);
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}
