"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, CalendarDays, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { cn } from "@/lib/utils";
import { useActiveOrg } from "@/components/layout/org-context";
import { format, isPast, parseISO } from "date-fns";
import type { Section, Task, User } from "@/types";

function DraggableRow({
  task,
  users,
  onClick,
  onToggleComplete,
}: {
  task: Task;
  users: User[];
  onClick: () => void;
  onToggleComplete: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignee = users.find((u) => u.id === task.assigneeId);
  const dueDate = task.dueOn ? (
    typeof task.dueOn === "string" ? parseISO(task.dueOn) : new Date(task.dueOn)
  ) : null;
  const isOverdue = dueDate && !task.completed && isPast(dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 border-b px-6 py-2.5 transition-colors hover:bg-muted/30",
        isDragging && "z-50 opacity-50 shadow-lg ring-2 ring-primary/20 bg-muted/50",
        task.completed && "opacity-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground/0 hover:text-muted-foreground/30 group-hover:text-muted-foreground/30 transition-colors shrink-0"
      >
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <circle cx="3" cy="2" r="1.2" />
          <circle cx="7" cy="2" r="1.2" />
          <circle cx="3" cy="5" r="1.2" />
          <circle cx="7" cy="5" r="1.2" />
          <circle cx="3" cy="8" r="1.2" />
          <circle cx="7" cy="8" r="1.2" />
          <circle cx="3" cy="11" r="1.2" />
          <circle cx="7" cy="11" r="1.2" />
        </svg>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleComplete(task); }}
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          task.completed
            ? "border-green-500 bg-green-500 text-white"
            : "border-muted-foreground/30 hover:border-muted-foreground/50 bg-transparent"
        )}
      >
        {task.completed && <Check className="size-3" strokeWidth={3} />}
      </button>

      <div
        className="flex flex-1 items-center gap-3 min-w-0 cursor-pointer"
        onClick={() => onClick()}
      >
        <span
          className={cn(
            "flex-1 text-sm truncate",
            task.completed && "line-through text-muted-foreground/60"
          )}
        >
          {task.name}
        </span>

        <div className="flex w-32 items-center justify-end shrink-0">
          {assignee && (
            <Avatar className="size-5">
              <AvatarImage src={assignee.avatarUrl || undefined} />
              <AvatarFallback className="text-[7px] font-medium">
                {(assignee.name || assignee.email || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        <div className="flex w-24 items-center justify-end shrink-0">
          {dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
              )}
            >
              <CalendarDays className="size-3" />
              {format(dueDate, "MMM d")}
            </span>
          )}
        </div>

        <div className="flex w-20 items-center justify-end shrink-0">
          {task.subtype && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
              {task.subtype}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectListView() {
  const params = useParams();
  const { workspaceId } = useActiveOrg();
  const projectId = params.projectId as string;
  const [sections, setSections] = useState<Section[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newTaskNames, setNewTaskNames] = useState<Record<string, string>>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const tasksRef = useRef(tasks);

  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const fetchData = useCallback(async () => {
    try {
      const [sectionsRes, tasksRes, usersRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/sections`),
        fetch(`/api/tasks?projectId=${projectId}`),
        fetch("/api/users"),
      ]);
      const sJson = await sectionsRes.json();
      const tJson = await tasksRes.json();
      const uJson = await usersRes.json();
      if (sJson.data) setSections(sJson.data);
      if (tJson.data) setTasks(tJson.data);
      if (uJson.data) setUsers(uJson.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleComplete = useCallback(async (task: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
    }
  }, []);

  const handleCreateTask = async (sectionId: string) => {
    const name = newTaskNames[sectionId]?.trim();
    if (!name) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          projectId,
          sectionId,
          name,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setNewTaskNames((prev) => ({ ...prev, [sectionId]: "" }));
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const columnHeaderRow = (
    <div className="flex items-center gap-3 border-b px-6 py-2 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
      <div className="w-[18px] shrink-0" />
      <div className="w-4 shrink-0" />
      <span className="flex-1">Name</span>
      <span className="w-32 shrink-0 text-right">Assignee</span>
      <span className="w-24 shrink-0 text-right">Due date</span>
      <span className="w-20 shrink-0 text-right">Type</span>
    </div>
  );

  const groupedBySection = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const s of sections) {
      map[s.id] = tasks
        .filter((t) => t.sectionId === s.id && !t.parentId)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
    }
    return map;
  }, [sections, tasks]);

  const ungroupedTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          !t.sectionId ||
          !sections.find((s) => s.id === t.sectionId)
      ),
    [sections, tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const prevTasks = [...tasksRef.current];
      const activeTaskData = prevTasks.find((t) => t.id === active.id);
      if (!activeTaskData) return;

      let newSectionId: string | null = activeTaskData.sectionId || null;
      let newPosition = activeTaskData.position || 0;

      const overTask = prevTasks.find((t) => t.id === over.id);
      if (overTask) {
        newSectionId = overTask.sectionId || null;
        const sameColumn = prevTasks
          .filter((t) => t.sectionId === newSectionId && !t.parentId)
          .sort((a, b) => (a.position || 0) - (b.position || 0));
        const overIndex = sameColumn.findIndex((t) => t.id === over.id);
        newPosition = overIndex >= 0 ? overIndex : 0;
      }

      if (activeTaskData.sectionId === newSectionId && overTask) {
        setTasks((prev) => {
          let updated = [...prev];
          const sameCol = updated
            .filter((t) => t.sectionId === newSectionId && !t.parentId)
            .sort((a, b) => (a.position || 0) - (b.position || 0));
          const oldIdx = sameCol.findIndex((t) => t.id === active.id);
          const newIdx = sameCol.findIndex((t) => t.id === over.id);
          if (oldIdx >= 0 && newIdx >= 0) {
            const reordered = arrayMove(sameCol, oldIdx, newIdx);
            const ids = new Set(reordered.map((t) => t.id));
            const rest = updated.filter((t) => !ids.has(t.id) || t.parentId);
            updated = [...rest, ...reordered];
          }
          return updated;
        });
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === active.id
              ? { ...t, sectionId: newSectionId, position: newPosition }
              : t
          )
        );
      }

      try {
        await fetch(`/api/tasks/${active.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionId: newSectionId,
            position: newPosition,
          }),
        });
      } catch {
        setTasks(prevTasks);
      }
    },
    []
  );

  const allTaskIds = useMemo(
    () => tasks.filter((t) => !t.parentId).map((t) => t.id),
    [tasks]
  );

  if (!workspaceId) return null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-auto">
          <SortableContext
            items={allTaskIds}
            strategy={verticalListSortingStrategy}
          >
            {columnHeaderRow}

            {sections.map((section) => {
              const sectionTasks = groupedBySection[section.id] || [];
              return (
                <div key={section.id}>
                  <div className="flex items-center gap-2 border-b px-6 py-2 bg-muted/20">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {section.name}
                    </h3>
                    <span className="text-xs text-muted-foreground/50">
                      {sectionTasks.length}
                    </span>
                  </div>

                  {sectionTasks.length === 0 && (
                    <div className="border-b px-6 py-4">
                      <p className="text-sm text-muted-foreground/50 italic">
                        No tasks
                      </p>
                    </div>
                  )}

                  {sectionTasks.map((task) => (
                    <DraggableRow
                      key={task.id}
                      task={task}
                      users={users}
                      onClick={() => setSelectedTaskId(task.id)}
                      onToggleComplete={handleToggleComplete}
                    />
                  ))}

                  <div className="flex items-center gap-2 border-b px-6 py-2">
                    <Plus className="size-3.5 shrink-0 text-muted-foreground/40" />
                    <Input
                      placeholder="Add task..."
                      value={newTaskNames[section.id] || ""}
                      onChange={(e) =>
                        setNewTaskNames((prev) => ({
                          ...prev,
                          [section.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateTask(section.id);
                      }}
                      className="h-7 border-0 bg-transparent px-0 text-sm placeholder:text-muted-foreground/40 focus-visible:ring-0"
                    />
                  </div>
                </div>
              );
            })}

            {ungroupedTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 border-b px-6 py-2 bg-muted/20">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Unsorted
                  </h3>
                  <span className="text-xs text-muted-foreground/50">
                    {ungroupedTasks.length}
                  </span>
                </div>
                {ungroupedTasks.map((task) => (
                  <DraggableRow
                    key={task.id}
                    task={task}
                    users={users}
                    onClick={() => setSelectedTaskId(task.id)}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </div>
            )}

            {sections.length === 0 && tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">
                  No tasks yet. Add one above.
                </p>
              </div>
            )}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="flex items-center gap-3 border bg-card px-6 py-2.5 shadow-lg ring-2 ring-primary/20">
              <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                <circle cx="3" cy="2" r="1.2" />
                <circle cx="7" cy="2" r="1.2" />
                <circle cx="3" cy="5" r="1.2" />
                <circle cx="7" cy="5" r="1.2" />
                <circle cx="3" cy="8" r="1.2" />
                <circle cx="7" cy="8" r="1.2" />
                <circle cx="3" cy="11" r="1.2" />
                <circle cx="7" cy="11" r="1.2" />
              </svg>
              <span className="text-sm font-medium">{activeTask.name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          open={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
}
