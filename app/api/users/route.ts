import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, workspaceMembers } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    await getCurrentUserId();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    let allUsers;
    if (workspaceId) {
      const memberRecords = await db
        .select({ userId: workspaceMembers.userId })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, workspaceId));

      const userIds = memberRecords.map((m) => m.userId);
      if (userIds.length === 0) {
        return apiSuccess([]);
      }

      allUsers = await db
        .select()
        .from(users)
        .where(inArray(users.id, userIds))
        .orderBy(users.name);
    } else {
      allUsers = await db.select().from(users).orderBy(users.name);
    }

    return apiSuccess(allUsers);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}
