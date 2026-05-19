"use client";

import { useState, useEffect, forwardRef, useRef, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, CalendarDays, User, ChevronRight, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface SubtaskListProps {
  taskId: string;
  workspaceId: string;
  projectId?: string | null;
  sectionId?: string | null;
  onUpdate: () => void;
  onOpenTask?: (taskId: string) => void;
}

export const SubtaskList = forwardRef<HTMLInputElement, SubtaskListProps>(function SubtaskList({
  taskId,
  workspaceId,
  projectId,
  sectionId,
  onUpdate,
  onOpenTask,
}, ref) {
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [subSubtasksMap, setSubSubtasksMap] = useState<Record<string, Task[]>>({});
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const newInputRef = useRef<HTMLInputElement>(null);

  const fetchSubtasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`);
      const json = await res.json();
      if (json.data) {
        setSubtasks(json.data);
        const map: Record<string, Task[]> = {};
        await Promise.all(json.data.map(async (sub: Task) => {
          try {
            const subRes = await fetch(`/api/tasks/${sub.id}/subtasks`);
            const subJson = await subRes.json();
            if (subJson.data) map[sub.id] = subJson.data;
          } catch {}
        }));
        setSubSubtasksMap(map);
      }
    } catch (err) {
      console.error("Failed to fetch subtasks", err);
    }
  }, [taskId]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

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

  const handleSubToggle = async (subSub: Task) => {
    try {
      await fetch(`/api/tasks/${subSub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !subSub.completed }),
      });
      await fetchSubtasks();
      onUpdate();
    } catch (err) {
      console.error("Failed to toggle sub-subtask", err);
    }
  };

  const handleSubDelete = async (subSubId: string) => {
    try {
      await fetch(`/api/tasks/${subSubId}`, { method: "DELETE" });
      await fetchSubtasks();
      onUpdate();
    } catch (err) {
      console.error("Failed to delete sub-subtask", err);
    }
  };

  const createSubtask = async (name: string): Promise<Task | null> => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, projectId, sectionId, parentId: taskId, name }),
      });
      const json = await res.json();
      return json.data ?? null;
    } catch {
      return null;
    }
  };

  const createSubSubtask = async (parentId: string, name: string): Promise<Task | null> => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, projectId, sectionId, parentId, name }),
      });
      const json = await res.json();
      return json.data ?? null;
    } catch {
      return null;
    }
  };

  const handleAddSubtask = () => {
    const tempId = `new-${Date.now()}`;
    setSubtasks(prev => [...prev, { id: tempId, name: "", completed: false } as Task]);
    setEditingIds(prev => new Set(prev).add(tempId));
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-subtask-id="${tempId}"]`) as HTMLInputElement;
      el?.focus();
    });
  };

  const handleAddSubSubtask = (parentId: string) => {
    const tempId = `subnew-${Date.now()}`;
    const tempSub = { id: tempId, name: "", completed: false } as Task;
    setSubSubtasksMap(prev => ({ ...prev, [parentId]: [...(prev[parentId] || []), tempSub] }));
    setEditingIds(prev => new Set(prev).add(tempId));
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-subtask-id="${tempId}"]`) as HTMLInputElement;
      el?.focus();
    });
  };

  const handleSubtaskKeyDown = async (e: React.KeyboardEvent, tempId: string, name: string) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!name.trim()) {
      discardTemp(tempId);
      return;
    }
    const created = await createSubtask(name.trim());
    if (created) {
      setSubtasks(prev => {
        const filtered = prev.filter(s => s.id !== tempId);
        const nextTempId = `new-${Date.now()}`;
        const result = [...filtered, created, { id: nextTempId, name: "", completed: false } as Task];
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-subtask-id="${nextTempId}"]`) as HTMLInputElement;
          el?.focus();
        });
        return result;
      });
      setEditingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        next.add(`new-${Date.now()}`);
        return next;
      });
      onUpdate();
    }
  };

  const handleSubSubtaskKeyDown = async (e: React.KeyboardEvent, parentId: string, tempId: string, name: string) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!name.trim()) {
      discardSubTemp(parentId, tempId);
      return;
    }
    const created = await createSubSubtask(parentId, name.trim());
    if (created) {
      setSubSubtasksMap(prev => {
        const subs = prev[parentId] || [];
        const filtered = subs.filter(s => s.id !== tempId);
        const nextTempId = `subnew-${Date.now()}`;
        return { ...prev, [parentId]: [...filtered, created, { id: nextTempId, name: "", completed: false } as Task] };
      });
      setEditingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        next.add(`subnew-${Date.now()}`);
        return next;
      });
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-subtask-id="subnew-${Date.now()}"]`) as HTMLInputElement;
        el?.focus();
      });
      onUpdate();
    }
  };

  const handleSubtaskBlur = async (tempId: string, name: string) => {
    if (!name.trim()) {
      discardTemp(tempId);
      return;
    }
    if (tempId.startsWith("new-") || tempId.startsWith("subnew-")) {
      const created = tempId.startsWith("subnew-")
        ? await createSubtask(name.trim())
        : await createSubtask(name.trim());
      if (created) {
        setSubtasks(prev => prev.map(s => s.id === tempId ? created : s));
        setEditingIds(prev => { const next = new Set(prev); next.delete(tempId); return next; });
        onUpdate();
      }
    }
  };

  const handleSubSubtaskBlur = async (parentId: string, tempId: string, name: string) => {
    if (!name.trim()) {
      discardSubTemp(parentId, tempId);
      return;
    }
    const created = await createSubSubtask(parentId, name.trim());
    if (created) {
      setSubSubtasksMap(prev => ({
        ...prev,
        [parentId]: (prev[parentId] || []).map(s => s.id === tempId ? created : s),
      }));
      setEditingIds(prev => { const next = new Set(prev); next.delete(tempId); return next; });
      onUpdate();
    }
  };

  const discardTemp = (tempId: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== tempId));
    setEditingIds(prev => { const next = new Set(prev); next.delete(tempId); return next; });
  };

  const discardSubTemp = (parentId: string, tempId: string) => {
    setSubSubtasksMap(prev => ({
      ...prev,
      [parentId]: (prev[parentId] || []).filter(s => s.id !== tempId),
    }));
    setEditingIds(prev => { const next = new Set(prev); next.delete(tempId); return next; });
  };

  const completed = subtasks.reduce((acc, s) => {
    const subSubs = subSubtasksMap[s.id] || [];
    const subCompleted = subSubs.filter((ss) => ss.completed).length;
    return acc + (s.completed ? 1 : 0) + subCompleted;
  }, 0);
  const total = subtasks.reduce((acc, s) => {
    return acc + 1 + (subSubtasksMap[s.id] || []).length;
  }, 0);

  const hasNewRow = subtasks.some(s => s.id.startsWith("new-"));

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h4 className="text-sm font-medium">Subtasks</h4>
        {subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {completed}/{total}
          </span>
        )}
      </div>

      <div className="mb-2 space-y-0.5">
        {subtasks.map((sub) => {
          const isEditing = editingIds.has(sub.id);
          const isNew = sub.id.startsWith("new-");
          return (
            <div key={sub.id}>
              <div className="group flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-muted/50">
                <GripVertical className="size-3.5 shrink-0 text-muted-foreground/30 cursor-grab" />
                <Checkbox
                  checked={!!sub.completed}
                  onCheckedChange={() => handleToggle(sub)}
                  className="size-3.5"
                />
                {isEditing ? (
                  <input
                    data-subtask-id={sub.id}
                    type="text"
                    defaultValue=""
                    placeholder="Subtask name"
                    autoFocus
                    onChange={(e) => {
                      const val = e.target.value;
                      e.target.dataset.subtaskName = val;
                    }}
                    onKeyDown={(e) => handleSubtaskKeyDown(e, sub.id, (e.target as HTMLInputElement).dataset.subtaskName || "")}
                    onBlur={(e) => handleSubtaskBlur(sub.id, e.target.dataset.subtaskName || "")}
                    className="flex-1 border-0 bg-transparent px-0 text-sm outline-none placeholder:text-muted-foreground/40"
                  />
                ) : (
                  <span
                    className={cn(
                      "flex-1 text-sm cursor-pointer truncate",
                      sub.completed && "text-muted-foreground line-through"
                    )}
                    onClick={() => onOpenTask?.(sub.id)}
                  >
                    {sub.name}
                  </span>
                )}
                <button className="opacity-0 group-hover:opacity-100 size-5 flex items-center justify-center rounded hover:bg-muted transition-opacity">
                  <CalendarDays className="size-3 text-muted-foreground/60" />
                </button>
                <button className="opacity-0 group-hover:opacity-100 size-5 flex items-center justify-center rounded hover:bg-muted transition-opacity">
                  <User className="size-3 text-muted-foreground/60" />
                </button>
                {!isNew && (
                  <button
                    onClick={() => handleAddSubSubtask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 size-5 flex items-center justify-center rounded hover:bg-muted transition-opacity"
                  >
                    <Plus className="size-3 text-muted-foreground/60" />
                  </button>
                )}
                {isNew ? (
                  <button
                    onClick={() => discardTemp(sub.id)}
                    className="size-5 flex items-center justify-center rounded hover:bg-muted/50 transition-colors"
                  >
                    <Trash2 className="size-3 text-muted-foreground/60" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="opacity-0 group-hover:opacity-100 size-5 flex items-center justify-center rounded hover:bg-muted transition-opacity"
                  >
                    <ChevronRight className="size-3.5 text-muted-foreground/60" />
                  </button>
                )}
              </div>

              {(subSubtasksMap[sub.id] || []).length > 0 && (
                <div className="ml-5 border-l border-border/50 pl-3">
                  {(subSubtasksMap[sub.id] || []).map((subSub) => {
                    const isSubEditing = editingIds.has(subSub.id);
                    const isSubNew = subSub.id.startsWith("subnew-");
                    return (
                      <div key={subSub.id} className="group flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-muted/50">
                        <GripVertical className="size-3.5 shrink-0 text-muted-foreground/20 cursor-grab" />
                        <Checkbox
                          checked={!!subSub.completed}
                          onCheckedChange={() => handleSubToggle(subSub)}
                          className="size-3.5"
                        />
                        {isSubEditing ? (
                          <input
                            data-subtask-id={subSub.id}
                            type="text"
                            defaultValue=""
                            placeholder="Subtask name"
                            autoFocus
                            onChange={(e) => {
                              e.target.dataset.subtaskName = e.target.value;
                            }}
                            onKeyDown={(e) => handleSubSubtaskKeyDown(e, sub.id, subSub.id, (e.target as HTMLInputElement).dataset.subtaskName || "")}
                            onBlur={(e) => handleSubSubtaskBlur(sub.id, subSub.id, e.target.dataset.subtaskName || "")}
                            className="flex-1 border-0 bg-transparent px-0 text-sm outline-none placeholder:text-muted-foreground/40"
                          />
                        ) : (
                          <span
                            className={cn(
                              "flex-1 text-sm cursor-pointer truncate",
                              subSub.completed && "text-muted-foreground line-through"
                            )}
                            onClick={() => onOpenTask?.(subSub.id)}
                          >
                            {subSub.name}
                          </span>
                        )}
                        <button className="opacity-0 group-hover:opacity-100 size-5 flex items-center justify-center rounded hover:bg-muted transition-opacity">
                          <CalendarDays className="size-3 text-muted-foreground/60" />
                        </button>
                        <button className="opacity-0 group-hover:opacity-100 size-5 flex items-center justify-center rounded hover:bg-muted transition-opacity">
                          <User className="size-3 text-muted-foreground/60" />
                        </button>
                        {isSubNew ? (
                          <button
                            onClick={() => discardSubTemp(sub.id, subSub.id)}
                            className="size-5 flex items-center justify-center rounded hover:bg-muted/50 transition-colors"
                          >
                            <Trash2 className="size-3 text-muted-foreground/60" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSubDelete(subSub.id)}
                            className="opacity-0 group-hover:opacity-100 size-5 flex items-center justify-center rounded hover:bg-muted transition-opacity"
                          >
                            <ChevronRight className="size-3.5 text-muted-foreground/60" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!hasNewRow && (
        <button
          onClick={handleAddSubtask}
          className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <Plus className="size-4" />
          Add subtask
        </button>
      )}
    </div>
  );
});
