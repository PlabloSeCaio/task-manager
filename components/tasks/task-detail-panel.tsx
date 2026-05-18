"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  User,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";
import type { Task, Comment, Attachment } from "@/types";

interface TaskDetailPanelProps {
  taskId: string;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function TaskDetailPanel({
  taskId,
  open,
  onClose,
  onUpdate,
}: TaskDetailPanelProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");

  const fetchTask = async () => {
    setLoading(true);
    try {
      const [taskRes, commentsRes, attachmentsRes] = await Promise.all([
        fetch(`/api/tasks/${taskId}`),
        fetch(`/api/tasks/${taskId}/comments`),
        fetch(`/api/tasks/${taskId}/attachments`),
      ]);
      const taskJson = await taskRes.json();
      const commentsJson = await commentsRes.json();
      const attachmentsJson = await attachmentsRes.json();
      if (taskJson.data) setTask(taskJson.data);
      if (commentsJson.data) setComments(commentsJson.data);
      if (attachmentsJson.data) setAttachments(attachmentsJson.data);
    } catch (err) {
      console.error("Failed to fetch task details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && taskId) fetchTask();
  }, [open, taskId]);

  const handleUpdate = async (updates: Record<string, unknown>) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await fetchTask();
      onUpdate();
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment }),
      });
      setNewComment("");
      await fetchTask();
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      onClose();
      onUpdate();
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : task ? (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-start gap-2">
                <SheetTitle className="flex-1">
                  <Input
                    value={task.name}
                    onChange={(e) => {
                      setTask({ ...task, name: e.target.value });
                    }}
                    onBlur={() => handleUpdate({ name: task.name })}
                    className="border-0 p-0 text-lg font-semibold focus-visible:ring-0"
                  />
                </SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </SheetHeader>

            <div className="flex items-center gap-2">
              <Button
                variant={task.completed ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  handleUpdate({ completed: !task.completed })
                }
              >
                <CheckCircle2 className="mr-1 size-4" />
                {task.completed ? "Completed" : "Mark Complete"}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Assignee:</span>
                <span>{task.assigneeId || "Unassigned"}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due date:</span>
                <span>
                  {task.dueOn
                    ? new Date(task.dueOn).toLocaleDateString()
                    : "No due date"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span>
                  {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "Unknown"}
                </span>
              </div>

              {task.subtype !== "default" && (
                <Badge variant="secondary">{task.subtype}</Badge>
              )}
            </div>

            {task.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 text-sm font-medium">Notes</h4>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {task.notes}
                  </p>
                </div>
              </>
            )}

            <Separator />

            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Paperclip className="size-4" />
                Attachments ({attachments.length})
              </h4>
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attachments</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
                    >
                      <Paperclip className="size-4 text-muted-foreground" />
                      <span className="text-sm">{att.filename}</span>
                      {att.sizeBytes && (
                        <span className="text-xs text-muted-foreground">
                          ({(att.sizeBytes / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="size-4" />
                Comments ({comments.length})
              </h4>

              <div className="mb-4 space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-md bg-muted/50 p-3"
                  >
                    <p className="text-sm">{comment.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddComment();
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Task not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
