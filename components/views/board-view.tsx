"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useParams } from "next/navigation";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { cn } from "@/lib/utils";
import type { Section, Task } from "@/types";

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
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [newTaskNames, setNewTaskNames] = useState<Record<string, string>>({});
  const [addingTaskColumn, setAddingTaskColumn] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const fetchData = useCallback(async () => {
    try {
      const [sectionsRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/sections`),
        fetch(`/api/tasks?projectId=${projectId}`),
      ]);
      const sJson = await sectionsRes.json();
      const tJson = await tasksRes.json();
      if (sJson.data) setSections(sJson.data);
      if (tJson.data) setTasks(tJson.data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTaskData = tasks.find((t) => t.id === active.id);
    if (!activeTaskData) return;

    let newSectionId: string | null = null;

    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) {
      newSectionId = overTask.sectionId || null;
    } else {
      const overColumn = columns.find((c) => c.id === over.id);
      if (overColumn) {
        newSectionId = overColumn.id === "unsorted" ? null : overColumn.id;
      }
    }

    if (newSectionId !== activeTaskData.sectionId) {
      try {
        await fetch(`/api/tasks/${active.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionId: newSectionId,
            position: 0,
          }),
        });
        await fetchData();
      } catch (err) {
        console.error("Failed to move task", err);
      }
    }
  };

  const handleCreateTask = async (sectionId: string) => {
    const name = newTaskNames[sectionId]?.trim();
    if (!name) return;
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: "00000000-0000-0000-0000-000000000000",
          projectId,
          sectionId,
          name,
        }),
      });
      setNewTaskNames((prev) => ({ ...prev, [sectionId]: "" }));
      setAddingTaskColumn(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

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
                      onClick={() => setSelectedTaskId(task.id)}
                    />
                  ))}
                </div>
              </SortableContext>

              <div className="px-2 pb-2">
                {addingTaskColumn === column.id ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="Task name..."
                      value={newTaskNames[column.id] || ""}
                      onChange={(e) =>
                        setNewTaskNames((prev) => ({
                          ...prev,
                          [column.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateTask(column.id);
                        if (e.key === "Escape") {
                          setAddingTaskColumn(null);
                          setNewTaskNames((prev) => ({ ...prev, [column.id]: "" }));
                        }
                      }}
                      autoFocus
                      className="h-8 text-sm"
                      onBlur={() => {
                        if (!newTaskNames[column.id]?.trim()) {
                          setAddingTaskColumn(null);
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleCreateTask(column.id)}>
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAddingTaskColumn(null);
                          setNewTaskNames((prev) => ({ ...prev, [column.id]: "" }));
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => setAddingTaskColumn(column.id)}
                  >
                    <Plus className="mr-1 size-3" />
                    Add task
                  </Button>
                )}
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
            <div className="rounded-lg border bg-card p-3 shadow-lg">
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
