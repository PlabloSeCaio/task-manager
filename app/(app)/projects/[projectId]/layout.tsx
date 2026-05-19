"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutList, Columns3, Calendar, GitBranch, Plus } from "lucide-react";
import { ProjectHeader } from "@/components/projects/project-header";
import { useActiveOrg } from "@/components/layout/org-context";
import { AutomationRulesModal } from "@/components/projects/automation-rules-modal";
import { StatusUpdateForm } from "@/components/projects/status-update-form";
import type { Project, Section } from "@/types";

const tabs = [
  { href: "list", label: "List", icon: LayoutList },
  { href: "board", label: "Board", icon: Columns3 },
  { href: "calendar", label: "Calendar", icon: Calendar },
  { href: "timeline", label: "Timeline", icon: GitBranch },
];

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { workspaceId } = useActiveOrg();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const currentTab = pathname.split("/").pop() || "list";

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setProject(json.data);
      })
      .catch(console.error);
  }, [projectId]);

  const handleAddTask = async () => {
    try {
      const sectionsRes = await fetch(`/api/projects/${projectId}/sections`);
      const sJson = await sectionsRes.json();
      const sections: Section[] = sJson.data || [];
      const firstSectionId = sections.length > 0 ? sections[0].id : undefined;

      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          projectId,
          sectionId: firstSectionId,
          name: "New task",
        }),
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  if (!workspaceId) return null;

  return (
    <div className="flex h-full flex-col">
      {project && (
        <ProjectHeader
          project={project}
          onOpenRules={() => setRulesOpen(true)}
          onOpenStatusUpdate={() => setStatusOpen(true)}
        />
      )}

      <div className="flex items-center gap-1 border-b px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = currentTab === tab.href;
          return (
            <Link
              key={tab.href}
              href={`/projects/${projectId}/${tab.href}`}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </Link>
          );
        })}
        <div className="ml-auto">
          <Button size="sm" onClick={handleAddTask}>
            <Plus className="mr-1 size-4" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">{children}</div>

      {project && (
        <>
          <AutomationRulesModal
            projectId={projectId}
            open={rulesOpen}
            onOpenChange={setRulesOpen}
          />
          <StatusUpdateForm
            projectId={projectId}
            open={statusOpen}
            onOpenChange={setStatusOpen}
            onUpdate={() => {}}
          />
        </>
      )}
    </div>
  );
}
