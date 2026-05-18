import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { taskDependencies, tasks } from "@/lib/db/schema";
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

    const deps = await db
      .select({ task: tasks })
      .from(taskDependencies)
      .where(eq(taskDependencies.taskId, id))
      .innerJoin(tasks, eq(taskDependencies.dependsOnId, tasks.id));

    return apiSuccess(deps.map((d) => d.task));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}

const createSchema = z.object({
  dependsOnId: z.string().uuid(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const [dep] = await db
      .insert(taskDependencies)
      .values({ taskId: id, dependsOnId: parsed.dependsOnId })
      .returning();

    return apiSuccess(dep, 201);
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
    const { dependsOnId } = await req.json();

    await db
      .delete(taskDependencies)
      .where(
        and(
          eq(taskDependencies.taskId, id),
          eq(taskDependencies.dependsOnId, dependsOnId)
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
