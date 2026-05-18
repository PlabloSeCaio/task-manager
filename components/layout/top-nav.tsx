"use client";

import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TopNav() {
  const pathname = usePathname();

  const title = pathname.split("/").filter(Boolean).pop() || "Home";
  const displayName = title.charAt(0).toUpperCase() + title.slice(1);

  return (
    <header className="flex items-center gap-4 border-b px-6 py-3">
      <h1 className="text-lg font-semibold">{displayName}</h1>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks, projects, people..."
            className="w-64 pl-9"
          />
        </div>
        <Button variant="ghost" size="icon">
          <Bell className="size-4" />
        </Button>
      </div>
    </header>
  );
}
