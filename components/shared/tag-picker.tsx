"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, X } from "lucide-react";
import type { Tag } from "@/types";

interface TagPickerProps {
  taskId: string;
  workspaceId: string;
}

const colorMap: Record<string, string> = {
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100",
};

export function TagPicker({ taskId, workspaceId }: TagPickerProps) {
  const [taskTags, setTaskTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const fetchTaskTags = async () => {
    const res = await fetch(`/api/tasks/${taskId}/tags`);
    const json = await res.json();
    if (json.data) setTaskTags(json.data);
  };

  const fetchAllTags = async () => {
    const res = await fetch(`/api/tags?workspaceId=${workspaceId}`);
    const json = await res.json();
    if (json.data) setAllTags(json.data);
  };

  useEffect(() => {
    if (taskId) fetchTaskTags();
  }, [taskId]);

  useEffect(() => {
    if (open) fetchAllTags();
  }, [open]);

  const addTag = async (tag: Tag) => {
    await fetch(`/api/tasks/${taskId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId: tag.id }),
    });
    await fetchTaskTags();
  };

  const removeTag = async (tagId: string) => {
    await fetch(`/api/tasks/${taskId}/tags`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
    await fetchTaskTags();
  };

  const createAndAdd = async () => {
    if (!search.trim()) return;
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, name: search.trim() }),
    });
    const json = await res.json();
    if (json.data) {
      await addTag(json.data);
      setSearch("");
    }
  };

  const filtered = allTags.filter(
    (t) =>
      !taskTags.find((tt) => tt.id === t.id) &&
      t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {taskTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className={`gap-1 ${colorMap[tag.color || "gray"] || colorMap.gray}`}
        >
          {tag.name}
          <button onClick={() => removeTag(tag.id)} className="ml-0.5">
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <Button variant="ghost" size="icon" className="size-5">
            <Plus className="size-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <Input
            placeholder="Search or create tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered.length === 0) {
                e.preventDefault();
                createAndAdd();
              }
            }}
            className="mb-2 h-8"
            autoFocus
          />
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {filtered.map((tag) => (
              <button
                key={tag.id}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => addTag(tag)}
              >
                <span
                  className={`size-2 rounded-full ${
                    colorMap[tag.color || "gray"]
                      ?.split(" ")[0] || "bg-gray-400"
                  }`}
                />
                {tag.name}
              </button>
            ))}
            {search.trim() && filtered.length === 0 && (
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary hover:bg-accent"
                onClick={createAndAdd}
              >
                <Plus className="size-3" />
                Create &quot;{search.trim()}&quot;
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
