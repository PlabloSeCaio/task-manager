import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";
import { parseDateString } from "@/lib/utils";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  defaultView: z.enum(["list", "board", "calendar", "timeline"]).nullable().optional(),
  privacy: z.enum(["public", "private_to_team", "private"]).nullable().optional(),
  archived: z.boolean().optional(),
  isStarred: z.boolean().optional(),
  startOn: z.string().datetime().nullable().optional(),
  dueOn: z.string().datetime().nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!project) {
      return apiError("Project not found", 404);
    }

    return apiSuccess(project);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const [existing] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!existing) {
      return apiError("Project not found", 404);
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.color !== undefined) updateData.color = parsed.color;
    if (parsed.icon !== undefined) updateData.icon = parsed.icon;
    if (parsed.defaultView !== undefined) updateData.defaultView = parsed.defaultView;
    if (parsed.privacy !== undefined) updateData.privacy = parsed.privacy;
    if (parsed.archived !== undefined) updateData.archived = parsed.archived;
    if (parsed.isStarred !== undefined) updateData.is_starred = parsed.isStarred;
    if (parsed.startOn !== undefined) updateData.startOn = parseDateString(parsed.startOn);
    if (parsed.dueOn !== undefined) updateData.dueOn = parseDateString(parsed.dueOn);
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();

    if (!updated) {
      return apiError("Project not found", 404);
    }

    return apiSuccess(updated);
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;

    const [deleted] = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();

    if (!deleted) {
      return apiError("Project not found", 404);
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}
