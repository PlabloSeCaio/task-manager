"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, User, CheckCircle2, Heart, Link2, Maximize2, Minimize2, MoreHorizontal, X, Plus, Paperclip, ChevronDown, Clock, Search, Trash2, Upload } from "lucide-react";
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
  const [expanded, setExpanded] = useState(false);
  const [members, setMembers] = useState<UserType[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTask = useCallback(async () => {
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
  }, [taskId]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/followers`);
      const json = await res.json();
      if (json.data) setMembers(json.data);
    } catch {}
  }, [taskId]);

  useEffect(() => {
    if (open && taskId) {
      fetchTask();
      fetchMembers();
    }
  }, [open, taskId, fetchTask, fetchMembers]);

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

  useEffect(() => {
    if (!open || !task) return;
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
    const handleDragLeave = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFileUpload(files);
      }
    };
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);
    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
    };
  }, [open, task, taskId]);

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

  const handleDuplicate = async () => {
    try {
      await fetch(`/api/tasks/${taskId}/duplicate`, { method: "POST" });
      onUpdate();
    } catch (err) {
      console.error("Failed to duplicate task", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      onClose();
      onUpdate();
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const handleFollowUp = async () => {
    if (!task) return;
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          sectionId: task.sectionId,
          name: `Follow up: ${task.name}`,
        }),
      });
      onUpdate();
    } catch (err) {
      console.error("Failed to create follow-up task", err);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/followers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      await fetchMembers();
    } catch (err) {
      console.error("Failed to add member", err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/followers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      await fetchMembers();
    } catch (err) {
      console.error("Failed to remove member", err);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      try {
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || "application/octet-stream",
          }),
        });
        const presignJson = await presignRes.json();
        if (presignJson.error && presignJson.error.includes("not configured")) {
          console.warn("File storage not configured, skipping upload");
          continue;
        }
        const { uploadUrl, key } = presignJson.data;
        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });
        await fetch(`/api/tasks/${taskId}/attachments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key,
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            sizeBytes: file.size,
          }),
        });
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
    await fetchTask();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const assignedUser = users.find((u) => u.id === task?.assigneeId);
  const projectColor = task && task.projectId ? getProjectColor(task.projectId) : "bg-blue-500";

  function renderContent(t: Task) {
    return (
      <>
        {dragOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="rounded-lg border-2 border-dashed border-primary p-8 text-center">
              <Upload className="mx-auto mb-2 size-8 text-primary" />
              <p className="text-sm font-medium">Drop files to attach to this task</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-1">
            <Button
              variant={t.completed ? "default" : "ghost"}
              size="xs"
              onClick={() => handleUpdate({ completed: !t.completed })}
            >
              <CheckCircle2 className="mr-1 size-3.5" />
              {t.completed ? "Completed" : "Mark complete"}
            </Button>
            <Popover>
              <PopoverTrigger>
                <Button variant="ghost" size="icon-xs" title="Members">
                  <User className="size-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="start" className="w-64 p-0" sideOffset={4}>
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Members</span>
                  <span className="text-xs text-muted-foreground">{members.length}</span>
                </div>
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Name or email"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="h-8 pl-7 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto px-2 pb-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarImage src={m.avatarUrl || undefined} />
                          <AvatarFallback className="text-[10px]">{m.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{m.name}</span>
                      </div>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleRemoveMember(m.id)}>
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                  {users.filter((u) => !members.find((m) => m.id === u.id) && (!memberSearch || u.name?.toLowerCase().includes(memberSearch.toLowerCase()) || u.email?.toLowerCase().includes(memberSearch.toLowerCase()))).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleAddMember(u.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="size-6">
                        <AvatarImage src={u.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px]">{u.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{u.name || u.email}</span>
                      <Plus className="ml-auto size-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleUpdate({ liked: !t.liked })}
            >
              <Heart
                className={cn(
                  "size-3.5",
                  t.liked && "fill-red-500 text-red-500"
                )}
              />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => navigator.clipboard.writeText(window.location.href)}>
              <Link2 className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => setExpanded(!expanded)}>
              {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon-xs">
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => {
                  fetch("/api/projects").then(r => r.json()).then(json => {
                    if (json.data && json.data.length > 0) {
                      handleUpdate({ projectId: json.data[0].id });
                    }
                  });
                }}>
                  <Plus className="mr-2 size-3.5" /> Add to another project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => subtaskInputRef.current?.focus()}>
                  <Plus className="mr-2 size-3.5" /> Add subtask
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  <Plus className="mr-2 size-3.5" /> Add tags
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="mr-2 size-3.5" /> Attach files
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFollowUp}>
                  <Plus className="mr-2 size-3.5" /> Create follow-up task
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <Plus className="mr-2 size-3.5" /> Merge duplicate tasks
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Plus className="mr-2 size-3.5" /> Convert to
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Plus className="mr-2 size-3.5" /> Duplicate task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  <Plus className="mr-2 size-3.5" /> Print
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 size-3.5" /> Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <Popover>
              <PopoverTrigger className="w-full">
                <div className="flex items-center gap-3 py-2 border-b border-border/50 hover:bg-muted/30 cursor-pointer rounded-sm px-1 -mx-1 transition-colors">
                  <div className="flex w-5 shrink-0 items-center justify-center text-muted-foreground">
                    <User className="size-4" />
                  </div>
                  <span className="w-24 text-xs text-muted-foreground">Assignee</span>
                  <div className="flex-1 text-sm text-left">
                    {assignedUser ? (
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
                    )}
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="start" className="w-64 p-0" sideOffset={4}>
                <AssigneePopoverContent
                  users={users}
                  value={t.assigneeId}
                  onChange={(userId) => {
                    handleUpdate({ assigneeId: userId });
                  }}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger className="w-full">
                <div className="flex items-center gap-3 py-2 border-b border-border/50 hover:bg-muted/30 cursor-pointer rounded-sm px-1 -mx-1 transition-colors">
                  <div className="flex w-5 shrink-0 items-center justify-center text-muted-foreground">
                    <CalendarDays className="size-4" />
                  </div>
                  <span className="w-24 text-xs text-muted-foreground">Due date</span>
                  <div className="flex-1 text-sm text-left">
                    {t.dueOn ? (
                      <span>{format(new Date(t.dueOn), "MMM d, yyyy")}</span>
                    ) : (
                      <span className="text-muted-foreground">No due date</span>
                    )}
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="start" className="w-[280px] p-0" sideOffset={4}>
                <DueDatePopoverContent
                  value={t.dueOn ? typeof t.dueOn === "string" ? t.dueOn : format(new Date(t.dueOn), "yyyy-MM-dd") : null}
                  onChange={(date) => {
                    handleUpdate({ dueOn: date });
                  }}
                />
              </PopoverContent>
            </Popover>

            <DetailRow
              icon={<Clock className="size-4" />}
              label="Dependencies"
              value={<span className="text-muted-foreground">Add dependencies</span>}
            />
          </div>

          <div className="mt-4 border-t px-5 py-3">
            <Popover>
              <PopoverTrigger className="w-full">
                <div className="flex items-center gap-2 text-sm hover:bg-muted/30 cursor-pointer rounded-sm px-1 -mx-1 py-1 transition-colors">
                  <span className={cn("flex size-4 shrink-0 items-center justify-center rounded text-[8px] font-bold text-white", projectColor)}>
                    {t.name?.charAt(0)?.toUpperCase() || "T"}
                  </span>
                  <span className="text-muted-foreground">Projects</span>
                  <span className="font-medium">{getProjectName(t)}</span>
                  {t.sectionId && (
                    <>
                      <ChevronDown className="size-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {sections.find((s) => s.id === t.sectionId)?.name || "No section"}
                      </span>
                    </>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="start" className="w-56 p-1" sideOffset={4}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section</div>
                {sections.length === 0 && (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">No sections</div>
                )}
                {sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleUpdate({ sectionId: s.id })}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors",
                      t.sectionId === s.id && "bg-muted font-medium"
                    )}
                  >
                    <span className={cn("size-2 rounded-full", getSectionColor(s.id))} />
                    {s.name}
                  </button>
                ))}
                <div className="border-t mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => handleUpdate({ sectionId: null })}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <X className="size-3" />
                    Remove section
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="border-t px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</h4>
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
              workspaceId={t.workspaceId}
              projectId={t.projectId}
              sectionId={t.sectionId}
              onUpdate={onUpdate}
              ref={subtaskInputRef}
            />
          </div>

          <div className="border-t px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Attachments ({attachments.length})
              </h4>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <FileUploader taskId={taskId} onUploadComplete={fetchTask} />
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                    <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm">{att.filename}</span>
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
                  {t.createdAt
                    ? formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })
                    : "recently"}
                </p>
              </div>
            )}

            {activityTab === "comments" && (
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet</p>
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
                            {comment.createdAt ? format(new Date(comment.createdAt), "MMM d, yyyy") : ""}
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
              <Button size="xs" onClick={handleAddComment} disabled={!newComment.trim()}>
                Send
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (expanded && task) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex-1 overflow-y-auto">{renderContent(task)}</div>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:min-w-[640px] sm:max-w-[760px] lg:w-1/3 p-0 flex flex-col"
        showCloseButton={false}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : task ? (
          renderContent(task)
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Task not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AssigneePopoverContent({
  users,
  value,
  onChange,
}: {
  users: UserType[];
  value: string | null;
  onChange: (userId: string | null) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = users.filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const assignedUser = users.find((u) => u.id === value);

  return (
    <>
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignee</span>
        <button onClick={() => onChange(null)} className="flex size-5 items-center justify-center rounded hover:bg-muted transition-colors">
          <X className="size-3" />
        </button>
      </div>
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-7 text-sm" />
        </div>
      </div>
      {assignedUser && (
        <div className="px-2 pb-1">
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors text-muted-foreground"
          >
            <X className="size-3" />
            <span>Remove assignee</span>
          </button>
        </div>
      )}
      <div className="max-h-40 overflow-y-auto px-2 pb-2">
        {filtered.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onChange(u.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors",
              u.id === value && "bg-muted font-medium"
            )}
          >
            <Avatar className="size-6">
              <AvatarImage src={u.avatarUrl || undefined} />
              <AvatarFallback className="text-[10px]">{u.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <span className="truncate">{u.name || u.email}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function DueDatePopoverContent({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (date: string | null) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due date</span>
        <button onClick={() => { onChange(null); }} className="flex size-5 items-center justify-center rounded hover:bg-muted transition-colors">
          <X className="size-3" />
        </button>
      </div>
      <Calendar
        mode="single"
        selected={value ? new Date(value) : undefined}
        onSelect={(date) => {
          if (!date) return;
          onChange(format(date, "yyyy-MM-dd"));
        }}
        className="border-0"
      />
      <div className="flex items-center justify-between border-t px-3 py-2">
        <Button variant="ghost" size="xs" onClick={() => {
          const today = format(new Date(), "yyyy-MM-dd");
          onChange(today);
        }}>
          Today
        </Button>
        <Button variant="ghost" size="xs" onClick={() => onChange(null)}>
          Clear
        </Button>
      </div>
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 py-2 border-b border-border/50 last:border-0",
        onClick && "cursor-pointer hover:bg-muted/30 rounded-sm px-1 -mx-1 transition-colors"
      )}
    >
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

function getSectionColor(sectionId: string): string {
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-red-500", "bg-yellow-500",
    "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500",
  ];
  const index = sectionId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[index % colors.length];
}

function getProjectName(task: Task | null): string {
  return "Project";
}


