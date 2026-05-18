import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

const createSchema = z.object({
  key: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().optional(),
  sizeBytes: z.number().int().optional(),
  url: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;

    const allAttachments = await db
      .select()
      .from(attachments)
      .where(eq(attachments.taskId, id))
      .orderBy(attachments.createdAt);

    return apiSuccess(allAttachments);
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
    const clerkId = await getCurrentUserId();
    const { id } = await params;
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const [attachment] = await db
      .insert(attachments)
      .values({
        taskId: id,
        uploadedById: clerkId,
        r2Key: parsed.key,
        filename: parsed.filename,
        contentType: parsed.contentType,
        sizeBytes: parsed.sizeBytes,
        url: parsed.url,
      })
      .returning();

    return apiSuccess(attachment, 201);
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
