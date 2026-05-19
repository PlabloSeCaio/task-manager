"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { cn } from "@/lib/utils";
import {
  addDays,
  differenceInDays,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { eventBus } from "@/lib/event-bus";
import type { Task, Section } from "@/types";

const BAR_HEIGHT = 28;
const ROW_GAP = 4;
const HEADER_HEIGHT = 40;
const ROW_HEIGHT = BAR_HEIGHT + ROW_GAP;
const SIDEBAR_WIDTH = 250;
const DAY_WIDTH = 28;
const NUM_WEEKS = 6;

export function TimelineView() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, sectionsRes] = await Promise.all([
        fetch(`/api/tasks?projectId=${projectId}`),
        fetch(`/api/projects/${projectId}/sections`),
      ]);
      const tJson = await tasksRes.json();
      const sJson = await sectionsRes.json();
      if (tJson.data) setTasks(tJson.data);
      if (sJson.data) setSections(sJson.data);
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

  const { dateRange, days } = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(startOfMonth(now), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(now), { weekStartsOn: 0 });
    const allDays: Date[] = [];
    let cursor = start;
    while (cursor <= end) {
      allDays.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return { dateRange: { start, end }, days: allDays };
  }, []);

  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.startOn || t.dueOn
      ),
    [tasks]
  );

  const getTaskPosition = (task: Task) => {
    const start = task.startOn ? new Date(task.startOn) : dateRange.start;
    const end = task.dueOn ? new Date(task.dueOn) : start;
    const totalDays = differenceInDays(dateRange.end, dateRange.start) || 1;
    const startOffset = differenceInDays(start, dateRange.start);
    const duration = Math.max(differenceInDays(end, start), 1);
    return {
      left: (Math.max(startOffset, 0) / totalDays) * 100,
      width: (Math.min(duration, totalDays - Math.max(startOffset, 0)) / totalDays) * 100,
    };
  };

  const totalWidth = days.length * DAY_WIDTH;
  const totalRows = Math.max(visibleTasks.length, 5);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading timeline...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="overflow-auto p-6">
        <div className="relative" style={{ minWidth: SIDEBAR_WIDTH + totalWidth }}>
          {/* Header */}
          <div
            className="sticky top-0 z-10 flex bg-background"
            style={{ height: HEADER_HEIGHT }}
          >
            <div
              className="flex items-center px-3 font-medium text-muted-foreground text-sm border-r"
              style={{ width: SIDEBAR_WIDTH }}
            >
              Task
            </div>
            <div className="flex" style={{ width: totalWidth }}>
              {days.map((day, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center border-r text-xs text-muted-foreground flex-shrink-0"
                  style={{ width: DAY_WIDTH }}
                >
                  {format(day, "d")}
                </div>
              ))}
            </div>
          </div>

          {/* Month label row */}
          <div className="flex border-b">
            <div
              className="border-r"
              style={{ width: SIDEBAR_WIDTH }}
            />
            <div
              className="flex items-center px-2 py-1 text-xs font-medium text-muted-foreground"
              style={{ width: totalWidth }}
            >
              {format(dateRange.start, "MMMM yyyy")}
            </div>
          </div>

          {/* Task rows */}
          <div style={{ height: totalRows * ROW_HEIGHT }}>
            {visibleTasks.map((task, idx) => {
              const pos = getTaskPosition(task);
              return (
                <div
                  key={task.id}
                  className="flex cursor-pointer hover:bg-muted/30"
                  style={{ height: ROW_HEIGHT }}
                >
                  <div
                    className="flex items-center truncate border-r px-3 text-sm"
                    style={{ width: SIDEBAR_WIDTH }}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    {task.name}
                  </div>
                  <div className="relative" style={{ width: totalWidth }}>
                    <div
                      className={cn(
                        "absolute top-1 h-full rounded-md px-2 py-0.5 text-xs text-white flex items-center overflow-hidden",
                        task.completed
                          ? "bg-green-500"
                          : "bg-blue-500"
                      )}
                      style={{
                        left: `${pos.left}%`,
                        width: `${Math.max(pos.width, 3)}%`,
                        height: BAR_HEIGHT,
                      }}
                    >
                      {task.name}
                    </div>
                  </div>
                </div>
              );
            })}

            {visibleTasks.length === 0 && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                No tasks with dates. Add start/due dates to see them on the timeline.
              </div>
            )}
          </div>
        </div>
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
