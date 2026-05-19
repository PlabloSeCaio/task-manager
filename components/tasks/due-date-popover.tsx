"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DueDatePopoverProps {
  value: string | null;
  startValue: string | null;
  onChange: (date: string | null) => void;
  onStartChange?: (date: string | null) => void;
}

type DateTab = "due" | "start";

export function DueDatePopover({
  value,
  startValue,
  onChange,
  onStartChange,
}: DueDatePopoverProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DateTab>("due");

  const selectedDate = activeTab === "due" ? value : startValue;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors",
          value && "text-primary"
        )}
        title="Due date"
      >
        <CalendarDays className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-[280px] p-0"
      >
        <div className="flex border-b">
          <button
            type="button"
            onClick={() => setActiveTab("due")}
            className={cn(
              "flex-1 px-3 py-2 text-xs font-medium transition-colors",
              activeTab === "due"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Due date
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("start")}
            className={cn(
              "flex-1 px-3 py-2 text-xs font-medium transition-colors",
              activeTab === "start"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Start date
          </button>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate ? new Date(selectedDate) : undefined}
          onSelect={(date) => {
            if (!date) return;
            const dateStr = format(date, "yyyy-MM-dd");
            if (activeTab === "due") {
              onChange(dateStr);
            } else if (onStartChange) {
              onStartChange(dateStr);
            }
            setOpen(false);
          }}
          className="border-0"
        />
        <div className="flex items-center justify-between border-t px-3 py-2">
          <div className="flex items-center gap-1">
            <Clock className="size-3 text-muted-foreground" />
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              if (activeTab === "due") {
                onChange(null);
              } else if (onStartChange) {
                onStartChange(null);
              }
              setOpen(false);
            }}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
