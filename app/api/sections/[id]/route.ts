import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  position: z.number().int().optional(),
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

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.position !== undefined) updateData.position = parsed.position;

    const [updated] = await db
      .update(sections)
      .set(updateData)
      .where(eq(sections.id, id))
      .returning();

    if (!updated) {
      return apiError("Section not found", 404);
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
      .delete(sections)
      .where(eq(sections.id, id))
      .returning();

    if (!deleted) {
      return apiError("Section not found", 404);
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}
