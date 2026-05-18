import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getDbUserId, apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET() {
  try {
    const dbUserId = await getDbUserId();

    const allNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, dbUserId))
      .orderBy(notifications.createdAt);

    return apiSuccess(allNotifications);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}

export async function POST() {
  try {
    const dbUserId = await getDbUserId();

    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, dbUserId),
          eq(notifications.read, false)
        )
      );

    return apiSuccess({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}
