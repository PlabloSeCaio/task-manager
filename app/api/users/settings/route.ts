import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { userSettings, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  getCurrentUserId,
  getDbUserId,
  apiError,
  apiSuccess,
} from "@/lib/api-helpers";

const defaultNotifications = {
  browser: {
    workShared: true,
    workAssigned: true,
    accessRequested: true,
    mention: true,
    comments: true,
    appreciation: true,
    statusUpdates: true,
    messages: true,
    addedCollaborator: true,
    workDetailsChanged: true,
    workAddedPortfolio: true,
    tasksAddedProject: true,
    dailyTasks: false,
    weeklyOverdue: false,
  },
  project: {
    statusUpdates: true,
    messages: true,
    tasksAdded: true,
  },
  portfolio: {
    statusUpdates: true,
    messages: true,
    workAdded: true,
  },
  goal: {
    statusUpdates: true,
    progressUpdates: true,
    newGoals: true,
  },
  email: {
    workShared: false,
    workAssigned: true,
    dueDateChanged: true,
    workCompleted: true,
    workBlocked: false,
    reactions: false,
    accessRequested: false,
    mention: true,
    comments: true,
    appreciation: false,
    statusUpdates: true,
    messages: true,
    addedCollaborator: true,
    workDetailsChanged: false,
    workCompletedNotif: true,
    workAddedPortfolio: false,
    tasksAddedProject: true,
    dailyTasks: false,
    weeklyOverdue: false,
    weeklyPortfolio: false,
    smartSummaries: false,
    draftReminders: true,
    commentFollowup: true,
    inviteUpdates: true,
    tips: true,
  },
  dnd: {
    enabled: false,
    startTime: "22:00",
    endTime: "07:00",
    days: ["Sat", "Sun"],
  },
};

const updateSchema = z.object({
  nickname: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  about: z.string().optional(),
  personalization: z.record(z.string(), z.unknown()).optional(),
  showCertifications: z.boolean().optional(),
  outOfOffice: z.record(z.string(), z.unknown()).optional(),
  notifications: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  try {
    const clerkId = await getCurrentUserId();
    const dbUserId = await getDbUserId();

    const [user] = await db
      .select({ name: users.name, email: users.email, avatarUrl: users.avatarUrl, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, dbUserId));

    if (!user) return apiError("User not found", 404);

    let settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, clerkId))
      .then((rows) => rows[0] || null);

    if (!settings) {
      const [created] = await db
        .insert(userSettings)
        .values({ userId: clerkId })
        .returning();
      settings = created;
    }

    return apiSuccess({
      ...user,
      ...settings,
      notifications: {
        ...defaultNotifications,
        ...(settings.notifications as Record<string, unknown> || {}),
      },
      personalization: settings.personalization || {},
      outOfOffice: settings.outOfOffice || {},
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    console.error("GET /api/users/settings error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const clerkId = await getCurrentUserId();

    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (parsed.nickname !== undefined) updateData.nickname = parsed.nickname;
    if (parsed.jobTitle !== undefined) updateData.jobTitle = parsed.jobTitle;
    if (parsed.department !== undefined) updateData.department = parsed.department;
    if (parsed.about !== undefined) updateData.about = parsed.about;
    if (parsed.personalization !== undefined) updateData.personalization = parsed.personalization;
    if (parsed.showCertifications !== undefined) updateData.showCertifications = parsed.showCertifications;
    if (parsed.outOfOffice !== undefined) updateData.outOfOffice = parsed.outOfOffice;
    if (parsed.notifications !== undefined) updateData.notifications = parsed.notifications;
    updateData.updatedAt = new Date();

    const existing = await db
      .select({ id: userSettings.id })
      .from(userSettings)
      .where(eq(userSettings.userId, clerkId))
      .then((rows) => rows[0] || null);

    let saved;
    if (existing) {
      [saved] = await db
        .update(userSettings)
        .set(updateData)
        .where(eq(userSettings.userId, clerkId))
        .returning();
    } else {
      [saved] = await db
        .insert(userSettings)
        .values({ userId: clerkId, ...updateData })
        .returning();
    }

    return apiSuccess(saved);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(error.issues[0].message, 400);
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    console.error("PATCH /api/users/settings error:", error);
    return apiError("Internal server error", 500);
  }
}
