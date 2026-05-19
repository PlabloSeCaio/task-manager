"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListChecks,
  Inbox,
  Settings,
  Plus,
  X,
  ChevronRight,
  FolderKanban,
  Share2,
  ExternalLink,
  Link as LinkIcon,
  Palette,
  Star,
  Archive,
  Trash2,
  Copy,
  SortAsc,
  ArrowUpAZ,
  Clock,
  TrendingUp,
  Check,
} from "lucide-react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { useSidebar } from "@/components/layout/sidebar-context";
import { useActiveOrg } from "@/components/layout/org-context";
import { useState, useEffect, useRef, useCallback } from "react";
import { NewProjectFlow } from "@/components/projects/new-project-flow";
import { ProjectThumbnail, projectColorPalette, getColorClass } from "@/components/projects/project-thumbnail";
import { projectIcons, getIconById } from "@/lib/project-icons";
import { useToast } from "@/lib/toast-context";
import { getProjectUrl, getProjectViewSlug } from "@/lib/utils";
import type { Project } from "@/types";

const navTop = [
  { href: "/home", label: "Home", icon: LayoutDashboard },
  { href: "/my-tasks", label: "My Tasks", icon: ListChecks },
  { href: "/inbox", label: "Inbox", icon: Inbox },
];

type SortMode = "alphabetical" | "recent" | "top";

