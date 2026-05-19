"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListChecks,
  Inbox,
  Settings,
  Plus,
  X,
} from "lucide-react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { useSidebar } from "@/components/layout/sidebar-context";
import { useState, useEffect } from "react";
import type { Project } from "@/types";

const navTop = [
  { href: "/home", label: "Home", icon: LayoutDashboard },
  { href: "/my-tasks", label: "My Tasks", icon: ListChecks },
  { href: "/inbox", label: "Inbox", icon: Inbox },
];

const projectColors: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  orange: "bg-orange-500",
  teal: "bg-teal-500",
};

const colorOptions = ["blue", "teal", "purple", "yellow", "orange", "pink", "green"];

function getProjectColor(color?: string | null, index = 0): string {
  if (color && projectColors[color]) return projectColors[color];
  return projectColors[colorOptions[index % colorOptions.length]];
}

function getProjectInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebar();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/projects?workspaceId=00000000-0000-0000-0000-000000000000")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setProjects(json.data);
      })
      .catch(() => {});
  }, []);

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
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Projects
          </span>
          <Link href="/projects" onClick={() => setMobileOpen(false)}>
            <Plus className="size-3.5 text-sidebar-foreground/40 hover:text-sidebar-foreground" />
          </Link>
        </div>

        <div className="space-y-0.5">
          {projects.map((project, i) => {
            const active = pathname.startsWith(`/projects/${project.id}`);
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}/list`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white",
                    getProjectColor(project.color, i)
                  )}
                >
                  {getProjectInitial(project.name)}
                </span>
                <span className="truncate">{project.name}</span>
              </Link>
            );
          })}
          {projects.length === 0 && (
            <Link
              href="/projects"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded border border-dashed border-sidebar-border text-[10px]">
                <Plus className="size-3" />
              </span>
              <span>Add project</span>
            </Link>
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
