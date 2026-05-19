"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ListTodo,
  Clock,
  CheckCircle2,
  LayoutDashboard,
  Plus,
  MoreHorizontal,
  Lock,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";
import { NewProjectFlow } from "@/components/projects/new-project-flow";
import { useActiveOrg } from "@/components/layout/org-context";
import { cn } from "@/lib/utils";
import { format, isPast, isThisWeek, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { getProjectUrl } from "@/lib/utils";
import type { Task, Project, User } from "@/types";

const projectColorMap: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  orange: "bg-orange-500",
  teal: "bg-teal-500",
};

const colorFallback = ["blue", "teal", "purple", "yellow", "orange", "pink", "green"];

function getProjectColor(color?: string | null, index = 0): string {
  if (color && projectColorMap[color]) return projectColorMap[color];
  return projectColorMap[colorFallback[index % colorFallback.length]]!;
}

function getInitial(name?: string | null, email?: string | null): string {
  return (name || email || "?").charAt(0).toUpperCase();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatShortDate(d: string | Date): string {
  const date = typeof d === "string" ? parseISO(d) : d;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return format(date, "MMM d");
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { workspaceId } = useActiveOrg();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskTab, setTaskTab] = useState<"upcoming" | "overdue" | "completed">("upcoming");
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const [meRes, tasksRes, usersRes] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/tasks"),
          fetch("/api/users"),
        ]);

        const meJson = await meRes.json();
        const tasksJson = await tasksRes.json();
        const usersJson = await usersRes.json();

        if (cancelled) return;

        const me: User | undefined = meJson.data;
        const tasks: Task[] = tasksJson.data || [];
        const users: User[] = usersJson.data || [];

        setCurrentUser(me || null);
        setAllTasks(tasks);
        setAllUsers(users);

        if (me) setAllUsers((prev) => (prev.find((u) => u.id === me.id) ? prev : [me, ...prev]));

        if (workspaceId) {
          const projRes = await fetch(`/api/projects?workspaceId=${workspaceId}`);
          const projJson = await projRes.json();
          if (!cancelled) setProjects(projJson.data || []);
        }
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [workspaceId]);

  const myTasks = useMemo(
    () => allTasks.filter((t) => t.assigneeId === currentUser?.id),
    [allTasks, currentUser]
  );

  const myIncompleteTasks = useMemo(() => myTasks.filter((t) => !t.completed), [myTasks]);

  const counters = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    return {
      myTasksTotal: myIncompleteTasks.length,
      dueThisWeek: myTasks.filter((t) => {
        if (!t.dueOn || t.completed) return false;
        const d = typeof t.dueOn === "string" ? parseISO(t.dueOn) : new Date(t.dueOn);
        return d >= weekStart && d <= weekEnd;
      }).length,
      completed: myTasks.filter((t) => t.completed).length,
      projects: projects.length,
    };
  }, [myTasks, myIncompleteTasks, projects]);

  const handleToggleComplete = useCallback(async (task: Task) => {
    setAllTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
    } catch {
      setAllTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
    }
  }, []);

  const projectLookup = useMemo(() => {
    const map: Record<string, Project> = {};
    for (const p of projects) map[p.id] = p;
    return map;
  }, [projects]);

  const today = new Date();
  const greeting = getGreeting();
  const greetingName =
    currentUser?.name ||
    currentUser?.email?.split("@")[0] ||
    "there";
  const dateStr = formatDate(today);

  const filteredTasks = useMemo(() => {
    const now = new Date();
    switch (taskTab) {
      case "upcoming":
        return myIncompleteTasks.filter((t) => {
          if (!t.dueOn) return true;
          const d = typeof t.dueOn === "string" ? parseISO(t.dueOn) : new Date(t.dueOn);
          return d >= now;
        });
      case "overdue":
        return myIncompleteTasks.filter((t) => {
          if (!t.dueOn) return false;
          const d = typeof t.dueOn === "string" ? parseISO(t.dueOn) : new Date(t.dueOn);
          return isPast(d) && d.toDateString() !== now.toDateString();
        });
      case "completed":
        return myTasks.filter((t) => t.completed);
    }
  }, [myTasks, myIncompleteTasks, taskTab]);

  const getUserTaskStats = useCallback(
    (userId: string) => {
      const userTasks = allTasks.filter((t) => t.assigneeId === userId);
      const now = new Date();
      return {
        overdue: userTasks.filter((t) => {
          if (!t.dueOn || t.completed) return false;
          const d = typeof t.dueOn === "string" ? parseISO(t.dueOn) : new Date(t.dueOn);
          return isPast(d) && d.toDateString() !== now.toDateString();
        }).length,
        upcoming: userTasks.filter((t) => {
          if (t.completed) return false;
          if (!t.dueOn) return true;
          const d = typeof t.dueOn === "string" ? parseISO(t.dueOn) : new Date(t.dueOn);
          return d >= now;
        }).length,
        completed: userTasks.filter((t) => t.completed).length,
      };
    },
    [allTasks]
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-xl px-6">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="mt-6 grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="h-64 animate-pulse rounded-lg bg-muted" />
            <div className="h-64 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground/60">{dateStr}</p>
          <h1 className="mt-0.5 text-2xl font-semibold text-foreground/90">
            {greeting}, {greetingName}
          </h1>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "My Tasks", value: counters.myTasksTotal, icon: ListTodo, color: "text-blue-500" },
            { label: "Due This Week", value: counters.dueThisWeek, icon: Clock, color: "text-amber-500" },
            { label: "Completed", value: counters.completed, icon: CheckCircle2, color: "text-green-500" },
            { label: "Projects", value: counters.projects, icon: LayoutDashboard, color: "text-purple-500" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className={cn("shrink-0", item.color)}>
                <item.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground/70">{item.label}</p>
                <p className="text-xl font-semibold">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[8px]">
                      {getInitial(currentUser?.name, currentUser?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-sm font-medium">My tasks</h2>
                  <div className="group relative">
                    <Lock className="size-3 text-muted-foreground/40" />
                    <div className="pointer-events-none absolute -top-1 left-5 z-50 w-64 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100">
                      Tasks you add here are private to you unless you add collaborators or add the tasks to a shared project.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </div>

              <div className="flex border-b">
                {(["upcoming", "overdue", "completed"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTaskTab(tab)}
                    className={cn(
                      "px-4 py-2 text-xs font-medium transition-colors relative",
                      taskTab === tab
                        ? "text-foreground"
                        : "text-muted-foreground/60 hover:text-muted-foreground"
                    )}
                  >
                    {tab === "upcoming" && "Upcoming"}
                    {tab === "overdue" && "Overdue"}
                    {tab === "completed" && "Completed"}
                    {taskTab === tab && (
                      <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-foreground" />
                    )}
                  </button>
                ))}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {filteredTasks.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground/50">
                    {taskTab === "upcoming" && "No upcoming tasks"}
                    {taskTab === "overdue" && "No overdue tasks"}
                    {taskTab === "completed" && "No completed tasks"}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredTasks.slice(0, 10).map((task) => {
                      const project = task.projectId ? projectLookup[task.projectId] : null;
                      const dueDate = task.dueOn
                        ? typeof task.dueOn === "string" ? parseISO(task.dueOn) : new Date(task.dueOn)
                        : null;
                      const isOverdue = dueDate && !task.completed && isPast(dueDate) && dueDate.toDateString() !== today.toDateString();

                      return (
                        <div
                          key={task.id}
                          className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30 cursor-pointer"
                          onClick={() => setSelectedTaskId(task.id)}
                        >
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleToggleComplete(task); }}
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                              task.completed
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-muted-foreground/30 hover:border-muted-foreground/50 bg-transparent"
                            )}
                          >
                            {task.completed && (
                              <CheckCircle2 className="size-3" strokeWidth={3} />
                            )}
                          </button>

                          <span
                            className={cn(
                              "flex-1 truncate text-sm",
                              task.completed && "line-through text-muted-foreground/50"
                            )}
                          >
                            {task.name}
                          </span>

                          {project && (
                            <span className="hidden sm:inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70 border">
                              <ProjectThumbnail
                                name={project.name}
                                color={project.color}
                                icon={project.icon}
                                defaultView={project.defaultView}
                                size="sm"
                                className="!size-3.5 !rounded-[3px]"
                              />
                              {project.name}
                            </span>
                          )}

                          {dueDate && (
                            <span
                              className={cn(
                                "whitespace-nowrap text-xs tabular-nums",
                                isOverdue
                                  ? "text-red-500 font-medium"
                                  : "text-muted-foreground/60"
                              )}
                            >
                              <CalendarDays className="mr-1 inline size-3" />
                              {formatShortDate(dueDate)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {filteredTasks.length > 10 && (
                <div className="border-t px-4 py-2">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  >
                    Show more
                    <ChevronRight className="size-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-sm font-medium">Projects</h2>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-muted-foreground/50">Recents</span>
                  <button
                    type="button"
                    className="rounded p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="grid grid-cols-2 gap-2">
                  {projects.slice(0, 6).map((project, i) => (
                    <Link
                      key={project.id}
                      href={getProjectUrl(project.id, project.defaultView)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/50",
                      )}
                    >
                      <ProjectThumbnail
                        name={project.name}
                        color={project.color}
                        icon={project.icon}
                        defaultView={project.defaultView}
                        size="md"
                      />
                      <span className="truncate text-sm">{project.name}</span>
                    </Link>
                  ))}

                  <button
                    onClick={() => setNewProjectOpen(true)}
                    className="flex items-center gap-2.5 rounded-md border border-dashed px-3 py-2.5 transition-colors hover:bg-muted/50 text-muted-foreground/60 hover:text-muted-foreground cursor-pointer"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded border border-dashed">
                      <Plus className="size-3.5" />
                    </span>
                    <span className="text-sm">Create project</span>
                  </button>
                </div>
              </div>

              {projects.length > 6 && (
                <div className="border-t px-4 py-2">
                  <Link
                    href="/projects/browse"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  >
                    Show more
                    <ChevronRight className="size-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-medium">People</h2>
            <p className="text-xs text-muted-foreground/50 mt-0.5">
              See who&apos;s on track and who needs support at a glance.
            </p>
          </div>

          <div className="divide-y">
            {allUsers.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground/50">
                No users found
              </div>
            ) : (
              allUsers.map((user) => {
                const stats = getUserTaskStats(user.id);
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30"
                  >
                    <Avatar className="size-7">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback className="text-[9px]">
                        {getInitial(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {user.name || user.email?.split("@")[0] || "Unknown"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {stats.overdue > 0 && (
                        <span className="rounded-full bg-red-50 dark:bg-red-950/30 px-2 py-0.5 text-[11px] font-medium text-red-500">
                          {stats.overdue} overdue
                        </span>
                      )}
                      <span className="rounded-full bg-green-50 dark:bg-green-950/30 px-2 py-0.5 text-[11px] font-medium text-green-500">
                        {stats.completed} completed
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground/70">
                        {stats.upcoming} upcoming
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <NewProjectFlow open={newProjectOpen} onClose={() => setNewProjectOpen(false)} />
      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          open={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={() => {
            fetch("/api/tasks")
              .then((res) => res.json())
              .then((json) => {
                if (json.data) setAllTasks(json.data);
              })
              .catch(console.error);
          }}
        />
      )}
    </>
  );
}
