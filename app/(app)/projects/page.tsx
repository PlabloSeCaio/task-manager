"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderKanban, ChevronRight } from "lucide-react";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";
import { NewProjectFlow } from "@/components/projects/new-project-flow";
import type { Project } from "@/types";
import { useActiveOrg } from "@/components/layout/org-context";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const { workspaceId } = useActiveOrg();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/projects?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setProjects(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const filtered = search.trim()
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : projects;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Projects</h2>
            <p className="text-muted-foreground">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/projects/browse">
              <Button variant="outline" size="sm">
                Browse all
              </Button>
            </Link>
            <Button onClick={() => setNewProjectOpen(true)}>
              <Plus className="mr-2 size-4" />
              New Project
            </Button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
            <FolderKanban className="mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              {search ? "No projects match your search" : "No projects yet"}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {search
                ? "Try a different search term"
                : "Create your first project to get started."}
            </p>
            {!search && (
              <Button onClick={() => setNewProjectOpen(true)}>
                <Plus className="mr-2 size-4" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="divide-y">
              {filtered.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}/list`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 group"
                >
                  <ProjectThumbnail
                    name={project.name}
                    color={project.color}
                    icon={project.icon}
                    defaultView={project.defaultView}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate">
                      {project.name}
                    </span>
                    {project.description && (
                      <span className="text-xs text-muted-foreground truncate block">
                        {project.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.5">
                      {project.defaultView?.charAt(0).toUpperCase() +
                        (project.defaultView?.slice(1) || "List")}
                    </span>
                    <span>
                      {project.privacy === "public"
                        ? "Public"
                        : project.privacy === "private"
                          ? "Private"
                          : "Team"}
                    </span>
                    {project.updatedAt && (
                      <span className="hidden sm:inline">
                        {formatDistanceToNow(new Date(project.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <NewProjectFlow
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
      />
    </>
  );
}
