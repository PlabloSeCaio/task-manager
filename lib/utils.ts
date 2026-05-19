import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProjectViewSlug(defaultView?: string | null): string {
  switch (defaultView) {
    case "board": return "board"
    case "calendar": return "calendar"
    case "timeline": return "timeline"
    default: return "list"
  }
}

export function getProjectUrl(id: string | null, defaultView?: string | null): string {
  return `/projects/${id}/${getProjectViewSlug(defaultView)}`
}

export function parseDateString(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  const parts = dateStr.split("-")
  if (parts.length !== 3) return new Date(dateStr)
  const [y, m, d] = parts.map(Number)
  return new Date(y, m - 1, d)
}
