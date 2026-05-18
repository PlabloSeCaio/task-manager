import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { projects, workspaces, workspaceMembers } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

const createSchema = z.object({
  workspaceId: z.string().uuid(),
  teamId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().optional(),
  defaultView: z.enum(["list", "board", "calendar", "timeline"]).optional(),
  privacy: z.enum(["public", "private_to_team", "private"]).optional(),
  startOn: z.string().datetime().optional(),
  dueOn: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await getCurrentUserId();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const archived = searchParams.get("archived");

    if (!workspaceId) {
      return apiError("workspaceId is required");
    }

    const conditions = [eq(projects.workspaceId, workspaceId)];
    if (archived === "true") {
      conditions.push(eq(projects.archived, true));
    } else {
      conditions.push(eq(projects.archived, false));
    }

    const allProjects = await db
      .select()
      .from(projects)
      .where(and(...conditions))
      .orderBy(projects.createdAt);

    return apiSuccess(allProjects);
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
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, parsed.workspaceId));

    if (!workspace) {
      return apiError("Workspace not found", 404);
    }

    const [member] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, parsed.workspaceId),
          eq(workspaceMembers.userId, clerkId)
        )
      );

    if (!member) {
      return apiError("Not a member of this workspace", 403);
    }

    const [project] = await db
      .insert(projects)
      .values({
        workspaceId: parsed.workspaceId,
        teamId: parsed.teamId,
        ownerId: clerkId,
        name: parsed.name,
        description: parsed.description,
        color: parsed.color,
        defaultView: parsed.defaultView,
        privacy: parsed.privacy,
        startOn: parsed.startOn ? new Date(parsed.startOn) : null,
        dueOn: parsed.dueOn ? new Date(parsed.dueOn) : null,
      })
      .returning();

    return apiSuccess(project, 201);
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
