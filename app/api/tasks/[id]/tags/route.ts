import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { taskTags, tags } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;

    const result = await db
      .select({ tag: tags })
      .from(taskTags)
      .where(eq(taskTags.taskId, id))
      .innerJoin(tags, eq(taskTags.tagId, tags.id));

    return apiSuccess(result.map((r) => r.tag));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}

const addSchema = z.object({
  tagId: z.string().uuid(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;
    const body = await req.json();
    const parsed = addSchema.parse(body);

    await db
      .insert(taskTags)
      .values({ taskId: id, tagId: parsed.tagId })
      .onConflictDoNothing();

    return apiSuccess({ added: true }, 201);
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;
    const { tagId } = await req.json();

    await db
      .delete(taskTags)
      .where(
        and(
          eq(taskTags.taskId, id),
          eq(taskTags.tagId, tagId)
        )
      );

    return apiSuccess({ removed: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}
