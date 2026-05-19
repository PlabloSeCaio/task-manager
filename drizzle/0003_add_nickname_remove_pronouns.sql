ALTER TABLE "user_settings" ADD COLUMN "nickname" text;--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "pronouns";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "name_pronunciation";
