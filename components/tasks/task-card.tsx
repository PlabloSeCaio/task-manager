"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "z-50 opacity-50 shadow-lg",
        task.completed && "opacity-60"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          className="mt-0.5 cursor-grab text-muted-foreground/30 hover:text-muted-foreground touch-none"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="flex-1 min-w-0" onClick={onClick}>
          <p
            className={cn(
              "text-sm font-medium",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.name}
          </p>
          {task.dueOn && (
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(task.dueOn).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
