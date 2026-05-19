"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, MessageSquare, Heart, Check, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isPast, parseISO } from "date-fns";
import type { Task, User } from "@/types";

interface TaskCardProps {
  task: Task & { commentCount?: number; attachmentCount?: number; latestImageUrl?: string | null };
  users: User[];
  onClick: () => void;
  onToggleComplete: (task: Task) => void;
}

export function TaskCard({ task, users, onClick, onToggleComplete }: TaskCardProps) {
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

  const dueLabel = dueDate
    ? isOverdue
      ? format(dueDate, "MMM d")
      : format(dueDate, "MMM d")
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "group rounded-lg border bg-card shadow-sm transition-all hover:shadow-md hover:border-border/80 cursor-pointer overflow-hidden",
        isDragging && "z-50 opacity-50 shadow-lg ring-2 ring-primary/20",
        task.completed && "opacity-60"
      )}
    >
      {task.latestImageUrl && (
        <div className="w-full h-28 overflow-hidden -mb-1">
          <img
            src={task.latestImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleComplete(task); }}
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
            task.completed
              ? "border-green-500 bg-green-500 text-white"
              : "border-muted-foreground/30 hover:border-muted-foreground/50 bg-transparent"
          )}
        >
          {task.completed && <Check className="size-3" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm leading-snug",
              task.completed && "line-through text-muted-foreground/60"
            )}
          >
            {task.name}
          </p>

          <div className="mt-1.5 flex items-center gap-3">
            {assignee && (
              <div className="flex items-center gap-1">
                <Avatar className="size-4">
                  <AvatarImage src={assignee.avatarUrl || undefined} />
                  <AvatarFallback className="text-[6px] font-medium">
                    {(assignee.name || assignee.email || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {dueLabel && (
              <div className={cn(
                "flex items-center gap-1 text-[11px]",
                isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
              )}>
                <CalendarDays className="size-3" />
                <span>{dueLabel}</span>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {(task.commentCount ?? 0) > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MessageSquare className="size-3" />
                  <span>{task.commentCount}</span>
                </div>
              )}
              {(task.attachmentCount ?? 0) > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Paperclip className="size-3" />
                  <span>{task.attachmentCount}</span>
                </div>
              )}
              {task.likeCount != null && task.likeCount > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Heart className={cn("size-3", task.liked && "fill-red-500 text-red-500")} />
                  <span>{task.likeCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 cursor-grab text-muted-foreground/0 hover:text-muted-foreground/30 group-hover:text-muted-foreground/30 touch-none shrink-0 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="4" cy="3" r="1.2" />
            <circle cx="8" cy="3" r="1.2" />
            <circle cx="4" cy="6" r="1.2" />
            <circle cx="8" cy="6" r="1.2" />
            <circle cx="4" cy="9" r="1.2" />
            <circle cx="8" cy="9" r="1.2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
