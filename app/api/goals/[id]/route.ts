import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;
    const body = await req.json();
    const parsed = z
      .object({
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        status: z.enum(["green", "yellow", "red"]).optional(),
        completionPercent: z.number().int().min(0).max(100).optional(),
        startOn: z.string().datetime().nullable().optional(),
        dueOn: z.string().datetime().nullable().optional(),
      })
      .parse(body);

    const updateData: Record<string, unknown> = { ...parsed };
    if (parsed.startOn !== undefined)
      updateData.startOn = parsed.startOn ? new Date(parsed.startOn) : null;
    if (parsed.dueOn !== undefined)
      updateData.dueOn = parsed.dueOn ? new Date(parsed.dueOn) : null;

    const [updated] = await db
      .update(goals)
      .set(updateData)
      .where(eq(goals.id, id))
      .returning();

    if (!updated) return apiError("Goal not found", 404);
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
