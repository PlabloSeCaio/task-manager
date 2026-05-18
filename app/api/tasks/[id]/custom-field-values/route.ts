import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { customFieldValues, customFieldDefs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;

    const values = await db
      .select({
        value: customFieldValues,
        field: customFieldDefs,
      })
      .from(customFieldValues)
      .where(eq(customFieldValues.taskId, id))
      .innerJoin(
        customFieldDefs,
        eq(customFieldValues.fieldId, customFieldDefs.id)
      );

    return apiSuccess(values);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    return apiError("Internal server error", 500);
  }
}

const upsertSchema = z.object({
  fieldId: z.string().uuid(),
  textValue: z.string().optional(),
  numberValue: z.number().optional(),
  dateValue: z.string().optional(),
  enumValues: z.array(z.string()).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserId();
    const { id } = await params;
    const body = await req.json();
    const parsed = upsertSchema.parse(body);

    const existing = await db
      .select()
      .from(customFieldValues)
      .where(
        and(
          eq(customFieldValues.taskId, id),
          eq(customFieldValues.fieldId, parsed.fieldId)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(customFieldValues)
        .set({
          textValue: parsed.textValue,
          numberValue: parsed.numberValue,
          dateValue: parsed.dateValue ? new Date(parsed.dateValue) : null,
          enumValues: parsed.enumValues || null,
        })
        .where(eq(customFieldValues.id, existing[0].id))
        .returning();

      return apiSuccess(updated);
    } else {
      const [created] = await db
        .insert(customFieldValues)
        .values({
          taskId: id,
          fieldId: parsed.fieldId,
          textValue: parsed.textValue,
          numberValue: parsed.numberValue,
          dateValue: parsed.dateValue ? new Date(parsed.dateValue) : null,
          enumValues: parsed.enumValues || null,
        })
        .returning();

      return apiSuccess(created, 201);
    }
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
