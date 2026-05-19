export interface TemplateField {
  name: string
  type: "text" | "date" | "single_select" | "multi_select"
}

export interface TemplateStarterTask {
  name: string
  sectionIndex: number
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: string
  bestFor: string
  defaultView: "list" | "board" | "calendar" | "timeline"
  color: string
  sections: string[]
  starterTasks: TemplateStarterTask[]
  fields: TemplateField[]
  features: string[]
  previewType: "list" | "board" | "timeline" | "dashboard"
  new?: boolean
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: "content-calendar",
    name: "Content calendar",
    description: "Plan content, organize assets, and view schedules by channel.",
    category: "Marketing",
    bestFor: "Marketing",
    defaultView: "list",
    color: "purple",
    sections: ["Ideas", "In progress", "Scheduled", "Published"],
    starterTasks: [
      { name: "Draft campaign post", sectionIndex: 1 },
      { name: "Review creative assets", sectionIndex: 1 },
      { name: "Schedule social post", sectionIndex: 2 },
      { name: "Publish newsletter", sectionIndex: 3 },
    ],
    fields: [
      { name: "Priority", type: "single_select" },
      { name: "Channel", type: "single_select" },
    ],
    features: ["Custom fields", "Timeline"],
    previewType: "list",
  },
  {
    id: "project-timeline",
    name: "Project timeline",
    description: "Map out dependencies, milestones, and deadlines to keep your projects on track.",
    category: "Operations & PMO",
    bestFor: "Ops & PMO",
    defaultView: "timeline",
    color: "blue",
    sections: ["Planning", "In progress", "Blocked", "Completed"],
    starterTasks: [
      { name: "Identify stakeholders", sectionIndex: 0 },
      { name: "Schedule kickoff", sectionIndex: 0 },
      { name: "Align on goals", sectionIndex: 0 },
      { name: "Prepare presentation", sectionIndex: 1 },
      { name: "Present to leadership", sectionIndex: 3 },
    ],
    fields: [
      { name: "Priority", type: "single_select" },
      { name: "Dependencies", type: "multi_select" },
    ],
    features: ["Timeline", "Dependencies", "Milestones"],
    previewType: "timeline",
  },
  {
    id: "bug-tracking",
    name: "Bug tracking",
    description: "File, assign, and prioritize bugs in one place to fix issues faster.",
    category: "Operations & PMO",
    bestFor: "IT",
    defaultView: "list",
    color: "red",
    sections: ["New / Not yet triaged", "High priority", "Medium priority", "Fixed", "Archived"],
    starterTasks: [
      { name: "Text in settings tab overflowing container", sectionIndex: 0 },
      { name: "Login button does not appear in Chrome", sectionIndex: 0 },
      { name: "App crashes when posting new photo", sectionIndex: 1 },
      { name: "Site not translating in Safari", sectionIndex: 1 },
      { name: "Search results not correct", sectionIndex: 2 },
    ],
    fields: [
      { name: "Priority", type: "single_select" },
      { name: "Bug status", type: "single_select" },
    ],
    features: ["Custom fields", "Rules"],
    previewType: "list",
    new: true,
  },
  {
    id: "cross-functional-project",
    name: "Cross-functional project plan",
    description: "Create tasks, add due dates, and organize work by stage to align teams.",
    category: "Operations & PMO",
    bestFor: "All teams",
    defaultView: "list",
    color: "green",
    sections: ["Planning", "In progress", "Review", "Completed"],
    starterTasks: [
      { name: "Define project goals", sectionIndex: 0 },
      { name: "Assign owners", sectionIndex: 0 },
      { name: "Create project brief", sectionIndex: 1 },
      { name: "Review deliverables", sectionIndex: 2 },
      { name: "Launch project", sectionIndex: 3 },
    ],
    fields: [{ name: "Priority", type: "single_select" }],
    features: ["Custom fields", "Dashboards"],
    previewType: "list",
  },
  {
    id: "1on1-meeting",
    name: "1:1 Meeting agenda",
    description: "Track agenda items, meeting notes, and next steps.",
    category: "Productivity",
    bestFor: "All teams",
    defaultView: "list",
    color: "yellow",
    sections: ["Agenda items", "Discussion topics", "Action items", "Completed"],
    starterTasks: [
      { name: "Add next meeting topic", sectionIndex: 0 },
      { name: "Review priorities", sectionIndex: 0 },
      { name: "Discuss blockers", sectionIndex: 1 },
      { name: "Confirm follow-up actions", sectionIndex: 2 },
    ],
    fields: [{ name: "Priority", type: "single_select" }],
    features: ["Forms"],
    previewType: "list",
  },
  {
    id: "meeting-agenda",
    name: "Meeting agenda",
    description: "Capture agenda items, next steps, and action items to keep meetings focused and productive.",
    category: "Productivity",
    bestFor: "All teams",
    defaultView: "list",
    color: "orange",
    sections: ["Meeting agenda", "Topic suggestions", "Action items", "Completed agenda topics", "Reference"],
    starterTasks: [
      { name: "5/6 meeting agenda", sectionIndex: 0 },
      { name: "Quarterly goal recap", sectionIndex: 0 },
      { name: "Improving cross-functional collaboration", sectionIndex: 1 },
      { name: "Dig into April numbers", sectionIndex: 1 },
      { name: "Plan virtual team building", sectionIndex: 2 },
    ],
    fields: [{ name: "Priority", type: "single_select" }],
    features: ["Forms", "Custom fields"],
    previewType: "list",
  },
  {
    id: "creative-requests",
    name: "Creative requests",
    description: "Track creative requests, collect feedback, and manage each production stage.",
    category: "Marketing",
    bestFor: "Marketing / Creative",
    defaultView: "list",
    color: "pink",
    sections: ["New", "In progress", "In review", "Out for approval", "Complete"],
    starterTasks: [
      { name: "Need spring collection product photos", sectionIndex: 0 },
      { name: "Create promotional video for spring collection", sectionIndex: 1 },
      { name: "Design hero image for collection landing page", sectionIndex: 1 },
      { name: "Review creative feedback", sectionIndex: 2 },
    ],
    fields: [
      { name: "Priority", type: "single_select" },
      { name: "Category", type: "single_select" },
    ],
    features: ["Custom fields", "Rules", "Workflow builder"],
    previewType: "board",
  },
  {
    id: "campaign-management",
    name: "Campaign management",
    description: "Plan milestones, assign tasks, and manage approvals to keep work on track from brief to launch.",
    category: "Marketing",
    bestFor: "Marketing",
    defaultView: "timeline",
    color: "teal",
    sections: ["Paid media", "Webinar", "Creative", "Launch", "Reporting"],
    starterTasks: [
      { name: "LinkedIn ads campaign", sectionIndex: 0 },
      { name: "Global developers webinar", sectionIndex: 1 },
      { name: "Future of workplace design webinar", sectionIndex: 1 },
      { name: "Campaign brief approval", sectionIndex: 2 },
      { name: "Q1 launch", sectionIndex: 3 },
    ],
    fields: [
      { name: "Priority", type: "single_select" },
      { name: "Campaign stage", type: "single_select" },
    ],
    features: ["Custom fields", "Timeline", "Dashboards"],
    previewType: "timeline",
  },
  {
    id: "kanban-board",
    name: "Kanban board",
    description: "Track responsibility and progress of critical work in boards to hit your deadlines.",
    category: "Productivity",
    bestFor: "Product / Development",
    defaultView: "board",
    color: "indigo",
    sections: ["Backlog", "To do", "In progress", "Archived"],
    starterTasks: [
      { name: "Collect user stories and technical debt in one queue", sectionIndex: 0 },
      { name: "Plan sprint-ready stories with clear estimates", sectionIndex: 1 },
      { name: "Track bugs as they move forward", sectionIndex: 2 },
    ],
    fields: [{ name: "Priority", type: "single_select" }],
    features: ["Custom fields", "Rules", "Workflow builder"],
    previewType: "board",
  },
]

export const categories = [
  "For you",
  "My organization",
  "Marketing",
  "Operations & PMO",
  "Productivity",
  "More",
] as const
