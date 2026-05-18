"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Search, Bell, Sun, Moon, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/layout/sidebar-context";
import { useEffect, useState } from "react";

export function TopNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { setMobileOpen } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const title = pathname.split("/").filter(Boolean).pop() || "Home";
  const displayName = title.charAt(0).toUpperCase() + title.slice(1);

  return (
    <header className="flex items-center gap-4 border-b px-4 md:px-6 py-3">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
      <h1 className="text-lg font-semibold truncate">{displayName}</h1>
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-36 md:w-64 pl-9"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )
          ) : (
            <Sun className="size-4" />
          )}
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="size-4" />
        </Button>
      </div>
    </header>
  );
}
