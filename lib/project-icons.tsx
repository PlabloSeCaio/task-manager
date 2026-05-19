import {
  List,
  Columns3,
  LayoutDashboard,
  Calendar,
  Briefcase,
  Rocket,
  Users,
  ChartNoAxesCombined,
  Star,
  Bug,
  Lightbulb,
  Globe,
  Settings,
  Notebook,
  Monitor,
  CheckCircle,
  Target,
  Code,
  Megaphone,
  MessageSquare,
  Archive,
  type LucideIcon,
} from "lucide-react"

export interface ProjectIconDef {
  id: string
  label: string
  icon: LucideIcon
}

export const projectIcons: ProjectIconDef[] = [
  { id: "list", label: "List", icon: List },
  { id: "board", label: "Board", icon: Columns3 },
  { id: "timeline", label: "Timeline", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "briefcase", label: "Briefcase", icon: Briefcase },
  { id: "rocket", label: "Rocket", icon: Rocket },
  { id: "people", label: "People", icon: Users },
  { id: "chart", label: "Chart", icon: ChartNoAxesCombined },
  { id: "star", label: "Star", icon: Star },
  { id: "bug", label: "Bug", icon: Bug },
  { id: "lightbulb", label: "Lightbulb", icon: Lightbulb },
  { id: "globe", label: "Globe", icon: Globe },
  { id: "gear", label: "Gear", icon: Settings },
  { id: "notebook", label: "Notebook", icon: Notebook },
  { id: "monitor", label: "Monitor", icon: Monitor },
  { id: "check-circle", label: "Check Circle", icon: CheckCircle },
  { id: "target", label: "Target", icon: Target },
  { id: "code", label: "Code", icon: Code },
  { id: "megaphone", label: "Megaphone", icon: Megaphone },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "archive", label: "Archive", icon: Archive },
]

export function getIconById(id: string | null | undefined): LucideIcon | null {
  if (!id) return null
  const found = projectIcons.find((i) => i.id === id)
  return found?.icon || null
}

export function getDefaultIconForView(defaultView: string | null | undefined): string {
  switch (defaultView) {
    case "list":
      return "list"
    case "board":
      return "board"
    case "calendar":
      return "calendar"
    case "timeline":
      return "timeline"
    default:
      return "list"
  }
}
