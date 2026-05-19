ALTER TABLE "workspaces" ADD COLUMN "clerk_organization_id" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_clerk_organization_id_unique" UNIQUE("clerk_organization_id");
