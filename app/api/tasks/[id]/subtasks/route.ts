import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;

    const subtasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.parentId, id))
      .orderBy(asc(tasks.position), asc(tasks.createdAt));

    return apiSuccess(subtasks);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}
