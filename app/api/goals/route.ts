import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

const createSchema = z.object({
  workspaceId: z.string().uuid(),
  ownerId: z.string().uuid().optional(),
  parentGoalId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  startOn: z.string().datetime().optional(),
  dueOn: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await getCurrentUserId();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) return apiError("workspaceId is required");

    const all = await db
      .select()
      .from(goals)
      .where(eq(goals.workspaceId, workspaceId))
      .orderBy(goals.createdAt);

    return apiSuccess(all);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await getCurrentUserId();
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const [goal] = await db
      .insert(goals)
      .values({
        workspaceId: parsed.workspaceId,
        ownerId: parsed.ownerId,
        parentGoalId: parsed.parentGoalId,
        name: parsed.name,
        description: parsed.description,
        startOn: parsed.startOn ? new Date(parsed.startOn) : null,
        dueOn: parsed.dueOn ? new Date(parsed.dueOn) : null,
      })
      .returning();

    return apiSuccess(goal, 201);
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

