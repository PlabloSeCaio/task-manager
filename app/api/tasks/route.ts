import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

const createSchema = z.object({
  workspaceId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  name: z.string().min(1).max(500),
  notes: z.string().optional(),
  htmlNotes: z.string().optional(),
  subtype: z.enum(["default", "milestone", "approval"]).optional(),
  startOn: z.string().datetime().optional(),
  dueOn: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await getCurrentUserId();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const sectionId = searchParams.get("sectionId");
    const assigneeId = searchParams.get("assigneeId");
    const completed = searchParams.get("completed");

    const conditions = [];

    if (projectId) conditions.push(eq(tasks.projectId, projectId));
    if (sectionId) conditions.push(eq(tasks.sectionId, sectionId));
    if (assigneeId) conditions.push(eq(tasks.assigneeId, assigneeId));
    if (completed === "true") conditions.push(eq(tasks.completed, true));
    else if (completed === "false") conditions.push(eq(tasks.completed, false));

    const allTasks = conditions.length > 0
      ? await db
          .select()
          .from(tasks)
          .where(and(...conditions))
          .orderBy(asc(tasks.position), asc(tasks.createdAt))
      : await db
          .select()
          .from(tasks)
          .orderBy(asc(tasks.position), asc(tasks.createdAt));

    return apiSuccess(allTasks);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const [task] = await db
      .insert(tasks)
      .values({
        workspaceId: parsed.workspaceId,
        projectId: parsed.projectId,
        sectionId: parsed.sectionId,
        parentId: parsed.parentId,
        assigneeId: parsed.assigneeId,
        name: parsed.name,
        notes: parsed.notes,
        htmlNotes: parsed.htmlNotes,
        subtype: parsed.subtype,
        startOn: parsed.startOn ? new Date(parsed.startOn) : null,
        dueOn: parsed.dueOn ? new Date(parsed.dueOn) : null,
      })
      .returning();

    return apiSuccess(task, 201);
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
