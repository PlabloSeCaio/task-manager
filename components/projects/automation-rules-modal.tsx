"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import type { AutomationRule } from "@/types";

interface AutomationRulesModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutomationRulesModal({
  projectId,
  open,
  onOpenChange,
}: AutomationRulesModalProps) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("task_moved");
  const [actionType, setActionType] = useState("set_due_date");
  const [actionOffset, setActionOffset] = useState(3);
  const [actionUserId, setActionUserId] = useState("");
  const [actionSectionId, setActionSectionId] = useState("");

  const fetchRules = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/rules`);
      const json = await res.json();
      if (json.data) setRules(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchRules();
  }, [open, projectId]);

  const handleCreate = async () => {
    if (!name.trim()) return;

    const trigger: Record<string, unknown> = { type: triggerType };
    const action: Record<string, unknown> = { type: actionType };

    if (actionType === "set_due_date") action.offset = actionOffset;
    if (actionType === "assign_user") action.userId = actionUserId;
    if (actionType === "move_to_section") action.sectionId = actionSectionId;

    const res = await fetch(`/api/projects/${projectId}/rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, trigger, action }),
    });
    const json = await res.json();
    if (json.data) {
      setName("");
      await fetchRules();
    }
  };

  const toggleRule = async (rule: AutomationRule) => {
    await fetch(`/api/rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    await fetchRules();
  };

  const deleteRule = async (ruleId: string) => {
    await fetch(`/api/rules/${ruleId}`, { method: "DELETE" });
    await fetchRules();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Automation Rules</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rules yet.</p>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  <Switch
                    checked={!!rule.enabled}
                    onCheckedChange={() => toggleRule(rule)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">
                      When {(rule.trigger as { type: string }).type} → {(rule.action as { type: string }).type}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-md border p-4">
            <h4 className="mb-3 text-sm font-medium">Add Rule</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Rule Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Auto-assign when moved"
                  className="h-8"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Trigger</Label>
                  <Select value={triggerType} onValueChange={(v) => v && setTriggerType(v)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task_moved">Task moved</SelectItem>
                      <SelectItem value="task_completed">Task completed</SelectItem>
                      <SelectItem value="task_created">Task created</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Action</Label>
                  <Select value={actionType} onValueChange={(v) => v && setActionType(v)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="set_due_date">Set due date</SelectItem>
                      <SelectItem value="assign_user">Assign user</SelectItem>
                      <SelectItem value="move_to_section">Move to section</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {actionType === "set_due_date" && (
                <div>
                  <Label className="text-xs">Days from now</Label>
                  <Input
                    type="number"
                    value={actionOffset}
                    onChange={(e) => setActionOffset(parseInt(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
              )}

              <Button size="sm" onClick={handleCreate} disabled={!name.trim()}>
                <Plus className="mr-1 size-3" />
                Add Rule
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
