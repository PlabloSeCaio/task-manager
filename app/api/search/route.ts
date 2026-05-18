import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tasks, projects, users, tags } from "@/lib/db/schema";
import { ilike, or } from "drizzle-orm";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    await getCurrentUserId();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const type = searchParams.get("type");

    if (!q || q.length < 2) {
      return apiSuccess({ tasks: [], projects: [], users: [], tags: [] });
    }

    const query = `%${q}%`;

    const results: Record<string, unknown[]> = {};

    if (!type || type === "tasks") {
      results.tasks = await db
        .select()
        .from(tasks)
        .where(ilike(tasks.name, query))
        .limit(5);
    }

    if (!type || type === "projects") {
      results.projects = await db
        .select()
        .from(projects)
        .where(ilike(projects.name, query))
        .limit(5);
    }

    if (!type || type === "users") {
      results.users = await db
        .select()
        .from(users)
        .where(or(ilike(users.name, query), ilike(users.email, query)))
        .limit(5);
    }

    if (!type || type === "tags") {
      results.tags = await db
        .select()
        .from(tags)
        .where(ilike(tags.name, query))
        .limit(5);
    }

    return apiSuccess(results);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}
