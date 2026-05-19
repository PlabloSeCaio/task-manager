"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { format, isSameDay, parseISO } from "date-fns";
import { eventBus } from "@/lib/event-bus";
import type { Task } from "@/types";

export function CalendarView() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?projectId=${projectId}`);
      const json = await res.json();
      if (json.data) setTasks(json.data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    eventBus.on("task:created", fetchData);
    eventBus.on("task:updated", fetchData);
    eventBus.on("task:deleted", fetchData);
    eventBus.on("comment:created", fetchData);
    eventBus.on("attachment:created", fetchData);
    return () => {
      eventBus.off("task:created", fetchData);
      eventBus.off("task:updated", fetchData);
      eventBus.off("task:deleted", fetchData);
      eventBus.off("comment:created", fetchData);
      eventBus.off("attachment:created", fetchData);
    };
  }, [fetchData]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (task.dueOn) {
        const key = format(new Date(task.dueOn), "yyyy-MM-dd");
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(task);
      }
    }
    return map;
  }, [tasks]);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const tasksForSelectedDay = tasksByDate.get(selectedDateStr) || [];

  const modifiers = useMemo(() => {
    const days: Date[] = [];
    for (const task of tasks) {
      if (task.dueOn) {
        const d = new Date(task.dueOn);
        if (!days.some((existing) => isSameDay(existing, d))) {
          days.push(d);
        }
      }
    }
    return { hasTasks: days };
  }, [tasks]);

  const modifiersStyles = {
    hasTasks: { fontWeight: "bold", textDecoration: "underline" },
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 p-6">
      <div className="flex-shrink-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => d && setSelectedDate(d)}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="rounded-md border"
        />
      </div>

      <div className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Tasks due on {format(selectedDate, "MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksForSelectedDay.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tasks due on this date
              </p>
            ) : (
              <div className="space-y-2">
                {tasksForSelectedDay.map((task) => (
                  <div
                    key={task.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <div
                      className={cn(
                        "size-2 rounded-full",
                        task.completed ? "bg-green-500" : "bg-blue-500"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm",
                        task.completed && "text-muted-foreground line-through"
                      )}
                    >
                      {task.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onNavigate={(id) => setSelectedTaskId(id)}
          open={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
}
