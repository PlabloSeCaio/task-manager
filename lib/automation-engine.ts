import { db } from "@/lib/db";
import { automationRules, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { addDays } from "date-fns";

interface AutomationTrigger {
  type: "task_moved" | "task_completed" | "task_created" | "task_due_soon";
  sectionId?: string;
}

interface AutomationAction {
  type: "set_due_date" | "assign_user" | "move_to_section" | "set_priority" | "notify";
  offset?: number;
  userId?: string;
  sectionId?: string;
}

export async function runAutomations(
  taskId: string,
  changes: Record<string, unknown>
) {
  try {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (!task || !task.projectId) return;

    const rules = await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.projectId, task.projectId));

    for (const rule of rules) {
      if (!rule.enabled) continue;

      const trigger = rule.trigger as AutomationTrigger;
      const action = rule.action as AutomationAction;

      let shouldRun = false;

      switch (trigger.type) {
        case "task_moved":
          if (
            changes.sectionId !== undefined &&
            trigger.sectionId &&
            changes.sectionId === trigger.sectionId
          ) {
            shouldRun = true;
          }
          break;
        case "task_completed":
          if (changes.completed === true) {
            shouldRun = true;
          }
          break;
        case "task_created":
          if (changes.id !== undefined) {
            shouldRun = true;
          }
          break;
        case "task_due_soon":
          // Evaluated on a schedule, not on mutation
          break;
      }

      if (!shouldRun) continue;

      const updates: Record<string, unknown> = {};

      switch (action.type) {
        case "set_due_date":
          if (action.offset !== undefined) {
            updates.dueOn = addDays(new Date(), action.offset);
          }
          break;
        case "assign_user":
          if (action.userId) {
            updates.assigneeId = action.userId;
          }
          break;
        case "move_to_section":
          if (action.sectionId) {
            updates.sectionId = action.sectionId;
          }
          break;
        case "notify":
          // Notification creation would go here
          break;
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date();
        await db.update(tasks).set(updates).where(eq(tasks.id, taskId));
      }
    }
  } catch (err) {
    console.error("Automation engine error:", err);
  }
}