const sortOptions: { id: SortMode; label: string; icon: typeof ArrowUpAZ }[] = [
  { id: "alphabetical", label: "Alphabetical", icon: ArrowUpAZ },
  { id: "recent", label: "Recent", icon: Clock },
  { id: "top", label: "Top", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { mobileOpen, setMobileOpen } = useSidebar();
  const { workspaceId } = useActiveOrg();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [addDropdownPos, setAddDropdownPos] = useState({ x: 0, y: 0 });
  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false);
  const [projectsDropdownPos, setProjectsDropdownPos] = useState({ x: 0, y: 0 });
  const [sortMode, setSortMode] = useState<SortMode>("alphabetical");
  const [contextMenu, setContextMenu] = useState<{
    project: Project;
    x: number;
    y: number;
  } | null>(null);
  const [colorIconSubmenu, setColorIconSubmenu] = useState(false);
  const [renameProject, setRenameProject] = useState<Project | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLDivElement>(null);
  const projectsTitleRef = useRef<HTMLButtonElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/projects?workspaceId=${workspaceId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setProjects(json.data);
      })
      .catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) {
        setAddDropdownOpen(false);
      }
      if (
        projectsTitleRef.current &&
        !projectsTitleRef.current.contains(e.target as Node)
      ) {
        setProjectsDropdownOpen(false);
      }
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
        setColorIconSubmenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
        setColorIconSubmenu(false);
        setAddDropdownOpen(false);
        setProjectsDropdownOpen(false);
        setRenameProject(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (renameProject && renameInputRef.current) {
      renameInputRef.current.select();
    }
  }, [renameProject]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, project: Project) => {
      e.preventDefault();
      setContextMenu({ project, x: e.clientX, y: e.clientY });
    },
    []
  );

  const sortedProjects = [...projects].sort((a, b) => {
    if (sortMode === "alphabetical") return a.name.localeCompare(b.name);
    if (sortMode === "recent") {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    }
    if (sortMode === "top") {
      const aStarred = a.isStarred ? 1 : 0;
      const bStarred = b.isStarred ? 1 : 0;
      if (bStarred !== aStarred) return bStarred - aStarred;
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const updateProjectInList = useCallback(
    (updated: Project) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
    },
    []
  );

  const handleRenameSave = useCallback(async () => {
    if (!renameProject || !renameDraft.trim()) return;
    try {
      const res = await fetch(`/api/projects/${renameProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameDraft.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        updateProjectInList(json.data);
        toast("Project renamed", "success");
      }
    } catch {
      toast("Failed to rename", "error");
    }
    setRenameProject(null);
  }, [renameProject, renameDraft, updateProjectInList, toast]);

  const handleArchiveFromMenu = useCallback(async (project: Project) => {
    setContextMenu(null);
    if (!confirm("Archive this project?")) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
        toast("Project archived", "success");
      }
    } catch {
      toast("Failed to archive", "error");
    }
  }, [toast]);

  const handleStarFromMenu = useCallback(
    async (project: Project) => {
      setContextMenu(null);
      try {
        const res = await fetch(`/api/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isStarred: !project.isStarred }),
        });
        const json = await res.json();
        if (res.ok && json.data) updateProjectInList(json.data);
      } catch {
        toast("Failed to update", "error");
      }
    },
    [updateProjectInList, toast]
  );

  const handleSetColorIcon = useCallback(
    async (project: Project, field: "color" | "icon", value: string | null) => {
      try {
        const body: Record<string, unknown> = {};
        if (field === "color") body.color = value;
        if (field === "icon") body.icon = value;
        const res = await fetch(`/api/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (res.ok && json.data) {
          updateProjectInList(json.data);
          toast(
            field === "color" ? "Color updated" : "Icon updated",
            "success"
          );
        }
      } catch {
        toast("Failed to update", "error");
      }
    },
    [updateProjectInList, toast]
  );

  const handleCopyLink = useCallback(
    (project: Project) => {
      navigator.clipboard.writeText(
        `${window.location.origin}${getProjectUrl(project.id, project.defaultView)}`
      );
      toast("Link copied", "success");
      setContextMenu(null);
    },
    [toast]
  );

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          className="flex size-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="size-4" />
        </button>
        <OrganizationSwitcher
          appearance={{
            elements: {
              organizationSwitcherTrigger: {
                padding: "2px 6px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 600,
                color: "inherit",
              },
              organizationSwitcherTriggerIcon: { width: "16px", height: "16px" },
            },
          }}
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        <div className="space-y-0.5">
          {navTop.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-5 mb-1 flex items-center justify-between px-3">
          <div>
            <button
              ref={projectsTitleRef}
              onClick={() => {
                if (projectsTitleRef.current) {
                  const r = projectsTitleRef.current.getBoundingClientRect();
                  setProjectsDropdownPos({ x: r.left, y: r.bottom + 4 });
                }
                setProjectsDropdownOpen(!projectsDropdownOpen);
              }}
              className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors cursor-pointer"
            >
              Projects
            </button>
          </div>

          <div ref={addRef}>
            <button
              onClick={() => {
                if (addRef.current) {
                  const r = addRef.current.getBoundingClientRect();
                  setAddDropdownPos({ x: r.left, y: r.bottom + 4 });
                }
                setAddDropdownOpen(!addDropdownOpen);
              }}
              className="flex size-3.5 items-center justify-center text-sidebar-foreground/40 hover:text-sidebar-foreground cursor-pointer"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-0.5">
          {sortedProjects.map((project) => {
            const active = pathname.startsWith(`/projects/${project.id}`);
            return (
              <div key={project.id}>
                {renameProject?.id === project.id ? (
                  <div className="flex items-center gap-3 rounded-md px-3 py-1.5">
                    <ProjectThumbnail
                      name={project.name}
                      color={project.color}
                      icon={project.icon}
                      defaultView={project.defaultView}
                      size="sm"
                    />
                    <input
                      ref={renameInputRef}
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onBlur={handleRenameSave}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameSave();
                        if (e.key === "Escape") setRenameProject(null);
                      }}
                      className="h-6 flex-1 rounded border border-input bg-background px-1.5 text-sm outline-none ring-1 ring-ring"
                      autoFocus
                    />
                  </div>
                ) : (
                  <Link
                    href={getProjectUrl(project.id, project.defaultView)}
                    onClick={() => setMobileOpen(false)}
                    onContextMenu={(e) => handleContextMenu(e, project)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <ProjectThumbnail
                      name={project.name}
                      color={project.color}
                      icon={project.icon}
                      defaultView={project.defaultView}
                      size="sm"
                    />
                    <span className="truncate flex-1">{project.name}</span>
                    {project.isStarred && (
                      <Star className="size-3 fill-yellow-400 text-yellow-400 shrink-0" />
                    )}
                  </Link>
                )}
              </div>
            );
          })}
          {sortedProjects.length === 0 && (
            <button
              onClick={() => setNewProjectOpen(true)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded border border-dashed border-sidebar-border text-[10px]">
                <Plus className="size-3" />
              </span>
              <span>Add project</span>
            </button>
          )}
        </div>
      </nav>

      <div className="border-t border-sidebar-border px-3 py-2.5">
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: { width: "24px", height: "24px" },
              },
            }}
          />
          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/settings/profile"
              onClick={() => setMobileOpen(false)}
              className="flex size-6 items-center justify-center rounded text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <Settings className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <NewProjectFlow open={newProjectOpen} onClose={() => setNewProjectOpen(false)} />

      {/* Projects dropdown (fixed, outside overflow container) */}
      {projectsDropdownOpen && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={() => setProjectsDropdownOpen(false)}
        />
      )}
      {projectsDropdownOpen && (
        <div
          className="fixed z-[70] w-52 overflow-hidden rounded-lg border bg-popover py-1 shadow-sm ring-1 ring-foreground/10"
          style={{ left: projectsDropdownPos.x, top: projectsDropdownPos.y }}
        >
          <button
            onClick={() => {
              setProjectsDropdownOpen(false);
              setNewProjectOpen(true);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Plus className="size-4 text-muted-foreground" />
            <span>New project</span>
          </button>
          <Link
            href="/projects/browse"
            onClick={() => {
              setProjectsDropdownOpen(false);
              setMobileOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <FolderKanban className="size-4 text-muted-foreground" />
            <span>Browse projects</span>
          </Link>
          <div className="border-t" />
          {sortOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setSortMode(opt.id);
                  setProjectsDropdownOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Icon className="size-4 text-muted-foreground" />
                <span className="flex-1 text-left">{opt.label}</span>
                {sortMode === opt.id && (
                  <Check className="size-3.5 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Add dropdown (fixed, outside overflow container) */}
      {addDropdownOpen && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={() => setAddDropdownOpen(false)}
        />
      )}
      {addDropdownOpen && (
        <div
          className="fixed z-[70] w-44 overflow-hidden rounded-lg border bg-popover py-1 shadow-sm ring-1 ring-foreground/10"
          style={{ left: addDropdownPos.x, top: addDropdownPos.y }}
        >
          <button
            onClick={() => {
              setAddDropdownOpen(false);
              setNewProjectOpen(true);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <FolderKanban className="size-4 text-muted-foreground" />
            <span>New project</span>
            <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => {
              setContextMenu(null);
              setColorIconSubmenu(false);
            }}
          />
          <div
            ref={contextMenuRef}
            className="fixed z-[70] w-56 overflow-hidden rounded-lg border bg-popover py-1 shadow-lg ring-1 ring-foreground/10"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {!colorIconSubmenu ? (
              <>
                <button
                  onClick={() => toast("Share dialog would open here", "info")}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Share2 className="size-4 text-muted-foreground" />
                  Share project
                </button>
                <button
                  onClick={() => {
                    window.open(
                      getProjectUrl(contextMenu.project.id, contextMenu.project.defaultView),
                      "_blank"
                    );
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <ExternalLink className="size-4 text-muted-foreground" />
                  Open in new tab
                </button>
                <button
                  onClick={() => handleCopyLink(contextMenu.project)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <LinkIcon className="size-4 text-muted-foreground" />
                  Copy link
                </button>
                <div className="my-1 border-t" />
                <button
                  onClick={() => setColorIconSubmenu(true)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Palette className="size-4 text-muted-foreground" />
                  Set color & icon
                  <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => {
                    setRenameProject(contextMenu.project);
                    setRenameDraft(contextMenu.project.name);
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Copy className="size-4 text-muted-foreground" />
                  Rename
                </button>
                <button
                  onClick={() => handleStarFromMenu(contextMenu.project)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Star className="size-4 text-muted-foreground" />
                  {contextMenu.project.isStarred
                    ? "Remove from starred"
                    : "Add to starred"}
                </button>
                <button
                  onClick={() => toast("Portfolio selector would open here", "info")}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <FolderKanban className="size-4 text-muted-foreground" />
                  Add to portfolio
                </button>
                <div className="my-1 border-t" />
                <button
                  onClick={() => handleArchiveFromMenu(contextMenu.project)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Archive className="size-4 text-muted-foreground" />
                  Archive project
                </button>
              </>
            ) : (
              <ColorIconSubmenu
                project={contextMenu.project}
                onSetColor={(color) => handleSetColorIcon(contextMenu.project, "color", color)}
                onSetIcon={(icon) => handleSetColorIcon(contextMenu.project, "icon", icon)}
                onBack={() => setColorIconSubmenu(false)}
              />
            )}
          </div>
        </>
      )}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-transform md:hidden",
          "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      <aside className="hidden md:flex w-56 flex-col border-r border-sidebar-border bg-sidebar">
        {sidebarContent}
      </aside>
    </>
  );
}

function ColorIconSubmenu({
  project,
  onSetColor,
  onSetIcon,
  onBack,
}: {
  project: Project;
  onSetColor: (color: string | null) => void;
  onSetIcon: (icon: string | null) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<"color" | "icon">("color");

  return (
    <div className="p-2">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors cursor-pointer"
      >
        <ChevronRight className="size-3 rotate-180" />
        Back
      </button>

      <div className="flex gap-0 mb-3 border-b">
        <button
          onClick={() => setTab("color")}
          className={`pb-1.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            tab === "color"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Color
        </button>
        <button
          onClick={() => setTab("icon")}
          className={`pb-1.5 text-xs font-medium border-b-2 ml-3 transition-colors cursor-pointer ${
            tab === "icon"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Icon
        </button>
      </div>

      {tab === "color" && (
        <div className="grid grid-cols-5 gap-1.5">
          {projectColorPalette.map((c) => (
            <button
              key={c.id}
              onClick={() => onSetColor(c.id)}
              className={`size-7 rounded-full transition-all cursor-pointer ${c.class} ${
                project.color === c.id
                  ? "ring-2 ring-offset-1 ring-offset-popover ring-foreground/40"
                  : ""
              }`}
            >
              {project.color === c.id && (
                <Check className="size-3.5 text-white mx-auto" />
              )}
            </button>
          ))}
        </div>
      )}

      {tab === "icon" && (
        <div className="grid grid-cols-5 gap-1">
          {projectIcons.map((ic) => {
            const IconComp = ic.icon;
            return (
              <button
                key={ic.id}
                onClick={() => onSetIcon(ic.id)}
                className={`flex size-8 items-center justify-center rounded-md transition-colors cursor-pointer ${
                  project.icon === ic.id
                    ? "bg-primary/10 text-primary ring-1 ring-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={ic.label}
              >
                <IconComp className="size-4" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
