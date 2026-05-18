import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;

    const [original] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));

    if (!original) return apiError("Task not found", 404);

    const [duplicate] = await db
      .insert(tasks)
      .values({
        workspaceId: original.workspaceId,
        projectId: original.projectId,
        sectionId: original.sectionId,
        parentId: original.parentId,
        assigneeId: original.assigneeId,
        createdById: original.createdById,
        name: `${original.name} (copy)`,
        notes: original.notes,
        htmlNotes: original.htmlNotes,
        subtype: original.subtype,
        startOn: original.startOn,
        dueOn: original.dueOn,
      })
      .returning();

    return apiSuccess(duplicate, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}
