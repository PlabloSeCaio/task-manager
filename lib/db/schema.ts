import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const projectViewEnum = pgEnum("project_view", [
  "list",
  "board",
  "calendar",
  "timeline",
]);
export const privacyEnum = pgEnum("privacy", [
  "public",
  "private_to_team",
  "private",
]);
export const accessLevelEnum = pgEnum("access_level", [
  "admin",
  "editor",
  "commenter",
  "viewer",
]);
export const taskSubtypeEnum = pgEnum("task_subtype", [
  "default",
  "milestone",
  "approval",
]);
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "changes_requested",
]);
export const customFieldTypeEnum = pgEnum("custom_field_type", [
  "text",
  "number",
  "date",
  "single_select",
  "multi_select",
]);
export const statusColorEnum = pgEnum("status_color", [
  "green",
  "yellow",
  "red",
]);

// ─── Workspaces ───────────────────────────────────────────
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  clerkOrganizationId: text("clerk_organization_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Users ────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: text("external_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Workspace Members ───────────────────────────────────
export const workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: accessLevelEnum("role").default("editor"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// ─── Teams ────────────────────────────────────────────────
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Team Members ─────────────────────────────────────────
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: accessLevelEnum("role").default("editor"),
});

// ─── Projects ─────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  teamId: uuid("team_id").references(() => teams.id),
  ownerId: uuid("owner_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("blue"),
  defaultView: projectViewEnum("default_view").default("list"),
  privacy: privacyEnum("privacy").default("private_to_team"),
  defaultAccessLevel: accessLevelEnum("default_access_level").default("editor"),
  archived: boolean("archived").default(false),
  startOn: timestamp("start_on"),
  dueOn: timestamp("due_on"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Project Members ──────────────────────────────────────
export const projectMembers = pgTable("project_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: accessLevelEnum("role").default("editor"),
});

// ─── Sections ─────────────────────────────────────────────
export const sections = pgTable("sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Tasks ────────────────────────────────────────────────
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  sectionId: uuid("section_id").references(() => sections.id, {
    onDelete: "set null",
  }),
  parentId: uuid("parent_id"),
  assigneeId: uuid("assignee_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdById: uuid("created_by_id").references(() => users.id),
  name: text("name").notNull(),
  notes: text("notes"),
  htmlNotes: text("html_notes"),
  subtype: taskSubtypeEnum("subtype").default("default"),
  approvalStatus: approvalStatusEnum("approval_status"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  startOn: timestamp("start_on"),
  dueOn: timestamp("due_on"),
  position: integer("position").notNull().default(0),
  liked: boolean("liked").default(false),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Task Followers ───────────────────────────────────────
export const taskFollowers = pgTable(
  "task_followers",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  }
);

// ─── Task Dependencies ────────────────────────────────────
export const taskDependencies = pgTable("task_dependencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  dependsOnId: uuid("depends_on_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
});

// ─── Tags ─────────────────────────────────────────────────
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("gray"),
});

