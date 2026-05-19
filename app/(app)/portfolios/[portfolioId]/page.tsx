"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProjectUrl } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FolderKanban } from "lucide-react";
import type { Portfolio, Project } from "@/types";
import { useActiveOrg } from "@/components/layout/org-context";

export default function PortfolioDetailPage() {
  const params = useParams();
  const { workspaceId } = useActiveOrg();
  const portfolioId = params.portfolioId as string;
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const fetchData = async () => {
    try {
      const [pfRes, projRes, allRes] = await Promise.all([
        fetch(`/api/portfolios/${portfolioId}`),
        fetch(`/api/portfolios/${portfolioId}/projects`),
        fetch(`/api/projects?workspaceId=${workspaceId}`),
      ]);
      const pfJson = await pfRes.json();
      const projJson = await projRes.json();
      const allJson = await allRes.json();
      if (pfJson.data) setPortfolio(pfJson.data);
      if (projJson.data) setProjects(projJson.data);
      if (allJson.data) setAllProjects(allJson.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!workspaceId) return;
    fetchData();
  }, [portfolioId, workspaceId]);

  const addProject = async () => {
    if (!selectedProjectId) return;
    await fetch(`/api/portfolios/${portfolioId}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selectedProjectId }),
    });
    setSelectedProjectId("");
    setOpen(false);
    await fetchData();
  };

  const availableProjects = allProjects.filter(
    (p) => !projects.find((pp) => pp.id === p.id)
  );

  if (!workspaceId) return null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{portfolio?.name || "Portfolio"}</h2>
          <p className="text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button disabled={availableProjects.length === 0}>
              <Plus className="mr-2 size-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Project to Portfolio</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Select
                value={selectedProjectId}
                onValueChange={(v) => v && setSelectedProjectId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {availableProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addProject} disabled={!selectedProjectId}>
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <FolderKanban className="mb-4 size-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            No projects in this portfolio yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={getProjectUrl(project.id, project.defaultView)}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
