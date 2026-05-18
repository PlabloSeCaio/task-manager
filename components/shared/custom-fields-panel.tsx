"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { CustomFieldDef, CustomFieldValue } from "@/types";

interface CustomFieldsPanelProps {
  taskId: string;
  projectId?: string | null;
}

export function CustomFieldsPanel({
  taskId,
  projectId,
}: CustomFieldsPanelProps) {
  const [fields, setFields] = useState<CustomFieldDef[]>([]);
  const [values, setValues] = useState<Record<string, CustomFieldValue>>({});

  const fetchFields = async () => {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}/custom-fields`);
    const json = await res.json();
    if (json.data) setFields(json.data);
  };

  const fetchValues = async () => {
    const res = await fetch(`/api/tasks/${taskId}/custom-field-values`);
    const json = await res.json();
    if (json.data) {
      const map: Record<string, CustomFieldValue> = {};
      for (const item of json.data) {
        map[item.value.fieldId] = item.value;
      }
      setValues(map);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchFields();
      fetchValues();
    }
  }, [taskId]);

  const updateValue = async (fieldId: string, updates: Record<string, unknown>) => {
    await fetch(`/api/tasks/${taskId}/custom-field-values`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldId, ...updates }),
    });
    await fetchValues();
  };

  const val = (fieldId: string) => values[fieldId];

  if (fields.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Custom Fields</h4>
      {fields.map((field) => (
        <div key={field.id}>
          <Label className="text-xs text-muted-foreground">{field.name}</Label>
          {field.type === "text" && (
            <Input
              placeholder={field.name}
              value={val(field.id)?.textValue || ""}
              onChange={(e) =>
                updateValue(field.id, { textValue: e.target.value })
              }
              className="h-8 mt-1"
            />
          )}
          {field.type === "number" && (
            <Input
              type="number"
              placeholder={field.name}
              value={val(field.id)?.numberValue?.toString() || ""}
              onChange={(e) =>
                updateValue(field.id, {
                  numberValue: parseInt(e.target.value) || 0,
                })
              }
              className="h-8 mt-1"
            />
          )}
          {field.type === "date" && (
            <Input
              type="date"
              value={
                val(field.id)?.dateValue
                  ? new Date(val(field.id)!.dateValue!)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              onChange={(e) =>
                updateValue(field.id, { dateValue: e.target.value })
              }
              className="h-8 mt-1"
            />
          )}
          {(field.type === "single_select" || field.type === "multi_select") && (
            <Select
              value={(Array.isArray(val(field.id)?.enumValues) ? (val(field.id)!.enumValues as string[])[0] : "") || ""}
              onValueChange={(v) =>
                updateValue(field.id, { enumValues: [v] })
              }
            >
              <SelectTrigger className="h-8 mt-1">
                <SelectValue placeholder={`Select ${field.name}`} />
              </SelectTrigger>
              <SelectContent>
                {(field.options as Array<{ id: string; name: string }>)?.map(
                  (opt: { id: string; name: string }) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
    </div>
  );
}
