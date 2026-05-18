import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUserId, apiError, apiSuccess } from "@/lib/api-helpers";
import { getUploadUrl } from "@/lib/r2";
import { randomUUID } from "crypto";

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await getCurrentUserId();
    const body = await req.json();
    const parsed = presignSchema.parse(body);

    const key = `${randomUUID()}-${parsed.filename}`;
    const uploadUrl = await getUploadUrl(key, parsed.contentType);

    return apiSuccess({ uploadUrl, key }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(error.issues[0].message, 400);
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    if (
      error instanceof Error &&
      error.message.includes("R2 not configured")
    ) {
      return apiError("File storage not configured", 501);
    }
    return apiError("Internal server error", 500);
  }
}
