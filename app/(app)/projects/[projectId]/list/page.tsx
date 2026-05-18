"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { cn } from "@/lib/utils";
import type { Section, Task } from "@/types";

export default function ProjectListView() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [sections, setSections] = useState<Section[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newTaskNames, setNewTaskNames] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      const [sectionsRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/sections`),
        fetch(`/api/tasks?projectId=${projectId}&completed=false`),
      ]);
      const sectionsJson = await sectionsRes.json();
      const tasksJson = await tasksRes.json();
      if (sectionsJson.data) setSections(sectionsJson.data);
      if (tasksJson.data) setTasks(tasksJson.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleCreateTask = async (sectionId: string) => {
    const name = newTaskNames[sectionId]?.trim();
    if (!name) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: "00000000-0000-0000-0000-000000000000",
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

  const handleToggleComplete = async (task: Task) => {
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to toggle task", err);
    }
  };

  const groupedTasks = (sectionId: string) =>
    tasks.filter((t) => t.sectionId === sectionId);

  const ungroupedTasks = tasks.filter(
    (t) => !t.sectionId || !sections.find((s) => s.id === t.sectionId)
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {sections.map((section) => (
        <div key={section.id} className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <GripVertical className="size-4 text-muted-foreground" />
            <h3 className="font-medium text-muted-foreground">
              {section.name}
            </h3>
            <Badge variant="secondary" className="ml-1">
              {groupedTasks(section.id).length}
            </Badge>
          </div>

          <div className="space-y-0.5">
            {groupedTasks(section.id).map((task) => (
              <div
                key={task.id}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 cursor-pointer"
                onClick={() => setSelectedTaskId(task.id)}
              >
                <Checkbox
                  checked={!!task.completed}
                  onCheckedChange={() => handleToggleComplete(task)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span
                  className={cn(
                    "flex-1 text-sm",
                    task.completed && "text-muted-foreground line-through"
                  )}
                >
                  {task.name}
                </span>
                {task.dueOn && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(task.dueOn).toLocaleDateString()}
                  </span>
                )}
                {task.assigneeId && (
                  <Badge variant="outline" className="text-xs">
                    Assigned
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="mt-1 flex items-center gap-2 px-3">
            <Plus className="size-4 text-muted-foreground" />
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
              className="h-8 border-0 bg-transparent px-0 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0"
            />
          </div>
        </div>
      ))}

      {ungroupedTasks.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <GripVertical className="size-4 text-muted-foreground" />
            <h3 className="font-medium text-muted-foreground">
              Unsorted
            </h3>
            <Badge variant="secondary">{ungroupedTasks.length}</Badge>
          </div>
          <div className="space-y-0.5">
            {ungroupedTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 cursor-pointer"
                onClick={() => setSelectedTaskId(task.id)}
              >
                <Checkbox
                  checked={!!task.completed}
                  onCheckedChange={() => handleToggleComplete(task)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span
                  className={cn(
                    "flex-1 text-sm",
                    task.completed && "text-muted-foreground line-through"
                  )}
                >
                  {task.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sections.length === 0 && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground">
            No tasks yet. Add one above.
          </p>
        </div>
      )}

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
