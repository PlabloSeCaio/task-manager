"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface StatusUpdateFormProps {
  projectId?: string;
  portfolioId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onUpdate: () => void;
}

export function StatusUpdateForm({
  projectId,
  portfolioId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onUpdate,
}: StatusUpdateFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [color, setColor] = useState("green");

  const handleSubmit = async () => {
    if (!body.trim()) return;

    const payload: Record<string, unknown> = {
      color,
      title: title || null,
      body,
    };
    if (projectId) payload.projectId = projectId;
    if (portfolioId) payload.portfolioId = portfolioId;

    const res = await fetch("/api/status-updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.data) {
      setTitle("");
      setBody("");
      setColor("green");
      setOpen(false);
      onUpdate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlledOpen && (
        <DialogTrigger>
          <Button variant="outline" size="sm">
            <Plus className="mr-1 size-3" />
            Status Update
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post Status Update</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title (optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Week 20 status"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={color} onValueChange={(v) => v && setColor(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="green">On track</SelectItem>
                <SelectItem value="yellow">At risk</SelectItem>
                <SelectItem value="red">Off track</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What happened this week?"
              className="min-h-[120px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!body.trim()}>
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
