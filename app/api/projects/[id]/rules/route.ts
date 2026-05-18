import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { automationRules } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  trigger: z.object({
    type: z.enum(["task_moved", "task_completed", "task_created", "task_due_soon"]),
    sectionId: z.string().uuid().optional(),
  }),
  action: z.object({
    type: z.enum(["set_due_date", "assign_user", "move_to_section", "set_priority", "notify"]),
    offset: z.number().int().optional(),
    userId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
  }),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;

    const rules = await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.projectId, id))
      .orderBy(automationRules.createdAt);

    return apiSuccess(rules);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const body = await req.json();
    const parsed = createSchema.parse(body);
    const projectId = (await params).id;

    const [rule] = await db
      .insert(automationRules)
      .values({
        projectId,
        name: parsed.name,
        trigger: parsed.trigger,
        action: parsed.action,
      })
      .returning();

    return apiSuccess(rule, 201);
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
