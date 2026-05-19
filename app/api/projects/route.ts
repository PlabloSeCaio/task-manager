import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, getDbUserId, getCurrentOrgId, ensureDefaultWorkspace, apiError, apiSuccess } from "@/lib/api-helpers";
import { parseDateString } from "@/lib/utils";

const createSchema = z.object({
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
    const workspaceId = searchParams.get("workspaceId") || (await getCurrentOrgId());
    const archived = searchParams.get("archived");

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
    const dbUserId = await getDbUserId();
    const workspaceId = await getCurrentOrgId();
    await ensureDefaultWorkspace();
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const [project] = await db
      .insert(projects)
      .values({
        workspaceId,
        teamId: parsed.teamId,
        ownerId: dbUserId,
        name: parsed.name,
        description: parsed.description,
        color: parsed.color,
        defaultView: parsed.defaultView,
        privacy: parsed.privacy,
        startOn: parseDateString(parsed.startOn),
        dueOn: parseDateString(parsed.dueOn),
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
    const msg = error instanceof Error ? error.message : "Internal server error";
    return apiError(msg, 500);
  }
}
