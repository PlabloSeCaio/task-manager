import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { customFieldDefs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["text", "number", "date", "single_select", "multi_select"]),
  options: z
    .array(z.object({ id: z.string(), name: z.string(), color: z.string().optional() }))
    .optional(),
  position: z.number().int().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;

    const fields = await db
      .select()
      .from(customFieldDefs)
      .where(eq(customFieldDefs.projectId, id))
      .orderBy(customFieldDefs.position);

    return apiSuccess(fields);
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
    await getCurrentUserId();
    const body = await req.json();
    const parsed = createSchema.parse(body);
    const projectId = (await params).id;

    const [field] = await db
      .insert(customFieldDefs)
      .values({
        workspaceId: "00000000-0000-0000-0000-000000000000",
        projectId,
        name: parsed.name,
        type: parsed.type,
        options: parsed.options || null,
        position: parsed.position || 0,
      })
      .returning();

    return apiSuccess(field, 201);
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
