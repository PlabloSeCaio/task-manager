"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Inbox,
  FolderKanban,
  PieChart,
  Target,
  Settings,
  ChevronDown,
} from "lucide-react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { href: "/home", label: "Home", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/portfolios", label: "Portfolios", icon: PieChart },
  { href: "/goals", label: "Goals", icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-muted/30 transition-all",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center gap-2 border-b p-4">
        <OrganizationSwitcher
          appearance={{
            elements: {
              organizationSwitcherTrigger: {
                padding: "4px",
                borderRadius: "6px",
              },
            },
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-6"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              collapsed && "-rotate-90"
            )}
          />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-3">
          <UserButton />
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Settings</span>
              <Link href="/settings/profile">
                <Settings className="size-4 text-muted-foreground hover:text-foreground" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
