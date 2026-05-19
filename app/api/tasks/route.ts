import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tasks, comments, attachments } from "@/lib/db/schema";
import { eq, and, asc, desc, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { runAutomations } from "@/lib/automation-engine";
import { getCurrentUserId, getDbUserId, getCurrentOrgId, ensureDefaultWorkspace, apiError, apiSuccess } from "@/lib/api-helpers";
import { parseDateString } from "@/lib/utils";

const createSchema = z.object({
  projectId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  name: z.string().min(1).max(500),
  notes: z.string().optional(),
  htmlNotes: z.string().optional(),
  subtype: z.enum(["default", "milestone", "approval"]).optional(),
  startOn: z.string().optional(),
  dueOn: z.string().optional(),
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

    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    } else {
      const workspaceId = await getCurrentOrgId();
      conditions.push(eq(tasks.workspaceId, workspaceId));
    }
    if (sectionId) conditions.push(eq(tasks.sectionId, sectionId));
    if (assigneeId) conditions.push(eq(tasks.assigneeId, assigneeId));
    if (completed === "true") conditions.push(eq(tasks.completed, true));
    else if (completed === "false") conditions.push(eq(tasks.completed, false));

    const allTasks = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(asc(tasks.position), asc(tasks.createdAt));

    const taskIds = allTasks.map(t => t.id);

    const [commentCounts, attachmentCounts, latestImages] = await Promise.all([
      taskIds.length > 0
        ? db.select({ taskId: comments.taskId, count: sql<number>`count(*)` }).from(comments).where(inArray(comments.taskId, taskIds)).groupBy(comments.taskId)
        : Promise.resolve([]),
      taskIds.length > 0
        ? db.select({ taskId: attachments.taskId, count: sql<number>`count(*)` }).from(attachments).where(inArray(attachments.taskId, taskIds)).groupBy(attachments.taskId)
        : Promise.resolve([]),
      taskIds.length > 0
        ? db.select({ taskId: attachments.taskId, url: attachments.url, createdAt: attachments.createdAt }).from(attachments).where(and(inArray(attachments.taskId, taskIds), sql`${attachments.contentType} LIKE 'image/%'`)).orderBy(desc(attachments.createdAt)).then(rows => rows.filter(r => r.taskId && r.url))
        : Promise.resolve([]),
    ]);

    const commentCountMap = new Map(commentCounts.map(r => [r.taskId, r.count]));
    const attachmentCountMap = new Map(attachmentCounts.map(r => [r.taskId, r.count]));
    const latestImageMap = new Map<string, string>();
    for (const att of latestImages) {
      if (att.url && att.taskId && !latestImageMap.has(att.taskId)) latestImageMap.set(att.taskId, att.url);
    }

    return apiSuccess(allTasks.map(t => ({
      ...t,
      commentCount: commentCountMap.get(t.id) ?? 0,
      attachmentCount: attachmentCountMap.get(t.id) ?? 0,
      latestImageUrl: latestImageMap.get(t.id) ?? null,
    })));
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
    const dbUserId = await getDbUserId();
    const workspaceId = await getCurrentOrgId();
    await ensureDefaultWorkspace();
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const [task] = await db
      .insert(tasks)
      .values({
        workspaceId,
        projectId: parsed.projectId,
        sectionId: parsed.sectionId,
        parentId: parsed.parentId,
        assigneeId: parsed.assigneeId,
        createdById: dbUserId,
        name: parsed.name,
        notes: parsed.notes,
        htmlNotes: parsed.htmlNotes,
        subtype: parsed.subtype,
        startOn: parseDateString(parsed.startOn),
        dueOn: parseDateString(parsed.dueOn),
      })
      .returning();

    if (task) {
      runAutomations(task.id, { id: task.id, ...parsed }).catch(console.error);
    }

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
