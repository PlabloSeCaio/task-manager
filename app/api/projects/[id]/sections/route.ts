import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

const createSchema = z.object({
  name: z.string().min(1).max(255),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;

    const allSections = await db
      .select()
      .from(sections)
      .where(eq(sections.projectId, id))
      .orderBy(sections.position);

    return apiSuccess(allSections);
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
    const { id } = await params;
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const existingSections = await db
      .select()
      .from(sections)
      .where(eq(sections.projectId, id));

    const nextPosition =
      existingSections.length > 0
        ? Math.max(...existingSections.map((s) => s.position)) + 1
        : 0;

    const [section] = await db
      .insert(sections)
      .values({
        projectId: id,
        name: parsed.name,
        position: nextPosition,
      })
      .returning();

    return apiSuccess(section, 201);
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
