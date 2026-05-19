"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CalendarDays,
  User,
  CheckCircle2,
  Heart,
  Link2,
  Maximize2,
  MoreHorizontal,
  X,
  MessageSquare,
  Plus,
  Paperclip,
  ChevronDown,
  Clock,
} from "lucide-react";
import { FileUploader } from "@/components/shared/file-uploader";
import { SubtaskList } from "@/components/tasks/subtask-list";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import type { Task, Comment, Attachment, User as UserType, Section } from "@/types";

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
  const [users, setUsers] = useState<UserType[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [activityTab, setActivityTab] = useState<"comments" | "activity">("comments");
  const titleRef = useRef<HTMLInputElement>(null);

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
      if (taskJson.data) {
        setTask(taskJson.data);
        setTitle(taskJson.data.name || "");
        setNotes(taskJson.data.notes || "");
      }
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

  useEffect(() => {
    if (!open || !task) return;
    fetch("/api/users")
      .then((res) => res.json())
      .then((json) => { if (json.data) setUsers(json.data); })
      .catch(() => {});
    fetch(`/api/projects/${task.projectId}/sections`)
      .then((res) => res.json())
      .then((json) => { if (json.data) setSections(json.data); })
      .catch(() => {});
  }, [open, task?.projectId]);

  const handleUpdate = async (updates: Record<string, unknown>) => {
    if (!task) return;
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

  const handleTitleBlur = () => {
    if (task && title !== task.name) {
      handleUpdate({ name: title });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleNotesBlur = () => {
    if (notes !== (task?.notes || "")) {
      handleUpdate({ notes });
    }
  };

  const assignedUser = users.find((u) => u.id === task?.assigneeId);
  const projectColor = task ? getProjectColor(task.projectId) : "bg-blue-500";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[700px] p-0 flex flex-col"
        showCloseButton={false}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : task ? (
          <>
            <div className="flex items-center justify-between border-b px-4 py-2">
              <div className="flex items-center gap-1">
                <Button
                  variant={task.completed ? "default" : "ghost"}
                  size="xs"
                  onClick={() => handleUpdate({ completed: !task.completed })}
                >
                  <CheckCircle2 className="mr-1 size-3.5" />
                  {task.completed ? "Completed" : "Mark complete"}
                </Button>
                <Button variant="ghost" size="icon-xs" title="Share">
                  <User className="size-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleUpdate({ liked: !task.liked })}
                >
                  <Heart
                    className={cn(
                      "size-3.5",
                      task.liked && "fill-red-500 text-red-500"
                    )}
                  />
                </Button>
                <Button variant="ghost" size="icon-xs">
                  <Link2 className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-xs">
                  <Maximize2 className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-xs">
                  <MoreHorizontal className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-4">
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  placeholder="Write a task name"
                  className="w-full border-0 bg-transparent text-xl font-semibold outline-none placeholder:text-muted-foreground/40"
                />
              </div>

              <div className="space-y-0 px-5">
                <DetailRow
                  icon={<User className="size-4" />}
                  label="Assignee"
                  value={
                    assignedUser ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="size-5">
                          <AvatarImage src={assignedUser.avatarUrl || undefined} />
                          <AvatarFallback className="text-[9px]">
                            {assignedUser.name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{assignedUser.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No assignee</span>
                    )
                  }
                />
                <DetailRow
                  icon={<CalendarDays className="size-4" />}
                  label="Due date"
                  value={
                    task.dueOn ? (
                      <span>{format(new Date(task.dueOn), "MMM d, yyyy")}</span>
                    ) : (
                      <span className="text-muted-foreground">No due date</span>
                    )
                  }
                />
                <DetailRow
                  icon={<Clock className="size-4" />}
                  label="Dependencies"
                  value={<span className="text-muted-foreground">Add dependencies</span>}
                />
              </div>

              <div className="mt-4 border-t px-5 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded text-[8px] font-bold text-white",
                      projectColor
                    )}
                  >
                    {task.name?.charAt(0)?.toUpperCase() || "T"}
                  </span>
                  <span className="text-muted-foreground">Projects</span>
                  <span className="font-medium">{getProjectName(task)}</span>
                  {task.sectionId && (
                    <>
                      <ChevronDown className="size-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {sections.find((s) => s.id === task.sectionId)?.name || "No section"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Description
                  </h4>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="What is this task about?"
                  className="min-h-[60px] resize-y border-0 bg-muted/30 p-2 text-sm rounded-md"
                />
              </div>

              <div className="border-t px-5 py-4">
                <SubtaskList
                  taskId={taskId}
                  workspaceId={task.workspaceId}
                  projectId={task.projectId}
                  sectionId={task.sectionId}
                  onUpdate={onUpdate}
                />
              </div>

              <div className="border-t px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Attachments ({attachments.length})
                  </h4>
                </div>
                <FileUploader taskId={taskId} onUploadComplete={fetchTask} />
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
                      >
                        <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate text-sm">
                          {att.filename}
                        </span>
                        {att.sizeBytes && (
                          <span className="text-xs text-muted-foreground">
                            {(att.sizeBytes / 1024).toFixed(0)} KB
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t bg-card">
              <div className="flex items-center gap-4 border-b px-5">
                <button
                  onClick={() => setActivityTab("comments")}
                  className={cn(
                    "py-2 text-xs font-medium border-b-2 transition-colors",
                    activityTab === "comments"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Comments
                </button>
                <button
                  onClick={() => setActivityTab("activity")}
                  className={cn(
                    "py-2 text-xs font-medium border-b-2 transition-colors",
                    activityTab === "activity"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  All activity
                </button>
                <span className="ml-auto text-xs text-muted-foreground">Oldest</span>
              </div>

              <div className="max-h-48 overflow-y-auto px-5 py-3">
                {activityTab === "activity" && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Avatar className="size-6">
                      <AvatarFallback className="text-[9px]">U</AvatarFallback>
                    </Avatar>
                    <p>
                      <span className="font-medium text-foreground">User</span> created this task &middot;{" "}
                      {task.createdAt
                        ? formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })
                        : "recently"}
                    </p>
                  </div>
                )}

                {activityTab === "comments" && (
                  <div className="space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No comments yet
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2">
                          <Avatar className="size-6 shrink-0">
                            <AvatarFallback className="text-[9px]">U</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">User</span>
                              <span className="text-[10px] text-muted-foreground">
                                {comment.createdAt
                                  ? format(new Date(comment.createdAt), "MMM d, yyyy")
                                  : ""}
                              </span>
                            </div>
                            <p className="text-sm">{comment.body}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 border-t px-5 py-3">
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="text-xs">U</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                  />
                  <Button
                    size="xs"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Task not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="flex w-5 shrink-0 items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <span className="w-24 text-xs text-muted-foreground">{label}</span>
      <div className="flex-1 text-sm">{value}</div>
    </div>
  );
}

function getProjectColor(projectId: string): string {
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-red-500", "bg-yellow-500",
    "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500",
  ];
  const index = projectId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[index % colors.length];
}

function getProjectName(task: Task): string {
  return "Project";
}


