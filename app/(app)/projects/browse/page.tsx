"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Clock, ChevronRight } from "lucide-react";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";
import { NewProjectFlow } from "@/components/projects/new-project-flow";
import { cn, getProjectUrl } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Project } from "@/types";
import { useActiveOrg } from "@/components/layout/org-context";

const filterPills = ["Owner", "Members", "Status"] as const;

export default function BrowseProjectsPage() {
  const router = useRouter();
  const { workspaceId } = useActiveOrg();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    let list = projects;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Browse projects</h1>
          <Button onClick={() => setNewProjectOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create project
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Find a project"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {filterPills.map((pill) => (
              <button
                key={pill}
                onClick={() =>
                  setActiveFilter(activeFilter === pill ? null : pill)
                }
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  activeFilter === pill
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-muted-foreground">
              {search ? "No projects match your search" : "No projects yet"}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_140px] gap-4 border-b bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground">
              <span>Name</span>
              <span className="text-right">Last modified</span>
            </div>

            {/* Rows */}
            <div className="divide-y">
              {filtered.map((project) => {
                const lastMod = project.updatedAt
                  ? formatDistanceToNow(new Date(project.updatedAt), {
                      addSuffix: true,
                    })
                  : null;
                return (
                  <Link
                    key={project.id}
                    href={getProjectUrl(project.id, project.defaultView)}
                    className="grid grid-cols-[1fr_140px] gap-4 px-4 py-3 items-center transition-colors hover:bg-muted/30 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ProjectThumbnail
                        name={project.name}
                        color={project.color}
                        icon={project.icon}
                        defaultView={project.defaultView}
                        size="md"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate flex items-center gap-2">
                          {project.name}
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            Joined
                          </span>
                        </span>
                        {project.description && (
                          <span className="text-xs text-muted-foreground truncate">
                            {project.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                      {lastMod && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {lastMod}
                        </span>
                      )}
                      <ChevronRight className="size-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                    </div>
                  </Link>
                );
              })}
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
