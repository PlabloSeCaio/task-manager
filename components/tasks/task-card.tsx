"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CalendarDays, CheckCircle2 } from "lucide-react";
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
        "group rounded-lg border bg-card px-3 py-2 shadow-sm transition-shadow hover:shadow-md cursor-pointer",
        isDragging && "z-50 opacity-50 shadow-lg",
        task.completed && "opacity-60"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          className="mt-0.5 cursor-grab text-muted-foreground/30 hover:text-muted-foreground touch-none shrink-0"
        >
          <GripVertical className="size-3.5" />
        </button>
        <div className="flex-1 min-w-0" onClick={onClick}>
          <p
            className={cn(
              "text-sm",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.name}
          </p>
          {task.dueOn && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3" />
              <span>{new Date(task.dueOn).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        {task.completed && (
          <CheckCircle2 className="size-4 shrink-0 text-green-500 mt-0.5" />
        )}
      </div>
    </div>
  );
}
