import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { comments, users, notifications, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, getDbUserId, apiError, apiSuccess } from "@/lib/api-helpers";

const createSchema = z.object({
  body: z.string().min(1),
  htmlBody: z.string().optional(),
  mentionedUserIds: z.array(z.string().uuid()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;

    const allComments = await db
      .select()
      .from(comments)
      .where(eq(comments.taskId, id))
      .orderBy(comments.createdAt);

    return apiSuccess(allComments);
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
    const dbUserId = await getDbUserId();
    const { id } = await params;
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const [comment] = await db
      .insert(comments)
      .values({
        taskId: id,
        authorId: dbUserId,
        body: parsed.body,
        htmlBody: parsed.htmlBody,
      })
      .returning();

    const [author] = await db.select({ name: users.name, avatarUrl: users.avatarUrl, email: users.email }).from(users).where(eq(users.id, dbUserId)).limit(1);

    if (parsed.mentionedUserIds?.length) {
      const [taskRow] = await db.select({ projectId: tasks.projectId }).from(tasks).where(eq(tasks.id, id)).limit(1);
      await db.insert(notifications).values(
        parsed.mentionedUserIds.map(userId => ({
          userId,
          actorId: dbUserId,
          taskId: id,
          projectId: taskRow?.projectId,
          type: "mention",
        }))
      );
    }

    return apiSuccess({
      ...comment,
      author: author ?? null,
    }, 201);
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
