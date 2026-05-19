"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { XIcon, ArrowLeftIcon, ChevronDownIcon, CheckIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { projectTemplates, categories, type ProjectTemplate } from "@/lib/project-templates"
import { cn } from "@/lib/utils"

type Step = "gallery" | "detail" | "create"

const blankTemplate: ProjectTemplate = {
  id: "blank",
  name: "Blank project",
  description: "Start from scratch with default sections.",
  category: "All",
  bestFor: "All teams",
  defaultView: "list",
  color: "gray",
  sections: ["To do", "In progress", "Completed"],
  starterTasks: [],
  fields: [],
  features: [],
  previewType: "list",
}

interface NewProjectFlowProps {
  open: boolean
  onClose: () => void
}

export function NewProjectFlow({ open, onClose }: NewProjectFlowProps) {
  const router = useRouter()
  const [step, setStep] = React.useState<Step>("gallery")
  const [selectedTemplate, setSelectedTemplate] = React.useState<ProjectTemplate | null>(null)
  const [activeCategory, setActiveCategory] = React.useState("For you")
  const [projectName, setProjectName] = React.useState("")
  const [projectPrivacy, setProjectPrivacy] = React.useState("public")
  const [creating, setCreating] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setStep("gallery")
      setSelectedTemplate(null)
      setProjectName("")
      setProjectPrivacy("public")
      setActiveCategory("For you")
    }
  }, [open])

  const filteredTemplates = React.useMemo(() => {
    if (activeCategory === "For you") return projectTemplates.slice(0, 3)
    if (activeCategory === "My organization") return projectTemplates
    if (activeCategory === "More") return projectTemplates
    return projectTemplates.filter((t) => t.category === activeCategory)
  }, [activeCategory])

  const handleSelectTemplate = (template: ProjectTemplate) => {
    setSelectedTemplate(template)
    setProjectName(template.name)
    setStep("detail")
  }

  const handleUseTemplate = () => {
    setStep("create")
  }

  const handleBlankProject = () => {
    setSelectedTemplate(blankTemplate)
    setProjectName("")
    setStep("create")
  }

  const handleCreate = async () => {
    if (!projectName.trim()) return
    setCreating(true)

    try {
      const template = selectedTemplate || blankTemplate
      const body: Record<string, unknown> = {
        name: projectName.trim(),
        privacy: projectPrivacy,
        defaultView: template.defaultView,
        sections: template.sections,
        starterTasks: template.starterTasks,
        templateId: template.id,
      }

      const res = await fetch("/api/projects/from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (res.ok && json.data) {
        onClose()
        router.push(`/projects/${json.data.id}/list`)
      } else {
        console.error("Failed to create project", json)
      }
    } catch (e) {
      console.error("Failed to create project", e)
    }
    setCreating(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 isolate z-50 flex flex-col bg-background">
      {/* Gallery Step */}
      {step === "gallery" && (
        <GalleryStep
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          filteredTemplates={filteredTemplates}
          onSelect={handleSelectTemplate}
          onBlankProject={handleBlankProject}
          onClose={onClose}
        />
      )}

      {/* Detail Step */}
      {step === "detail" && selectedTemplate && (
        <DetailStep
          template={selectedTemplate}
          onBack={() => setStep("gallery")}
          onUse={handleUseTemplate}
          onClose={onClose}
        />
      )}

      {/* Create Step */}
      {step === "create" && (
        <CreateStep
          templateName={selectedTemplate?.name || "Blank project"}
          projectName={projectName}
          onProjectNameChange={setProjectName}
          privacy={projectPrivacy}
          onPrivacyChange={setProjectPrivacy}
          onBack={() => setStep(selectedTemplate?.id === "blank" ? "gallery" : "detail")}
          onCreate={handleCreate}
          onClose={onClose}
          creating={creating}
        />
      )}
    </div>
  )
}

