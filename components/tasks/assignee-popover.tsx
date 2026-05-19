"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Search, UserPlus } from "lucide-react";
import type { User } from "@/types";

interface AssigneePopoverProps {
  value: string | null;
  onChange: (userId: string | null) => void;
}

export function AssigneePopover({ value, onChange }: AssigneePopoverProps) {
  const { user } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/users")
        .then((res) => res.json())
        .then((json) => {
          if (json.data) setUsers(json.data);
        })
        .catch(() => {});
    }
  }, [open]);

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const assignedUser = users.find((u) => u.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
        title="Assign"
      >
        {assignedUser ? (
          <Avatar className="size-5">
            <AvatarImage src={assignedUser.avatarUrl || undefined} />
            <AvatarFallback className="text-[9px]">
              {assignedUser.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <UserPlus className="size-3.5" />
        )}
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-64 p-0"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Assignee
          </span>
          <button
            onClick={() => setOpen(false)}
            className="flex size-5 items-center justify-center rounded hover:bg-muted transition-colors"
          >
            <X className="size-3" />
          </button>
        </div>
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-7 text-sm"
            />
          </div>
        </div>
        <div className="px-2 pb-1">
          <button
            type="button"
            onClick={() => {
              if (user?.id) onChange(user.id);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            <Avatar className="size-6">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="text-[10px]">
                {user?.fullName?.charAt(0)?.toUpperCase() || "M"}
              </AvatarFallback>
            </Avatar>
            <span>Assign to me</span>
          </button>
        </div>
        <div className="max-h-40 overflow-y-auto px-2 pb-2">
          {filtered
            .filter((u) => u.id !== user?.id)
            .map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onChange(u.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
              >
                <Avatar className="size-6">
                  <AvatarImage src={u.avatarUrl || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {(u.name || u.email || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm leading-tight">{u.name || u.email.split("@")[0] || "Unnamed"}</span>
                  {u.name && u.email && (
                    <span className="text-[11px] text-muted-foreground/60 truncate max-w-[160px]">{u.email}</span>
                  )}
                </div>
              </button>
            ))}
        </div>
        <div className="border-t px-3 py-2">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <UserPlus className="size-3.5" />
            <span>Invite teammates via email</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
