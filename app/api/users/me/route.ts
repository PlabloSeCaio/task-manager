import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  getCurrentUserId,
  getDbUserId,
  apiError,
  apiSuccess,
} from "@/lib/api-helpers";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().optional(),
});

export async function GET() {
  try {
    const dbUserId = await getDbUserId();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, dbUserId));

    if (!user) return apiError("User not found", 404);
    return apiSuccess(user);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const dbUserId = await getDbUserId();
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.avatarUrl !== undefined) updateData.avatarUrl = parsed.avatarUrl;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, dbUserId))
      .returning();

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
