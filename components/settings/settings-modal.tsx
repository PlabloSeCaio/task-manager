"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
import { Tabs } from "@base-ui/react/tabs"
import { XIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ProfileTab } from "./profile-tab"
import { NotificationsTab } from "./notifications-tab"
import { PlaceholderTab } from "./placeholder-tab"

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "account", label: "Account" },
]

export function SettingsModal() {
  const { user } = useUser()

  return (
    <div className="mx-auto flex max-w-[720px] flex-col rounded-xl border bg-popover shadow-sm max-h-[90vh]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
        <h1 className="text-base font-medium text-foreground">Settings</h1>
        <Link
          href="/home"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <XIcon className="size-4" />
        </Link>
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="profile">
        <Tabs.List className="flex shrink-0 gap-0 border-b px-6">
          {tabs.map((tab) => (
            <Tabs.Tab
              key={tab.id}
              value={tab.id}
              className={cn(
                "relative flex items-center px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
                "text-muted-foreground hover:text-foreground",
                "data-active:text-foreground data-active:after:absolute data-active:after:bottom-0 data-active:after:left-0 data-active:after:right-0 data-active:after:h-0.5 data-active:after:bg-foreground data-active:after:rounded-full"
              )}
            >
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs.Panel value="profile" className="p-6">
            <ProfileTab />
          </Tabs.Panel>
          <Tabs.Panel value="notifications" className="p-6">
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
