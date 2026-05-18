import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { statusUpdates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, getDbUserId, apiError, apiSuccess } from "@/lib/api-helpers";

const createSchema = z.object({
  projectId: z.string().uuid().optional(),
  portfolioId: z.string().uuid().optional(),
  color: z.enum(["green", "yellow", "red"]).optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  htmlBody: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await getCurrentUserId();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const portfolioId = searchParams.get("portfolioId");

    const conditions = [];
    if (projectId) conditions.push(eq(statusUpdates.projectId, projectId));
    if (portfolioId) conditions.push(eq(statusUpdates.portfolioId, portfolioId));

    const all = await db
      .select()
      .from(statusUpdates)
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .orderBy(statusUpdates.createdAt);

    return apiSuccess(all);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await getCurrentUserId();
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const [update] = await db
      .insert(statusUpdates)
      .values({
        projectId: parsed.projectId,
        portfolioId: parsed.portfolioId,
        authorId: (await getDbUserId()),
        color: parsed.color || "green",
        title: parsed.title,
        body: parsed.body,
        htmlBody: parsed.htmlBody,
      })
      .returning();

    return apiSuccess(update, 201);
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
