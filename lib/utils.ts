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
