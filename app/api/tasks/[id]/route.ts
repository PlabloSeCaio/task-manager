import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { runAutomations } from "@/lib/automation-engine";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

const updateSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  notes: z.string().optional(),
  htmlNotes: z.string().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  sectionId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  completed: z.boolean().optional(),
  subtype: z.enum(["default", "milestone", "approval"]).optional(),
  approvalStatus: z
    .enum(["pending", "approved", "rejected", "changes_requested"])
    .nullable()
    .optional(),
  startOn: z.string().datetime().nullable().optional(),
  dueOn: z.string().datetime().nullable().optional(),
  position: z.number().int().optional(),
  liked: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;

    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));

    if (!task) {
      return apiError("Task not found", 404);
    }

    return apiSuccess(task);
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

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.notes !== undefined) updateData.notes = parsed.notes;
    if (parsed.htmlNotes !== undefined) updateData.htmlNotes = parsed.htmlNotes;
    if (parsed.assigneeId !== undefined) updateData.assigneeId = parsed.assigneeId;
    if (parsed.sectionId !== undefined) updateData.sectionId = parsed.sectionId;
    if (parsed.projectId !== undefined) updateData.projectId = parsed.projectId;
    if (parsed.parentId !== undefined) updateData.parentId = parsed.parentId;
    if (parsed.subtype !== undefined) updateData.subtype = parsed.subtype;
    if (parsed.approvalStatus !== undefined)
      updateData.approvalStatus = parsed.approvalStatus;
    if (parsed.position !== undefined) updateData.position = parsed.position;
    if (parsed.liked !== undefined) updateData.liked = parsed.liked;
    if (parsed.startOn !== undefined)
      updateData.startOn = parsed.startOn ? new Date(parsed.startOn) : null;
    if (parsed.dueOn !== undefined)
      updateData.dueOn = parsed.dueOn ? new Date(parsed.dueOn) : null;
    if (parsed.completed !== undefined) {
      updateData.completed = parsed.completed;
      updateData.completedAt = parsed.completed ? new Date() : null;
    }
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    if (!updated) {
      return apiError("Task not found", 404);
    }

    runAutomations(id, parsed).catch(console.error);

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
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();

    if (!deleted) {
      return apiError("Task not found", 404);
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}
