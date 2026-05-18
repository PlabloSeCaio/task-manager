"use client";

import type { Project } from "@/types";
import { Button } from "@/components/ui/button";
import { Settings, MoreHorizontal } from "lucide-react";

interface ProjectHeaderProps {
  project: Project;
  onOpenRules?: () => void;
  onOpenStatusUpdate?: () => void;
}

export function ProjectHeader({
  project,
  onOpenRules,
  onOpenStatusUpdate,
}: ProjectHeaderProps) {
  const dotColors: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
    orange: "bg-orange-500",
    teal: "bg-teal-500",
  };

  return (
    <div className="flex items-center gap-3 px-6 py-4">
      <div
        className={`size-3 rounded-full ${
          dotColors[project.color || "blue"] || "bg-blue-500"
        }`}
      />
      <h2 className="text-xl font-semibold">{project.name}</h2>
      {project.description && (
        <span className="text-sm text-muted-foreground">
          {project.description}
        </span>
      )}
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onOpenStatusUpdate}>
          <MoreHorizontal className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onOpenRules}>
          <Settings className="size-4" />
        </Button>
      </div>
    </div>
  );
}