function GalleryStep({
  activeCategory,
  onCategoryChange,
  filteredTemplates,
  onSelect,
  onBlankProject,
  onClose,
}: {
  activeCategory: string
  onCategoryChange: (c: string) => void
  filteredTemplates: ProjectTemplate[]
  onSelect: (t: ProjectTemplate) => void
  onBlankProject: () => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-6 py-3.5">
        <h1 className="text-base font-semibold text-foreground">Workflow gallery</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBlankProject}>
            Blank project
          </Button>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex shrink-0 gap-0 border-b px-6 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={cn(
              "relative shrink-0 px-3.5 py-3 text-sm whitespace-nowrap transition-colors cursor-pointer",
              activeCategory === cat
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground after:rounded-full"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h2 className="text-xl font-semibold text-foreground">Start working in seconds</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Power your everyday processes with popular workflows
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-all hover:shadow-sm hover:border-foreground/20 cursor-pointer"
              >
                {/* Preview */}
                <TemplatePreview template={template} />

                {/* Info */}
                <div className="flex flex-col gap-1.5 p-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">{template.name}</h3>
                    {template.new && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  <span className="mt-1 self-start rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    Great for {template.bestFor}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailStep({
  template,
  onBack,
  onUse,
  onClose,
}: {
  template: ProjectTemplate
  onBack: () => void
  onUse: () => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-6 py-3.5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="size-4" />
          Back to gallery
        </button>
        <button
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-5">
          {/* Left info column */}
          <div className="flex flex-col gap-5 lg:col-span-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Created by Asana</span>
              <h2 className="text-xl font-semibold text-foreground">
                {template.name}
                {template.new && (
                  <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary align-middle">
                    New
                  </span>
                )}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
            </div>

            {/* Features box */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium text-foreground mb-3">Asana Starter features</p>
              <div className="flex flex-wrap gap-1.5">
                {["Custom fields", "Rules", "Dashboards", "Timeline", "Forms", "Workflow builder"].map((f) => (
                  <span
                    key={f}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      template.features.includes(f)
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={onUse}>
              Use template
            </Button>
          </div>

          {/* Right preview column */}
          <div className="lg:col-span-3">
            <LargePreview template={template} />
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateStep({
  templateName,
  projectName,
  onProjectNameChange,
  privacy,
  onPrivacyChange,
  onBack,
  onCreate,
  onClose,
  creating,
}: {
  templateName: string
  projectName: string
  onProjectNameChange: (v: string) => void
  privacy: string
  onPrivacyChange: (v: string) => void
  onBack: () => void
  onCreate: () => void
  onClose: () => void
  creating: boolean
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-6 py-3.5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </button>
        <button
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-6 py-12">
          <h2 className="text-lg font-semibold text-foreground">Add project details</h2>

          <div className="mt-6 space-y-5">
            {/* Template */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Template</Label>
              <div className="flex h-8 items-center rounded-lg border border-input bg-muted/30 px-3 text-sm text-foreground">
                {templateName}
              </div>
            </div>

            {/* Project name */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Project name</Label>
              <Input
                value={projectName}
                onChange={(e) => onProjectNameChange(e.target.value)}
                placeholder="Project name"
                className="h-8 text-sm"
                autoFocus
              />
            </div>

            {/* Privacy */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Privacy</Label>
              <PrivacySelect value={privacy} onChange={onPrivacyChange} />
            </div>

            <Button
              size="lg"
              className="w-full mt-2"
              onClick={onCreate}
              disabled={!projectName.trim() || creating}
            >
              {creating ? "Creating..." : "Create project"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PrivacySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false)

  const options = [
    {
      value: "public",
      label: "Goozone Office",
      description: "Everyone in your workspace can find and access this project.",
    },
    {
      value: "private",
      label: "Private",
      description: "Only invited members can find and access this project.",
    },
  ]

  const selected = options.find((o) => o.value === value) || options[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 text-sm text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <span>{selected.label}</span>
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border bg-popover shadow-sm">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors cursor-pointer",
                  value === opt.value ? "bg-muted" : "hover:bg-muted/50"
                )}
              >
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  {opt.label}
                  {value === opt.value && <CheckIcon className="size-3.5 text-primary" />}
                </span>
                <span className="text-xs text-muted-foreground">{opt.description}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TemplatePreview({ template }: { template: ProjectTemplate }) {
  const colorMap: Record<string, string> = {
    purple: "bg-purple-100 dark:bg-purple-900/30",
    blue: "bg-blue-100 dark:bg-blue-900/30",
    red: "bg-red-100 dark:bg-red-900/30",
    green: "bg-green-100 dark:bg-green-900/30",
    yellow: "bg-yellow-100 dark:bg-yellow-900/30",
    orange: "bg-orange-100 dark:bg-orange-900/30",
    pink: "bg-pink-100 dark:bg-pink-900/30",
    teal: "bg-teal-100 dark:bg-teal-900/30",
    indigo: "bg-indigo-100 dark:bg-indigo-900/30",
    gray: "bg-muted",
  }

  const accentColorMap: Record<string, string> = {
    purple: "bg-purple-300 dark:bg-purple-600/50",
    blue: "bg-blue-300 dark:bg-blue-600/50",
    red: "bg-red-300 dark:bg-red-600/50",
    green: "bg-green-300 dark:bg-green-600/50",
    yellow: "bg-yellow-300 dark:bg-yellow-600/50",
    orange: "bg-orange-300 dark:bg-orange-600/50",
    pink: "bg-pink-300 dark:bg-pink-600/50",
    teal: "bg-teal-300 dark:bg-teal-600/50",
    indigo: "bg-indigo-300 dark:bg-indigo-600/50",
    gray: "bg-muted-foreground/20",
  }

  const bg = colorMap[template.color] || colorMap.gray
  const accent = accentColorMap[template.color] || accentColorMap.gray

  return (
    <div className={cn("flex h-32 items-center justify-center overflow-hidden", bg)}>
      {template.previewType === "list" && (
        <div className="flex w-full flex-col gap-1.5 px-4">
          {[60, 80, 50, 70].map((w, i) => (
            <div key={i} className={cn("h-2 rounded-full", accent)} style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
      {template.previewType === "board" && (
        <div className="flex w-full gap-2 px-3">
          {[1, 2, 3].map((col) => (
            <div key={col} className="flex flex-1 flex-col gap-1.5">
              <div className={cn("h-1.5 w-8 rounded-full", accent)} />
              <div className={cn("h-10 rounded-lg", accent.replace("300", "200").replace("600", "400"))} />
              <div className={cn("h-6 rounded-lg", accent.replace("300", "200").replace("600", "400"))} />
            </div>
          ))}
        </div>
      )}
      {template.previewType === "timeline" && (
        <div className="flex w-full flex-col gap-2 px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn("h-1.5 w-12 rounded-full", accent.replace("300", "200").replace("600", "400"))} />
              <div className={cn("h-2 flex-1 rounded-full", accent)} style={{ width: `${50 + i * 10}%` }} />
            </div>
          ))}
        </div>
      )}
      {template.previewType === "dashboard" && (
        <div className="flex w-full items-end justify-center gap-2 px-4">
          {[40, 60, 30, 70, 50].map((h, i) => (
            <div key={i} className={cn("w-4 rounded-t", accent)} style={{ height: `${h}%` }} />
          ))}
        </div>
      )}
    </div>
  )
}

function LargePreview({ template }: { template: ProjectTemplate }) {
  const colorMap: Record<string, string> = {
    purple: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40",
    blue: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40",
    red: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/40",
    green: "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800/40",
    yellow: "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800/40",
    orange: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/40",
    pink: "bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800/40",
    teal: "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/40",
    indigo: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40",
    gray: "bg-muted/30 border-border",
  }
  const bgColor = colorMap[template.color] || colorMap.gray

  return (
    <div className={cn("flex min-h-[400px] flex-col rounded-xl border p-5", bgColor)}>
      {/* Fake top bar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="size-3 rounded-full bg-muted-foreground/20" />
        <div className="h-2 w-24 rounded-full bg-muted-foreground/20" />
        <div className="ml-auto flex gap-1.5">
          <div className="size-2 rounded-full bg-muted-foreground/20" />
          <div className="size-2 rounded-full bg-muted-foreground/20" />
        </div>
      </div>

      {template.previewType === "list" && (
        <div className="flex flex-1 flex-col gap-3">
          <div className="grid grid-cols-4 gap-2 border-b pb-2">
            {["Task", "Assignee", "Due date", "Status"].map((h) => (
              <div key={h} className="h-2 rounded-full bg-muted-foreground/15" style={{ width: `${50 + Math.random() * 30}%` }} />
            ))}
          </div>
          {template.sections.slice(0, 3).map((section, si) => (
            <div key={si} className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-muted-foreground/20" />
                <div className="h-2 w-24 rounded-full bg-muted-foreground/20" />
              </div>
              {template.starterTasks
                .filter((t) => t.sectionIndex === si)
                .map((task, ti) => (
                  <div key={ti} className="ml-3 grid grid-cols-4 gap-2 rounded-lg bg-white/50 dark:bg-white/5 p-2">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full border border-muted-foreground/20" />
                      <div className="h-2 flex-1 rounded-full bg-muted-foreground/15" />
                    </div>
                    <div className="h-2 w-16 rounded-full bg-muted-foreground/15" />
                    <div className="h-2 w-12 rounded-full bg-muted-foreground/15" />
                    <div className="h-2 w-10 rounded-full bg-muted-foreground/15" />
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {template.previewType === "board" && (
        <div className="flex flex-1 gap-3 overflow-hidden">
          {template.sections.slice(0, 3).map((section, si) => (
            <div key={si} className="flex flex-1 flex-col gap-2 rounded-lg bg-white/50 dark:bg-white/5 p-2">
              <div className="h-2 w-16 rounded-full bg-muted-foreground/20" />
              {template.starterTasks
                .filter((t) => t.sectionIndex === si)
                .map((task, ti) => (
                  <div key={ti} className="flex flex-col gap-1.5 rounded-lg border bg-white/80 dark:bg-white/10 p-2">
                    <div className="h-2 w-full rounded-full bg-muted-foreground/15" />
                    <div className="h-2 w-2/3 rounded-full bg-muted-foreground/10" />
                    <div className="flex gap-1">
                      <div className="size-3 rounded-full bg-muted-foreground/10" />
                      <div className="size-3 rounded-full bg-muted-foreground/10" />
                    </div>
                  </div>
                ))}
              {template.starterTasks.filter((t) => t.sectionIndex === si).length === 0 && (
                <div className="flex flex-col gap-1.5 rounded-lg border border-dashed bg-white/30 dark:bg-white/5 p-2">
                  <div className="h-2 w-full rounded-full bg-muted-foreground/10" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {template.previewType === "timeline" && (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex gap-2">
            {["Jan", "Feb", "Mar", "Apr"].map((m) => (
              <div key={m} className="h-2 flex-1 rounded-full bg-muted-foreground/10" />
            ))}
          </div>
          {template.sections.slice(0, 4).map((section, si) => (
            <div key={si} className="flex items-center gap-3">
              <div className="h-2 w-20 shrink-0 rounded-full bg-muted-foreground/15" />
              <div
                className={cn(
                  "h-3 rounded-full",
                  si === 1 ? "bg-muted-foreground/25" : "bg-muted-foreground/15"
                )}
                style={{ width: `${60 - si * 10}%` }}
              />
            </div>
          ))}
        </div>
      )}

      {template.previewType === "dashboard" && (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-1 flex-col gap-2 rounded-lg bg-white/50 dark:bg-white/5 p-3">
                <div className="h-2 w-12 rounded-full bg-muted-foreground/15" />
                <div className="h-6 rounded bg-muted-foreground/10" />
              </div>
            ))}
          </div>
          <div className="flex flex-1 items-end gap-2 rounded-lg bg-white/50 dark:bg-white/5 p-4">
            {[30, 50, 40, 70, 60, 80, 45].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-muted-foreground/20" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
