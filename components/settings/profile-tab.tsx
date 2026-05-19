"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
import { Accordion } from "@base-ui/react/accordion"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ChevronDownIcon, Loader2Icon } from "lucide-react"

interface UserSettings {
  name: string
  email: string
  avatarUrl?: string | null
  createdAt?: string | null
  nickname?: string | null
  jobTitle?: string | null
  department?: string | null
  about?: string | null
  personalization?: Record<string, unknown>
  showCertifications?: boolean
  outOfOffice?: Record<string, unknown>
}

function resolveAvatarSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith("data:") || url.startsWith("http")) return url
  return `/api/avatar?key=${encodeURIComponent(url)}`
}

export function ProfileTab() {
  const { user } = useUser()
  const [settings, setSettings] = React.useState<UserSettings | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const originalNameRef = React.useRef("")

  React.useEffect(() => {
    fetch("/api/users/settings")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setSettings(res.data)
          originalNameRef.current = res.data.name || ""
        }
      })
      .catch(console.error)
  }, [])

  const updateField = React.useCallback(async (field: string, value: unknown) => {
    setSaving(true)
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev))
    try {
      await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
    } catch (e) {
      console.error("Failed to save", e)
    }
    setSaving(false)
  }, [])

  const updateName = React.useCallback(async (name: string) => {
    setSaving(true)
    setSettings((prev) => (prev ? { ...prev, name } : prev))
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
    } catch (e) {
      console.error("Failed to save name", e)
    }
    setSaving(false)
  }, [])

  const updatePersonalization = React.useCallback(async (key: string, value: unknown) => {
    const current = settings?.personalization || {}
    const updated = { ...current, [key]: value }
    await updateField("personalization", updated)
  }, [settings, updateField])

  const saveAvatar = React.useCallback(async (avatarUrl: string | null) => {
    setSettings((prev) => (prev ? { ...prev, avatarUrl } : prev))
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl }),
    })
  }, [])

  const handlePhotoUpload = React.useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      const presignData = await presignRes.json()

      if (presignRes.ok) {
        await fetch(presignData.data.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        })
        await saveAvatar(presignData.data.key)
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        await saveAvatar(dataUrl)
      }
    } catch (err) {
      console.error("Upload failed", err)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [saveAvatar])

  const handlePhotoRemove = React.useCallback(async () => {
    setSaving(true)
    await saveAvatar(null)
    setSaving(false)
  }, [saveAvatar])

  const displayName = settings?.nickname || settings?.name || user?.fullName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Unnamed"
  const displayEmail = settings?.email || user?.emailAddresses?.[0]?.emailAddress || ""
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  const avatarUrl = resolveAvatarSrc(settings?.avatarUrl) || user?.imageUrl

  return (
    <div className="px-8 py-6 space-y-10">
      {/* Photo */}
      <Section>
        <SectionTitle>Your photo</SectionTitle>
        <div className="mt-4 flex items-start gap-6">
          <Avatar className="size-16 shrink-0">
            <AvatarImage src={avatarUrl || ""} />
            <AvatarFallback className="text-base">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handlePhotoUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2Icon className="size-3 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload new photo"
                )}
              </Button>
              {avatarUrl && (
                <Button variant="ghost" size="sm" onClick={handlePhotoRemove}>
                  Remove photo
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Photos help your teammates recognize you in Asana
            </p>
          </div>
        </div>
      </Section>

      {/* Main Fields */}
      <Section>
        <div className="mt-4 grid grid-cols-[160px_1fr] gap-x-6 gap-y-6 items-start">
          <FieldLabel>Your full name *</FieldLabel>
          <Input
            value={settings?.name || ""}
            onChange={(e) => setSettings((prev) => prev ? { ...prev, name: e.target.value } : prev)}
            onBlur={(e) => {
              if (e.target.value !== originalNameRef.current) {
                originalNameRef.current = e.target.value
                updateName(e.target.value || "Unnamed")
              }
            }}
            className="h-8 text-sm"
          />

          <FieldLabel>Nickname</FieldLabel>
          <Input
            value={settings?.nickname || ""}
            onChange={(e) => setSettings((prev) => prev ? { ...prev, nickname: e.target.value } : prev)}
            onBlur={(e) => updateField("nickname", e.target.value || null)}
            placeholder="Display name (optional)"
            className="h-8 text-sm"
          />

          <FieldLabel>Job title</FieldLabel>
          <Input
            value={settings?.jobTitle || ""}
            onChange={(e) => setSettings((prev) => prev ? { ...prev, jobTitle: e.target.value } : prev)}
            onBlur={(e) => updateField("jobTitle", e.target.value || null)}
            placeholder="e.g. Product Designer"
            className="h-8 text-sm"
          />

          <FieldLabel>Department or team</FieldLabel>
          <Input
            value={settings?.department || ""}
            onChange={(e) => setSettings((prev) => prev ? { ...prev, department: e.target.value } : prev)}
            onBlur={(e) => updateField("department", e.target.value || null)}
            placeholder="e.g. Engineering"
            className="h-8 text-sm"
          />

          <FieldLabel>Email</FieldLabel>
          <Input
            value={displayEmail}
            readOnly
            className="h-8 text-sm text-muted-foreground bg-muted/50 cursor-not-allowed"
          />
        </div>
      </Section>

      {/* About */}
      <Section>
        <SectionTitle>About me</SectionTitle>
        <Textarea
          value={settings?.about || ""}
          onChange={(e) => setSettings((prev) => prev ? { ...prev, about: e.target.value } : prev)}
          onBlur={(e) => updateField("about", e.target.value || null)}
          placeholder="Write a short bio..."
          className="mt-3 h-24 text-sm"
        />
      </Section>

      {/* Personalization Settings Accordion */}
      <div className="overflow-hidden rounded-lg border">
        <Accordion.Root>
          <Accordion.Item value="personalization">
            <Accordion.Header className="flex">
              <Accordion.Trigger className="group flex w-full items-center justify-between px-5 py-3.5 text-left cursor-pointer hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium text-foreground">Personalization settings</span>
                <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-data-open:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className="px-5 pb-5">
              <p className="mb-5 text-xs text-muted-foreground">
                Only you can see these fields. We use them to tailor Asana to you and to share relevant product recommendations.
              </p>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <SelectField
                  label="Job details"
                  value={(settings?.personalization?.jobDetails as string) || ""}
                  onChange={(v) => updatePersonalization("jobDetails", v)}
                  options={["", "Individual contributor", "Manager", "Director", "VP", "C-level"]}
                />
                <SelectField
                  label="Role"
                  value={(settings?.personalization?.role as string) || ""}
                  onChange={(v) => updatePersonalization("role", v)}
                  options={["", "Product management", "Engineering", "Design", "Marketing", "Sales", "Operations", "HR", "Finance", "Legal", "Other"]}
                />
                <SelectField
                  label="Functions"
                  value={(settings?.personalization?.functions as string) || ""}
                  onChange={(v) => updatePersonalization("functions", v)}
                  options={["", "Project management", "Task management", "Portfolio management", "Goal setting", "Reporting"]}
                />
                <SelectField
                  label="Specialties"
                  value={(settings?.personalization?.specialties as string) || ""}
                  onChange={(v) => updatePersonalization("specialties", v)}
                  options={["", "Agile", "Waterfall", "Scrum", "Kanban", "Hybrid"]}
                />
                <SelectField
                  label="Industry"
                  value={(settings?.personalization?.industry as string) || ""}
                  onChange={(v) => updatePersonalization("industry", v)}
                  options={["", "Technology", "Healthcare", "Finance", "Education", "Government", "Non-profit", "Media", "Retail", "Manufacturing", "Other"]}
                />
                <SelectField
                  label="Use cases"
                  value={(settings?.personalization?.useCases as string) || ""}
                  onChange={(v) => updatePersonalization("useCases", v)}
                  options={["", "Personal productivity", "Team collaboration", "Cross-functional projects", "Company-wide initiatives", "Client management"]}
                />
                <SelectField
                  label="Intended use"
                  value={(settings?.personalization?.intendedUse as string) || ""}
                  onChange={(v) => updatePersonalization("intendedUse", v)}
                  options={["", "Personal", "Team", "Department", "Company"]}
                />
              </div>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      </div>

      {/* Certifications */}
      <Section>
        <SectionTitle>Collaborative work management certifications</SectionTitle>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Showcase your certifications to your teammates and organization.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Switch
            checked={!!settings?.showCertifications}
            onCheckedChange={(checked) => updateField("showCertifications", checked)}
            size="sm"
          />
          <span className="text-xs text-muted-foreground">Show publicly</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            Hovercard dropdown
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            Profile dropdown
          </Button>
        </div>
      </Section>

      {/* Out of Office */}
      <Section>
        <SectionTitle>Out of office</SectionTitle>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Indicate when you are away to your teammates
        </p>
        <Button variant="outline" size="sm" className="mt-4 text-xs">
          Set out of office
        </Button>
      </Section>

      {/* Footer Info */}
      <div className="border-t pt-5">
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Invite type: Member</p>
          {settings?.createdAt && (
            <p>Signed up on {new Date(settings.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          )}
        </div>
      </div>

      {saving && (
        <div className="fixed bottom-6 right-6 rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-sm">
          Saving...
        </div>
      )}
    </div>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="border-b pb-6 last:border-b-0">{children}</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-medium text-foreground">{children}</h3>
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="pt-1 text-xs text-muted-foreground leading-tight">
      {children}
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} disabled={opt === ""}>
            {opt || "Select..."}
          </option>
        ))}
      </select>
    </div>
  )
}
