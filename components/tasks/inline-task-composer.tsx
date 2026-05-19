"use client";

import { useState, useRef } from "react";
import { CheckCircle, Plus } from "lucide-react";
import { AssigneePopover } from "@/components/tasks/assignee-popover";
import { DueDatePopover } from "@/components/tasks/due-date-popover";

interface InlineTaskComposerProps {
  sectionId: string;
  projectId: string;
  onTaskCreated: () => void;
}

export function InlineTaskComposer({
  sectionId,
  projectId,
  onTaskCreated,
}: InlineTaskComposerProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueOn, setDueOn] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: "00000000-0000-0000-0000-000000000000",
          projectId,
          sectionId,
          name: trimmed,
          assigneeId: assigneeId || undefined,
          dueOn: dueOn || undefined,
        }),
      });
      setName("");
      setAssigneeId(null);
      setDueOn(null);
      setOpen(false);
      onTaskCreated();
    } catch (err) {
      console.error("Failed to create task", err);
    } finally {
      setCreating(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Plus className="size-3.5" />
        <span>Add task</span>
      </button>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <CheckCircle className="size-4 shrink-0 text-muted-foreground/40" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Write a task name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
            if (e.key === "Escape") {
              setOpen(false);
              setName("");
            }
          }}
          onBlur={() => {
            if (!name.trim()) {
              setOpen(false);
            }
          }}
          className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          autoFocus
        />
        <AssigneePopover value={assigneeId} onChange={setAssigneeId} />
        <DueDatePopover
          value={dueOn}
          startValue={null}
          onChange={setDueOn}
        />
      </div>
    </div>
  );
}
