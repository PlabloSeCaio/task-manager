import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { taskFollowers, users } from "@/lib/db/schema";
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

    const followers = await db
      .select({ user: users })
      .from(taskFollowers)
      .where(eq(taskFollowers.taskId, id))
      .innerJoin(users, eq(taskFollowers.userId, users.id));

    return apiSuccess(followers.map((f) => f.user));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}

const addSchema = z.object({
  userId: z.string().uuid(),
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
      .insert(taskFollowers)
      .values({ taskId: id, userId: parsed.userId })
      .onConflictDoNothing();

    return apiSuccess({ followed: true }, 201);
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
    const { userId } = await req.json();

    await db
      .delete(taskFollowers)
      .where(
        and(
          eq(taskFollowers.taskId, id),
          eq(taskFollowers.userId, userId)
        )
      );

    return apiSuccess({ unfollowed: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}
