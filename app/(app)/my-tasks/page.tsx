"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getProjectUrl } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListChecks, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, Project } from "@/types";
import { useActiveOrg } from "@/components/layout/org-context";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "false", label: "Open" },
  { value: "true", label: "Completed" },
];

export default function MyTasksPage() {
  const { workspaceId } = useActiveOrg();
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("false");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");

  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      try {
        const meRes = await fetch("/api/users/me");
        const meJson = await meRes.json();
        if (!meJson.data) return;
        const id = meJson.data.id;
        setUserId(id);

        const [tasksRes, projectsRes] = await Promise.all([
          fetch(`/api/tasks?assigneeId=${id}&completed=${statusTab}`),
          fetch(`/api/projects?workspaceId=${workspaceId}`),
        ]);
        const tasksJson = await tasksRes.json();
        const projectsJson = await projectsRes.json();
        if (tasksJson.data) setTasks(tasksJson.data);
        if (projectsJson.data) setProjects(projectsJson.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [statusTab, workspaceId]);

  const projectMap = Object.fromEntries(
    projects.map((p) => [p.id, p.name])
  );

  const filteredTasks = tasks
    .filter((t) =>
      searchQuery
        ? t.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )
    .sort((a, b) => {
      if (sortBy === "dueOn") {
        if (!a.dueOn) return 1;
        if (!b.dueOn) return -1;
        return new Date(a.dueOn).getTime() - new Date(b.dueOn).getTime();
      }
      if (sortBy === "name") return a.name.localeCompare(b.name);
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  const grouped = filteredTasks.reduce<Record<string, Task[]>>(
    (acc, task) => {
      const key = task.projectId
        ? projectMap[task.projectId] || "Unknown"
        : "No project";
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    },
    {}
  );

  const toggleTask = async (task: Task) => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    const json = await res.json();
    if (json.data) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? json.data : t))
      );
    }
  };

  if (!workspaceId) return null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Tasks</h2>
          <p className="text-muted-foreground">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={statusTab === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusTab(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-48 pl-8"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Newest</SelectItem>
              <SelectItem value="dueOn">Due date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <ListChecks className="mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No tasks found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? "Try a different search query."
              : "You have no tasks assigned to you."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([projectName, projectTasks]) => (
            <div key={projectName}>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                {projectName}
              </h3>
              <div className="rounded-md border">
                {projectTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0 hover:bg-muted/30",
                      task.completed && "opacity-60"
                    )}
                  >
                    <Checkbox
                      checked={!!task.completed}
                      onCheckedChange={() => toggleTask(task)}
                    />
                    <Link
                        href={getProjectUrl(task.projectId, null)}
                      className="flex-1 text-sm font-medium hover:underline"
                    >
                      <span
                        className={cn(
                          task.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {task.name}
                      </span>
                    </Link>
                    {task.dueOn && (
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          new Date(task.dueOn) < new Date() && !task.completed
                            ? "text-destructive font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {new Date(task.dueOn).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {projectName}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
