"use client"

import { cn } from "@/lib/utils"
import { getIconById, getDefaultIconForView } from "@/lib/project-icons"
import type { LucideIcon } from "lucide-react"

export const projectColorPalette = [
  { id: "gray", label: "Gray", class: "bg-gray-400", ring: "ring-gray-400" },
  { id: "red", label: "Red", class: "bg-red-500", ring: "ring-red-500" },
  { id: "orange", label: "Orange", class: "bg-orange-500", ring: "ring-orange-500" },
  { id: "yellow", label: "Yellow", class: "bg-yellow-500", ring: "ring-yellow-500" },
  { id: "green", label: "Green", class: "bg-green-500", ring: "ring-green-500" },
  { id: "teal", label: "Teal", class: "bg-teal-500", ring: "ring-teal-500" },
  { id: "cyan", label: "Cyan", class: "bg-cyan-500", ring: "ring-cyan-500" },
  { id: "blue", label: "Blue", class: "bg-blue-500", ring: "ring-blue-500" },
  { id: "indigo", label: "Indigo", class: "bg-indigo-500", ring: "ring-indigo-500" },
  { id: "purple", label: "Purple", class: "bg-purple-500", ring: "ring-purple-500" },
  { id: "pink", label: "Pink", class: "bg-pink-500", ring: "ring-pink-500" },
  { id: "rose", label: "Rose", class: "bg-rose-500", ring: "ring-rose-500" },
  { id: "brown", label: "Brown", class: "bg-amber-700", ring: "ring-amber-700" },
]

export function getColorClass(colorId: string | null | undefined): string {
  const found = projectColorPalette.find((c) => c.id === colorId)
  return found?.class || "bg-blue-500"
}

export function getColorRing(colorId: string | null | undefined): string {
  const found = projectColorPalette.find((c) => c.id === colorId)
  return found?.ring || "ring-blue-500"
}

interface ProjectThumbnailProps {
  name: string
  color?: string | null
  icon?: string | null
  defaultView?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ProjectThumbnail({
  name,
  color,
  icon,
  defaultView,
  size = "sm",
  className,
}: ProjectThumbnailProps) {
  const resolvedIconId = icon || getDefaultIconForView(defaultView || "list")
  const IconComponent: LucideIcon | null = getIconById(resolvedIconId)
  const bgClass = getColorClass(color)
  const sizeClasses = {
    sm: "size-5 text-[10px]",
    md: "size-7 text-xs",
    lg: "size-9 text-sm",
  }
  const iconSize = size === "sm" ? "size-3" : size === "md" ? "size-4" : "size-5"

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md text-white font-bold",
        sizeClasses[size],
        bgClass,
        className
      )}
    >
      {IconComponent ? (
        <IconComponent className={iconSize} />
      ) : (
        (name || "P").charAt(0).toUpperCase()
      )}
    </span>
  )
}
