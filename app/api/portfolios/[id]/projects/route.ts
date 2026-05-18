import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { portfolioProjects, projects } from "@/lib/db/schema";
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
      .select({ project: projects })
      .from(portfolioProjects)
      .where(eq(portfolioProjects.portfolioId, id))
      .innerJoin(projects, eq(portfolioProjects.projectId, projects.id));

    return apiSuccess(result.map((r) => r.project));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}

const addSchema = z.object({
  projectId: z.string().uuid(),
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
      .insert(portfolioProjects)
      .values({ portfolioId: id, projectId: parsed.projectId })
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
    const { projectId } = await req.json();

    await db
      .delete(portfolioProjects)
      .where(
        and(
          eq(portfolioProjects.portfolioId, id),
          eq(portfolioProjects.projectId, projectId)
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
