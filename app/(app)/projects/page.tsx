"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FolderKanban } from "lucide-react";
import type { Project } from "@/types";
import { useActiveOrg } from "@/components/layout/org-context";

export default function ProjectsPage() {
  const router = useRouter();
  const { workspaceId } = useActiveOrg();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("blue");
  const [defaultView, setDefaultView] = useState<string>("list");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchProjects = async () => {
    try {
      const res = await fetch(
        `/api/projects?workspaceId=${workspaceId}`
      );
      const json = await res.json();
      if (json.data) setProjects(json.data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!workspaceId) return;
    fetchProjects();
  }, [workspaceId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name,
          description,
          color,
          defaultView,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setOpen(false);
        setName("");
        setDescription("");
        setColor("blue");
        setDefaultView("list");
        await fetchProjects();
      } else {
        setCreateError(json.error || "Failed to create project");
      }
    } catch (err) {
      setCreateError("Network error — please try again");
    } finally {
      setCreating(false);
    }
  };

  const colorClasses: Record<string, string> = {
    blue: "border-l-blue-500",
    green: "border-l-green-500",
    red: "border-l-red-500",
    yellow: "border-l-yellow-500",
    purple: "border-l-purple-500",
    pink: "border-l-pink-500",
    orange: "border-l-orange-500",
    teal: "border-l-teal-500",
  };

  if (!workspaceId) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="mr-2 size-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
                <DialogDescription>
                  Add a new project to your workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Project name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Select value={color} onValueChange={(v) => v && setColor(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="yellow">Yellow</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="pink">Pink</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                        <SelectItem value="teal">Teal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="view">Default View</Label>
                    <Select value={defaultView} onValueChange={(v) => v && setDefaultView(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="board">Board</SelectItem>
                        <SelectItem value="calendar">Calendar</SelectItem>
                        <SelectItem value="timeline">Timeline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              {createError && (
                <p className="text-sm text-destructive">{createError}</p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <FolderKanban className="mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No projects yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create your first project to get started.
          </p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}/list`}>
              <Card
                className={`cursor-pointer border-l-4 transition-shadow hover:shadow-md ${
                  colorClasses[project.color || "blue"] ||
                  "border-l-blue-500"
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {project.defaultView?.charAt(0).toUpperCase() +
                        (project.defaultView?.slice(1) || "List")}{" "}
                      view
                    </span>
                    <span>
                      {project.privacy === "public"
                        ? "Public"
                        : project.privacy === "private"
                          ? "Private"
                          : "Team"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
