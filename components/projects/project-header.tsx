"use client";

import * as React from "react";
import type { Project } from "@/types";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";
import { ProjectSettingsModal } from "@/components/projects/project-settings-modal";
import { useToast } from "@/lib/toast-context";
import { MoreHorizontal, Trash2, Archive, ExternalLink, Link, Settings, Palette, Star, FileUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ProjectHeaderProps {
  project: Project;
  onUpdate: (updated: Project) => void;
  onOpenRules?: () => void;
  onOpenStatusUpdate?: () => void;
}

export function ProjectHeader({
  project,
  onUpdate,
  onOpenRules,
  onOpenStatusUpdate,
}: ProjectHeaderProps) {
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [editing, setEditing] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState(project.name);
  const [saving, setSaving] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const startEditing = React.useCallback(() => {
    setNameDraft(project.name);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  }, [project.name]);

  const saveName = React.useCallback(async (newName: string) => {
    if (!newName.trim() || newName === project.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        onUpdate(json.data);
        toast("Project renamed", "success");
      }
    } catch {
      toast("Failed to rename project", "error");
      setNameDraft(project.name);
    }
    setSaving(false);
    setEditing(false);
  }, [project.id, project.name, onUpdate, toast]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setNameDraft(project.name);
      setEditing(false);
    }
  }, [project.name]);

  const handleCopyLink = React.useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/projects/${project.id}/list`);
    toast("Link copied to clipboard", "success");
  }, [project.id, toast]);

  const handleArchive = React.useCallback(async () => {
    if (!confirm("Archive this project?")) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        onUpdate(json.data);
        toast("Project archived", "success");
      }
    } catch {
      toast("Failed to archive project", "error");
    }
  }, [project.id, onUpdate, toast]);

  const handleDelete = React.useCallback(async () => {
    if (!confirm("Delete this project permanently? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Project deleted", "success");
        window.location.href = "/projects";
      }
    } catch {
      toast("Failed to delete project", "error");
    }
  }, [project.id, toast]);

  const handleStarToggle = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred: !project.isStarred }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        onUpdate(json.data);
        toast(project.isStarred ? "Removed from starred" : "Added to starred", "success");
      }
    } catch {
      toast("Failed to update project", "error");
    }
  }, [project.id, project.isStarred, onUpdate, toast]);

  return (
    <>
      <div className="flex items-center gap-3 px-6 py-4">
        <ProjectThumbnail
          name={project.name}
          color={project.color}
          icon={project.icon}
          defaultView={project.defaultView}
          size="md"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {editing ? (
              <input
                ref={inputRef}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={(e) => saveName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-7 rounded-md border border-input bg-background px-2 text-xl font-semibold outline-none ring-1 ring-ring"
                autoFocus
              />
            ) : (
              <button
                onClick={startEditing}
                className="group relative text-xl font-semibold hover:bg-muted/50 rounded-md px-1 -ml-1 transition-colors cursor-pointer"
              >
                {project.name}
                {saving && (
                  <span className="ml-2 text-xs text-muted-foreground">Saving...</span>
                )}
              </button>
            )}
            {project.isStarred && (
              <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
            )}
          </div>
          {project.description && (
            <span className="text-sm text-muted-foreground">{project.description}</span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleStarToggle}>
                <Star className={cn("size-4", project.isStarred && "fill-yellow-400 text-yellow-400")} />
                {project.isStarred ? "Remove from starred" : "Add to starred"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setMenuOpen(false); handleCopyLink(); }}>
                <Link className="size-4" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/projects/${project.id}/list`, "_blank")}>
                <ExternalLink className="size-4" />
                Open in new tab
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={startEditing}>
                <FileUp className="size-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}>
                <Palette className="size-4" />
                Set color & icon
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setMenuOpen(false); onOpenRules?.(); }}>
                <Settings className="size-4" />
                Project settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="size-4" />
                Archive project
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 className="size-4" />
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ProjectSettingsModal
        project={project}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onUpdate={onUpdate}
      />
    </>
  );
}
