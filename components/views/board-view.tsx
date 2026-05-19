"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useParams } from "next/navigation";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/tasks/task-card";
import { InlineTaskComposer } from "@/components/tasks/inline-task-composer";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { cn } from "@/lib/utils";
import type { Section, Task, User } from "@/types";

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

export function BoardView() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [sections, setSections] = useState<Section[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);
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
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const columns: Column[] = useMemo(() => {
    const cols: Column[] = sections.map((s) => ({
      id: s.id,
      title: s.name,
      tasks: tasks
        .filter((t) => t.sectionId === s.id && !t.parentId)
        .sort((a, b) => (a.position || 0) - (b.position || 0)),
    }));

    const unassigned = tasks.filter(
      (t) =>
        !t.sectionId ||
        !sections.find((s) => s.id === t.sectionId)
    );
    if (unassigned.length > 0) {
      cols.unshift({
        id: "unsorted",
        title: "Unsorted",
        tasks: unassigned,
      });
    }

    return cols;
  }, [sections, tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const prevTasks = [...tasksRef.current];
    const activeTaskData = prevTasks.find((t) => t.id === active.id);
    if (!activeTaskData) return;

    let newSectionId: string | null = null;
    let newPosition = 0;

    const overTask = prevTasks.find((t) => t.id === over.id);
    if (overTask) {
      newSectionId = overTask.sectionId || null;
      const sameColumn = prevTasks
        .filter((t) => t.sectionId === newSectionId && !t.parentId)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      const overIndex = sameColumn.findIndex((t) => t.id === over.id);
      newPosition = overIndex >= 0 ? overIndex : 0;
    } else {
      const overColumn = columns.find((c) => c.id === over.id);
      if (overColumn) {
        newSectionId = overColumn.id === "unsorted" ? null : overColumn.id;
        newPosition = overColumn.tasks.length;
      }
    }

    if (newSectionId === undefined) return;

    setTasks((prev) => {
      let updated = prev.map((t) =>
        t.id === active.id
          ? { ...t, sectionId: newSectionId, position: newPosition }
          : t
      );

      if (activeTaskData.sectionId === newSectionId && overTask) {
        const sameCol = updated.filter(
          (t) => t.sectionId === newSectionId && !t.parentId
        );
        const oldIdx = sameCol.findIndex((t) => t.id === active.id);
        const newIdx = sameCol.findIndex((t) => t.id === over.id);
        if (oldIdx >= 0 && newIdx >= 0) {
          const reordered = arrayMove(sameCol, oldIdx, newIdx);
          const ids = new Set(reordered.map((t) => t.id));
          const rest = updated.filter((t) => !ids.has(t.id) || t.parentId);
          updated = [...rest, ...reordered];
        }
      }

      return updated;
    });

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
  }, [columns]);

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;
    try {
      await fetch(`/api/projects/${projectId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSectionName }),
      });
      setNewSectionName("");
      setAddingSection(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to create section", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading board...</p>
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
        <div className="flex flex-1 gap-4 overflow-x-auto p-6">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/50"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {column.title}
                  </h3>
                  <span className="text-xs text-muted-foreground/50">
                    {column.tasks.length}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="size-6">
                  <MoreHorizontal className="size-3" />
                </Button>
              </div>

              <SortableContext
                items={column.tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2 px-2 pb-2">
                  {column.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      users={users}
                      onClick={() => setSelectedTaskId(task.id)}
                      onToggleComplete={handleToggleComplete}
                    />
                  ))}
                </div>
              </SortableContext>

              <div className="px-2 pb-2">
                <InlineTaskComposer
                  sectionId={column.id === "unsorted" ? "" : column.id}
                  projectId={projectId}
                  onTaskCreated={fetchData}
                />
              </div>
            </div>
          ))}

          {addingSection ? (
            <div className="flex w-72 shrink-0 flex-col rounded-lg border border-dashed p-3">
              <Input
                placeholder="Section name..."
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSection();
                  if (e.key === "Escape") {
                    setAddingSection(false);
                    setNewSectionName("");
                  }
                }}
                autoFocus
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateSection}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAddingSection(false);
                    setNewSectionName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex w-72 shrink-0 flex-col">
              <Button
                variant="ghost"
                className="justify-start text-muted-foreground"
                onClick={() => setAddingSection(true)}
              >
                <Plus className="mr-2 size-4" />
                Add section
              </Button>
            </div>
          )}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rounded-lg border bg-card p-3 shadow-lg ring-2 ring-primary/20">
              <p className="text-sm font-medium">{activeTask.name}</p>
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
