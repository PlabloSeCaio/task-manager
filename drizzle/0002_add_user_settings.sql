CREATE TABLE "user_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL,
  "pronouns" text,
  "name_pronunciation" text,
  "job_title" text,
  "department" text,
  "about" text,
  "personalization" jsonb DEFAULT '{}',
  "show_certifications" boolean DEFAULT false,
  "out_of_office" jsonb DEFAULT '{}',
  "notifications" jsonb DEFAULT '{}',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_external_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("external_id") ON DELETE cascade;
