import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET() {
  try {
    const allUsers = await db.select().from(users).orderBy(users.name);
    return apiSuccess(allUsers);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}
