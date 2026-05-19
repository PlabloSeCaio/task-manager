"use client"

import * as React from "react"
import { Accordion } from "@base-ui/react/accordion"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotifState {
  browser: Record<string, boolean>
  project: Record<string, boolean>
  portfolio: Record<string, boolean>
  goal: Record<string, boolean>
  email: Record<string, boolean>
  dnd: Record<string, unknown>
}

const defaultNotifs = {
  browser: {
    workShared: true,
    workAssigned: true,
    accessRequested: true,
    mention: true,
    comments: true,
    appreciation: true,
    statusUpdates: true,
    messages: true,
    addedCollaborator: true,
    workDetailsChanged: true,
    workAddedPortfolio: true,
    tasksAddedProject: true,
    dailyTasks: false,
    weeklyOverdue: false,
  },
  project: {
    statusUpdates: true,
    messages: true,
    tasksAdded: true,
  },
  portfolio: {
    statusUpdates: true,
    messages: true,
    workAdded: true,
  },
  goal: {
    statusUpdates: true,
    progressUpdates: true,
    newGoals: true,
  },
  email: {
    workShared: false,
    workAssigned: true,
    dueDateChanged: true,
    workCompleted: true,
    workBlocked: false,
    reactions: false,
    accessRequested: false,
    mention: true,
    comments: true,
    appreciation: false,
    statusUpdates: true,
    messages: true,
    addedCollaborator: true,
    workDetailsChanged: false,
    workCompletedNotif: true,
    workAddedPortfolio: false,
    tasksAddedProject: true,
    dailyTasks: false,
    weeklyOverdue: false,
    weeklyPortfolio: false,
    smartSummaries: false,
    draftReminders: true,
    commentFollowup: true,
    inviteUpdates: true,
    tips: true,
  },
  dnd: {
    enabled: false,
    startTime: "22:00",
    endTime: "07:00",
    days: ["Sat", "Sun"] as string[],
  },
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function NotificationsTab() {
  const [notifs, setNotifs] = React.useState<NotifState>(defaultNotifs)
  const [loaded, setLoaded] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/users/settings")
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.notifications) {
          const n = res.data.notifications as NotifState
          setNotifs({
            browser: { ...defaultNotifs.browser, ...n.browser },
            project: { ...defaultNotifs.project, ...n.project },
            portfolio: { ...defaultNotifs.portfolio, ...n.portfolio },
            goal: { ...defaultNotifs.goal, ...n.goal },
            email: { ...defaultNotifs.email, ...n.email },
            dnd: { ...defaultNotifs.dnd, ...n.dnd },
          })
        }
        setLoaded(true)
      })
      .catch(console.error)
  }, [])

  const update = React.useCallback(async (section: string, key: string, value: unknown) => {
    setSaving(true)
    setNotifs((prev) => ({
      ...prev,
      [section]: { ...prev[section as keyof NotifState] as Record<string, unknown>, [key]: value },
    }))
    const updated = {
      ...notifs,
      [section]: { ...(notifs[section as keyof NotifState] as Record<string, unknown>), [key]: value },
    }
    try {
      await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: updated }),
      })
    } catch (e) {
      console.error("Failed to save notification", e)
    }
    setSaving(false)
  }, [notifs])

  const toggleDay = React.useCallback((day: string) => {
    const days = (notifs.dnd.days as string[]) || []
    const updated = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day]
    update("dnd", "days", updated)
  }, [notifs.dnd.days, update])

  if (!loaded) {
    return <div className="py-8 text-center text-xs text-muted-foreground">Loading notification preferences...</div>
  }

  return (
    <div className="px-8 py-6">
      <Accordion.Root defaultValue={[]} className="space-y-3">
        {/* Browser Notifications */}
        <AccPanel title="Browser notifications" subtitle="Customize what notifications you receive in your browser">
          <NotifGroup label="Updates on your work">
            <NotifCheckbox label="When work is shared with you" checked={notifs.browser.workShared} onChange={(c) => update("browser", "workShared", c)} />
            <NotifCheckbox label="When work is assigned to you" checked={notifs.browser.workAssigned} onChange={(c) => update("browser", "workAssigned", c)} />
            <NotifCheckbox label="When someone requests access to your work" checked={notifs.browser.accessRequested} onChange={(c) => update("browser", "accessRequested", c)} />
          </NotifGroup>
          <NotifGroup label="Communication">
            <NotifCheckbox label="Someone mentions @username" checked={notifs.browser.mention} onChange={(c) => update("browser", "mention", c)} />
            <NotifCheckbox label="When comments or attachments are sent" checked={notifs.browser.comments} onChange={(c) => update("browser", "comments", c)} />
            <NotifCheckbox label="When appreciation stickers are sent" checked={notifs.browser.appreciation} onChange={(c) => update("browser", "appreciation", c)} />
            <NotifCheckbox label="When status updates are posted" checked={notifs.browser.statusUpdates} onChange={(c) => update("browser", "statusUpdates", c)} />
            <NotifCheckbox label="When messages are sent" checked={notifs.browser.messages} onChange={(c) => update("browser", "messages", c)} />
          </NotifGroup>
          <NotifGroup label="Updates to work you collaborate on">
            <NotifCheckbox label="When you're added as a collaborator" checked={notifs.browser.addedCollaborator} onChange={(c) => update("browser", "addedCollaborator", c)} />
            <NotifCheckbox label="When work details change" checked={notifs.browser.workDetailsChanged} onChange={(c) => update("browser", "workDetailsChanged", c)} />
            <NotifCheckbox label="When work is added to a portfolio" checked={notifs.browser.workAddedPortfolio} onChange={(c) => update("browser", "workAddedPortfolio", c)} />
            <NotifCheckbox label="When tasks are added to a project" checked={notifs.browser.tasksAddedProject} onChange={(c) => update("browser", "tasksAddedProject", c)} />
          </NotifGroup>
          <NotifGroup label="Summaries">
            <NotifCheckbox label="Daily tasks assigned to you" checked={notifs.browser.dailyTasks} onChange={(c) => update("browser", "dailyTasks", c)} />
            <NotifCheckbox label="Weekly overdue tasks" checked={notifs.browser.weeklyOverdue} onChange={(c) => update("browser", "weeklyOverdue", c)} />
          </NotifGroup>
        </AccPanel>

        {/* Project Notifications */}
        <AccPanel title="Project notifications">
          <div className="space-y-3">
            <NotifToggle label="Status updates" checked={notifs.project.statusUpdates} onChange={(c) => update("project", "statusUpdates", c)} />
            <NotifToggle label="Messages" checked={notifs.project.messages} onChange={(c) => update("project", "messages", c)} />
            <NotifToggle label="Tasks added" checked={notifs.project.tasksAdded} onChange={(c) => update("project", "tasksAdded", c)} />
            <Button variant="outline" size="sm" className="mt-2 text-xs">Manage individual projects</Button>
            <p className="mt-2 text-xs text-muted-foreground">Individual project settings will override default settings</p>
          </div>
        </AccPanel>

        {/* Portfolio Notifications */}
        <AccPanel title="Portfolio notifications">
          <div className="space-y-3">
            <NotifToggle label="Status updates" checked={notifs.portfolio.statusUpdates} onChange={(c) => update("portfolio", "statusUpdates", c)} />
            <NotifToggle label="Messages" checked={notifs.portfolio.messages} onChange={(c) => update("portfolio", "messages", c)} />
            <NotifToggle label="Work added" checked={notifs.portfolio.workAdded} onChange={(c) => update("portfolio", "workAdded", c)} />
            <Button variant="outline" size="sm" className="mt-2 text-xs">Manage individual portfolios</Button>
            <p className="mt-2 text-xs text-muted-foreground">Individual portfolio settings will override default settings</p>
          </div>
        </AccPanel>

        {/* Goal Notifications */}
        <AccPanel title="Goal notifications">
          <div className="space-y-3">
            <NotifToggle label="Status updates" checked={notifs.goal.statusUpdates} onChange={(c) => update("goal", "statusUpdates", c)} />
            <NotifToggle label="Progress updates" checked={notifs.goal.progressUpdates} onChange={(c) => update("goal", "progressUpdates", c)} />
            <NotifToggle label="New goals added" checked={notifs.goal.newGoals} onChange={(c) => update("goal", "newGoals", c)} />
          </div>
        </AccPanel>

        {/* Email Notifications */}
        <AccPanel title="Email notifications">
          <NotifGroup label="Updates on your work">
            <NotifCheckbox label="When work is shared with you" checked={notifs.email.workShared} onChange={(c) => update("email", "workShared", c)} />
            <NotifCheckbox label="When work is assigned to you" checked={notifs.email.workAssigned} onChange={(c) => update("email", "workAssigned", c)} />
            <NotifCheckbox label="When due date changes on work assigned to you" checked={notifs.email.dueDateChanged} onChange={(c) => update("email", "dueDateChanged", c)} />
            <NotifCheckbox label="When work assigned to you is completed" checked={notifs.email.workCompleted} onChange={(c) => update("email", "workCompleted", c)} />
            <NotifCheckbox label="When your work is blocked or unblocked" checked={notifs.email.workBlocked} onChange={(c) => update("email", "workBlocked", c)} />
            <NotifCheckbox label="When someone likes or reacts to your work" checked={notifs.email.reactions} onChange={(c) => update("email", "reactions", c)} />
            <NotifCheckbox label="When someone requests access to your work" checked={notifs.email.accessRequested} onChange={(c) => update("email", "accessRequested", c)} />
          </NotifGroup>
          <NotifGroup label="Communication">
            <NotifCheckbox label="Someone mentions @username" checked={notifs.email.mention} onChange={(c) => update("email", "mention", c)} />
            <NotifCheckbox label="When comments or attachments are sent" checked={notifs.email.comments} onChange={(c) => update("email", "comments", c)} />
            <NotifCheckbox label="When appreciation stickers are sent" checked={notifs.email.appreciation} onChange={(c) => update("email", "appreciation", c)} />
            <NotifCheckbox label="When status updates are posted" checked={notifs.email.statusUpdates} onChange={(c) => update("email", "statusUpdates", c)} />
            <NotifCheckbox label="When messages are sent" checked={notifs.email.messages} onChange={(c) => update("email", "messages", c)} />
          </NotifGroup>
          <NotifGroup label="Updates to work you collaborate on">
            <NotifCheckbox label="When you're added as a collaborator" checked={notifs.email.addedCollaborator} onChange={(c) => update("email", "addedCollaborator", c)} />
            <NotifCheckbox label="When work details change" checked={notifs.email.workDetailsChanged} onChange={(c) => update("email", "workDetailsChanged", c)} />
            <NotifCheckbox label="When work is completed" checked={notifs.email.workCompletedNotif} onChange={(c) => update("email", "workCompletedNotif", c)} />
            <NotifCheckbox label="When work is added to a portfolio" checked={notifs.email.workAddedPortfolio} onChange={(c) => update("email", "workAddedPortfolio", c)} />
            <NotifCheckbox label="When tasks are added to a project" checked={notifs.email.tasksAddedProject} onChange={(c) => update("email", "tasksAddedProject", c)} />
          </NotifGroup>
          <NotifGroup label="Summaries">
            <NotifCheckbox label="Daily tasks assigned to you" checked={notifs.email.dailyTasks} onChange={(c) => update("email", "dailyTasks", c)} />
            <NotifCheckbox label="Weekly overdue tasks" checked={notifs.email.weeklyOverdue} onChange={(c) => update("email", "weeklyOverdue", c)} />
            <NotifCheckbox label="Weekly portfolio updates" checked={notifs.email.weeklyPortfolio} onChange={(c) => update("email", "weeklyPortfolio", c)} />
            <NotifCheckbox label="Recommended project and portfolio smart summaries" checked={notifs.email.smartSummaries} onChange={(c) => update("email", "smartSummaries", c)} />
          </NotifGroup>
          <NotifGroup label="Other">
            <NotifCheckbox label="Reminders to finish drafted comments" checked={notifs.email.draftReminders} onChange={(c) => update("email", "draftReminders", c)} />
            <NotifCheckbox label="Reminders to follow up on comments to you" checked={notifs.email.commentFollowup} onChange={(c) => update("email", "commentFollowup", c)} />
            <NotifCheckbox label="Updates about users you've invited" checked={notifs.email.inviteUpdates} onChange={(c) => update("email", "inviteUpdates", c)} />
            <NotifCheckbox label="Tips to get more out of Asana" checked={notifs.email.tips} onChange={(c) => update("email", "tips", c)} />
          </NotifGroup>
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Preferred notification email</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={notifs.email.draftReminders ? "Primary email (set in Account)" : ""}
                readOnly
                className="h-7 flex-1 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Add or remove emails from the Account tab.
            </p>
            <button className="mt-1 text-xs text-primary hover:underline cursor-pointer">
              About email notifications
            </button>
          </div>
        </AccPanel>

        {/* Do Not Disturb */}
        <AccPanel title="Do not disturb">
          <div className="space-y-4">
            <Button variant="outline" size="sm" className="text-xs">Pause notifications</Button>

            <div>
              <p className="text-xs font-medium text-foreground mb-2">Schedule</p>
              <NotifCheckbox
                label="Do not notify me from:"
                checked={notifs.dnd.enabled as boolean}
                onChange={(c) => update("dnd", "enabled", c)}
              />
              {(notifs.dnd.enabled as boolean) && (
                <div className="mt-2 ml-5 flex items-center gap-2">
                  <input
                    type="time"
                    value={notifs.dnd.startTime as string}
                    onChange={(e) => update("dnd", "startTime", e.target.value)}
                    className="h-7 rounded-lg border border-input bg-transparent px-2 text-xs text-foreground"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <input
                    type="time"
                    value={notifs.dnd.endTime as string}
                    onChange={(e) => update("dnd", "endTime", e.target.value)}
                    className="h-7 rounded-lg border border-input bg-transparent px-2 text-xs text-foreground"
                  />
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-foreground mb-2">Do not disturb me on my days off</p>
              <div className="flex gap-1">
                {daysOfWeek.map((day) => {
                  const active = ((notifs.dnd.days as string[]) || []).includes(day)
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "size-8 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {day[0]}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </AccPanel>
      </Accordion.Root>

      {saving && (
        <div className="fixed bottom-6 right-6 rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-sm">
          Saving...
        </div>
      )}
    </div>
  )
}

function AccPanel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Accordion.Item value={title} className="rounded-lg border">
      <Accordion.Header className="flex">
        <Accordion.Trigger className="group flex w-full items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-muted/50 transition-colors rounded-[inherit]">
          <div>
            <span className="text-sm font-medium text-foreground">{title}</span>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-data-open:rotate-180" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className="px-4 pb-4">
        {children}
      </Accordion.Panel>
    </Accordion.Item>
  )
}

function NotifGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function NotifCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer group">
      <Checkbox checked={checked} onCheckedChange={onChange} className="mt-0.5" />
      <span className="text-xs text-foreground leading-tight group-hover:text-foreground">{label}</span>
    </label>
  )
}

function NotifToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} size="sm" />
    </div>
  )
}
