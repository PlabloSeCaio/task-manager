"use client"

import * as React from "react"
import { Tabs } from "@base-ui/react/tabs"
import { cn } from "@/lib/utils"
import { ProfileTab } from "./profile-tab"
import { NotificationsTab } from "./notifications-tab"
import { PlaceholderTab } from "./placeholder-tab"

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "account", label: "Account" },
]

export function SettingsPage() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-popover shadow-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-8 py-5">
        <h1 className="text-base font-semibold text-foreground">Settings</h1>
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="profile">
        <Tabs.List className="flex shrink-0 gap-0 border-b px-8">
          {tabs.map((tab) => (
            <Tabs.Tab
              key={tab.id}
              value={tab.id}
              className={cn(
                "relative flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer",
                "text-muted-foreground hover:text-foreground",
                "data-active:text-foreground data-active:after:absolute data-active:after:bottom-0 data-active:after:left-0 data-active:after:right-0 data-active:after:h-0.5 data-active:after:bg-foreground data-active:after:rounded-full"
              )}
            >
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {/* Content */}
        <div className="overflow-y-auto">
          <Tabs.Panel value="profile">
            <ProfileTab />
          </Tabs.Panel>
          <Tabs.Panel value="notifications">
            <NotificationsTab />
          </Tabs.Panel>
          <Tabs.Panel value="account">
            <PlaceholderTab name="Account" />
          </Tabs.Panel>
        </div>
      </Tabs.Root>
    </div>
  )
}
