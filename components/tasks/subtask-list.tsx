"use client";

import { useState, useEffect, forwardRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface SubtaskListProps {
  taskId: string;
  workspaceId: string;
  projectId?: string | null;
  sectionId?: string | null;
  onUpdate: () => void;
}

export const SubtaskList = forwardRef<HTMLInputElement, SubtaskListProps>(function SubtaskList({
  taskId,
  workspaceId,
  projectId,
  sectionId,
  onUpdate,
}, ref) {
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newName, setNewName] = useState("");

  const fetchSubtasks = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`);
      const json = await res.json();
      if (json.data) setSubtasks(json.data);
    } catch (err) {
      console.error("Failed to fetch subtasks", err);
    }
  };

  useEffect(() => {
    fetchSubtasks();
  }, [taskId]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          projectId,
          sectionId,
          parentId: taskId,
          name: newName,
        }),
      });
      setNewName("");
      await fetchSubtasks();
      onUpdate();
    } catch (err) {
      console.error("Failed to create subtask", err);
    }
  };

  const handleToggle = async (subtask: Task) => {
    try {
      await fetch(`/api/tasks/${subtask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !subtask.completed }),
      });
      await fetchSubtasks();
      onUpdate();
    } catch (err) {
      console.error("Failed to toggle subtask", err);
    }
  };

  const handleDelete = async (subtaskId: string) => {
    try {
      await fetch(`/api/tasks/${subtaskId}`, { method: "DELETE" });
      await fetchSubtasks();
      onUpdate();
    } catch (err) {
      console.error("Failed to delete subtask", err);
    }
  };

  const completed = subtasks.filter((s) => s.completed).length;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h4 className="text-sm font-medium">Subtasks</h4>
        {subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {completed}/{subtasks.length}
          </span>
        )}
      </div>

      <div className="mb-2 space-y-1">
        {subtasks.map((sub) => (
          <div
            key={sub.id}
            className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
          >
            <Checkbox
              checked={!!sub.completed}
              onCheckedChange={() => handleToggle(sub)}
            />
            <span
              className={cn(
                "flex-1 text-sm",
                sub.completed && "text-muted-foreground line-through"
              )}
            >
              {sub.name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100"
              onClick={() => handleDelete(sub.id)}
            >
              <Trash2 className="size-3 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Plus className="size-4 text-muted-foreground shrink-0" />
        <Input
          ref={ref}
          placeholder="Add subtask..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          className="h-7 border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
        />
      </div>
    </div>
  );
});
