import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { projects, sections, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  getDbUserId,
  getCurrentOrgId,
  ensureDefaultWorkspace,
  apiError,
  apiSuccess,
} from "@/lib/api-helpers";

const createFromTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  privacy: z.enum(["public", "private_to_team", "private"]).optional(),
  defaultView: z.enum(["list", "board", "calendar", "timeline"]).optional(),
  sections: z.array(z.string()).optional(),
  starterTasks: z
    .array(
      z.object({
        name: z.string().min(1),
        sectionIndex: z.number().int().min(0),
      })
    )
    .optional(),
  templateId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const dbUserId = await getDbUserId();
    const workspaceId = await getCurrentOrgId();
    await ensureDefaultWorkspace();
    const body = await req.json();
    const parsed = createFromTemplateSchema.parse(body);

    const sectionNames = parsed.sections || ["To do", "In progress", "Completed"];
    const starterTasks = parsed.starterTasks || [];

    const [project] = await db
      .insert(projects)
      .values({
        workspaceId,
        ownerId: dbUserId,
        name: parsed.name,
        defaultView: parsed.defaultView || "list",
        privacy: parsed.privacy || "public",
      })
      .returning();

    const createdSections = [];
    for (let i = 0; i < sectionNames.length; i++) {
      const [section] = await db
        .insert(sections)
        .values({
          projectId: project.id,
          name: sectionNames[i],
          position: i,
        })
        .returning();
      createdSections.push(section);
    }

    for (let i = 0; i < starterTasks.length; i++) {
      const st = starterTasks[i];
      const sectionId = createdSections[st.sectionIndex]?.id || null;

      await db.insert(tasks).values({
        workspaceId,
        projectId: project.id,
        sectionId,
        createdById: dbUserId,
        name: st.name,
        position: i,
      });
    }

    const [created] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, project.id));

    return apiSuccess(created, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(error.issues[0].message, 400);
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    const msg = error instanceof Error ? error.message : "Internal server error";
    return apiError(msg, 500);
  }
}