// ─── Task Tags ────────────────────────────────────────────
export const taskTags = pgTable("task_tags", {
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

// ─── Comments ─────────────────────────────────────────────
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  htmlBody: text("html_body"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Attachments ──────────────────────────────────────────
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  uploadedById: uuid("uploaded_by_id").references(() => users.id),
  filename: text("filename").notNull(),
  contentType: text("content_type"),
  sizeBytes: integer("size_bytes"),
  r2Key: text("r2_key").notNull(),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Custom Field Definitions ─────────────────────────────
export const customFieldDefs = pgTable("custom_field_defs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  type: customFieldTypeEnum("type").notNull(),
  options: jsonb("options"),
  position: integer("position").default(0),
});

// ─── Custom Field Values ──────────────────────────────────
export const customFieldValues = pgTable("custom_field_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  fieldId: uuid("field_id")
    .notNull()
    .references(() => customFieldDefs.id, { onDelete: "cascade" }),
  textValue: text("text_value"),
  numberValue: integer("number_value"),
  dateValue: timestamp("date_value"),
  enumValues: jsonb("enum_values"),
});

// ─── Portfolios ───────────────────────────────────────────
export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  ownerId: uuid("owner_id").references(() => users.id),
  name: text("name").notNull(),
  color: text("color").default("blue"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Portfolio Projects ───────────────────────────────────
export const portfolioProjects = pgTable("portfolio_projects", {
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolios.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  position: integer("position").default(0),
});

// ─── Status Updates ───────────────────────────────────────
export const statusUpdates = pgTable("status_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  portfolioId: uuid("portfolio_id").references(() => portfolios.id, {
    onDelete: "cascade",
  }),
  authorId: uuid("author_id").references(() => users.id),
  color: statusColorEnum("color").default("green"),
  title: text("title"),
  body: text("body"),
  htmlBody: text("html_body"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Goals ────────────────────────────────────────────────
export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  ownerId: uuid("owner_id").references(() => users.id),
  parentGoalId: uuid("parent_goal_id"),
  name: text("name").notNull(),
  description: text("description"),
  status: statusColorEnum("status").default("green"),
  startOn: timestamp("start_on"),
  dueOn: timestamp("due_on"),
  completionPercent: integer("completion_percent").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Goal Projects ────────────────────────────────────────
export const goalProjects = pgTable("goal_projects", {
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
});

// ─── Notifications ────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  type: text("type").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Automation Rules ─────────────────────────────────────
export const automationRules = pgTable("automation_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  enabled: boolean("enabled").default(true),
  trigger: jsonb("trigger").notNull(),
  action: jsonb("action").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Relations ────────────────────────────────────────────

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  teams: many(teams),
  projects: many(projects),
  tags: many(tags),
  customFieldDefs: many(customFieldDefs),
  portfolios: many(portfolios),
  goals: many(goals),
}));

export const usersRelations = relations(users, ({ many }) => ({
  workspaceMemberships: many(workspaceMembers),
  teamMemberships: many(teamMembers),
  ownedProjects: many(projects, { relationName: "projectOwner" }),
  projectMemberships: many(projectMembers),
  assignedTasks: many(tasks, { relationName: "taskAssignee" }),
  createdTasks: many(tasks, { relationName: "taskCreator" }),
  comments: many(comments),
  attachments: many(attachments),
  notifications: many(notifications),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [teams.workspaceId],
    references: [workspaces.id],
  }),
  members: many(teamMembers),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id],
  }),
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
    relationName: "projectOwner",
  }),
  members: many(projectMembers),
  sections: many(sections),
  tasks: many(tasks),
  customFieldDefs: many(customFieldDefs),
  attachments: many(attachments),
  statusUpdates: many(statusUpdates),
  automationRules: many(automationRules),
  portfolioProjects: many(portfolioProjects),
  goalProjects: many(goalProjects),
  notifications: many(notifications),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  project: one(projects, {
    fields: [sections.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [tasks.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  section: one(sections, {
    fields: [tasks.sectionId],
    references: [sections.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: "taskAssignee",
  }),
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: "taskCreator",
  }),
  followers: many(taskFollowers),
  dependencies: many(taskDependencies, { relationName: "taskDeps" }),
  comments: many(comments),
  attachments: many(attachments),
  customFieldValues: many(customFieldValues),
  notifications: many(notifications),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [tags.workspaceId],
    references: [workspaces.id],
  }),
  taskTags: many(taskTags),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [portfolios.workspaceId],
    references: [workspaces.id],
  }),
  owner: one(users, {
    fields: [portfolios.ownerId],
    references: [users.id],
  }),
  projects: many(portfolioProjects),
  statusUpdates: many(statusUpdates),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [goals.workspaceId],
    references: [workspaces.id],
  }),
  owner: one(users, {
    fields: [goals.ownerId],
    references: [users.id],
  }),
  projects: many(goalProjects),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [notifications.taskId],
    references: [tasks.id],
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
}));
