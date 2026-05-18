import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { automationRules } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  enabled: z.boolean().optional(),
  trigger: z
    .object({
      type: z.enum(["task_moved", "task_completed", "task_created", "task_due_soon"]),
      sectionId: z.string().uuid().optional(),
    })
    .optional(),
  action: z
    .object({
      type: z.enum(["set_due_date", "assign_user", "move_to_section", "set_priority", "notify"]),
      offset: z.number().int().optional(),
      userId: z.string().uuid().optional(),
      sectionId: z.string().uuid().optional(),
    })
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const [updated] = await db
      .update(automationRules)
      .set(parsed)
      .where(eq(automationRules.id, id))
      .returning();

    if (!updated) return apiError("Rule not found", 404);
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
      .delete(automationRules)
      .where(eq(automationRules.id, id))
      .returning();
    if (!deleted) return apiError("Rule not found", 404);
    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}
