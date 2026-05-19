"use client"

import * as React from "react"
import type { Project } from "@/types"
import { useToast } from "@/lib/toast-context"
import { projectColorPalette } from "@/components/projects/project-thumbnail"
import { projectIcons } from "@/lib/project-icons"
import { cn } from "@/lib/utils"
import { CheckIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ProjectSettingsModalProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (updated: Project) => void
  onOpenAutomationRules?: () => void
}

export function ProjectSettingsModal({
  project,
  open,
  onOpenChange,
  onUpdate,
  onOpenAutomationRules,
}: ProjectSettingsModalProps) {
  const { toast } = useToast()
  const [name, setName] = React.useState(project.name)
  const [color, setColor] = React.useState(project.color || "blue")
  const [icon, setIcon] = React.useState(project.icon || "")
  const [defaultView, setDefaultView] = React.useState(project.defaultView || "list")
  const [privacy, setPrivacy] = React.useState(project.privacy || "public")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setName(project.name)
      setColor(project.color || "blue")
      setIcon(project.icon || "")
      setDefaultView(project.defaultView || "list")
      setPrivacy(project.privacy || "public")
    }
  }, [open, project])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          color,
          icon: icon || null,
          defaultView,
          privacy,
        }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        onUpdate(json.data)
        toast("Project settings saved", "success")
        onOpenChange(false)
      } else {
        toast(json.error || "Failed to save", "error")
      }
    } catch {
      toast("Failed to save project settings", "error")
    }
    setSaving(false)
  }

  const handleArchive = async () => {
    if (!confirm("Archive this project?")) return
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        onUpdate(json.data)
        toast("Project archived", "success")
        onOpenChange(false)
      }
    } catch {
      toast("Failed to archive project", "error")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this project permanently? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" })
      if (res.ok) {
        toast("Project deleted", "success")
        onOpenChange(false)
        window.location.href = "/projects"
      }
    } catch {
      toast("Failed to delete project", "error")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Project name</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Default View */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Default view</Label>
            <Select
              value={defaultView}
              onValueChange={(v) => v && setDefaultView(v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="board">Board</SelectItem>
                <SelectItem value="calendar">Calendar</SelectItem>
                <SelectItem value="timeline">Timeline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Privacy */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Privacy</Label>
            <Select
              value={privacy}
              onValueChange={(v) => v && setPrivacy(v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private_to_team">Team</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Color</Label>
            <div className="flex flex-wrap gap-2">
              {projectColorPalette.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={cn(
                    "size-7 rounded-full transition-all cursor-pointer",
                    color === c.id && "ring-2 ring-offset-2 ring-offset-background",
                    c.ring,
                    c.class
                  )}
                >
                  {color === c.id && (
                    <CheckIcon className="size-3.5 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Icon</Label>
            <div className="grid grid-cols-7 gap-1.5">
              {projectIcons.map((ic) => {
                const IconComp = ic.icon
                return (
                  <button
                    key={ic.id}
                    onClick={() => setIcon(icon === ic.id ? "" : ic.id)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md transition-colors cursor-pointer",
                      icon === ic.id
                        ? "bg-primary/10 text-primary ring-1 ring-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    title={ic.label}
                  >
                    <IconComp className="size-4" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              onOpenChange(false)
              onOpenAutomationRules?.()
            }}
          >
            Automation rules
          </Button>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              className="text-muted-foreground"
            >
              Archive
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              Delete
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <DialogClose render={<Button variant="ghost" size="sm" />}>
              Cancel
            </DialogClose>
            <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
