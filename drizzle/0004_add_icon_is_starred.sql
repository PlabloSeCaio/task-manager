ALTER TABLE "projects" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_starred" boolean DEFAULT false;
