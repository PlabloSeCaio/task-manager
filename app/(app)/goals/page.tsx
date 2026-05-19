"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Goal } from "@/types";
import { useActiveOrg } from "@/components/layout/org-context";

const statusColors: Record<string, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};

export default function GoalsPage() {
  const { workspaceId } = useActiveOrg();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchGoals = async () => {
    try {
      const res = await fetch(`/api/goals?workspaceId=${workspaceId}`);
      const json = await res.json();
      if (json.data) setGoals(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!workspaceId) return;
    fetchGoals();
  }, [workspaceId]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, name, description }),
    });
    const json = await res.json();
    if (json.data) {
      setName("");
      setDescription("");
      setOpen(false);
      await fetchGoals();
    }
  };

  if (!workspaceId) return null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Goals</h2>
          <p className="text-muted-foreground">
            {goals.length} goal{goals.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="mr-2 size-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Goal name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <Target className="mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No goals yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Set OKRs to track your team&apos;s progress.
          </p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create Goal
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "size-3 rounded-full",
                      statusColors[goal.status || "green"]
                    )}
                  />
                  <CardTitle className="text-lg">{goal.name}</CardTitle>
                </div>
                {goal.description && (
                  <CardDescription>{goal.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Progress
                    value={goal.completionPercent || 0}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium tabular-nums">
                    {goal.completionPercent || 0}%
                  </span>
                </div>
                {goal.dueOn && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Due: {new Date(goal.dueOn).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
