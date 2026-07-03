CREATE TYPE "public"."event_type" AS ENUM('association', 'business');--> statement-breakpoint
CREATE TYPE "public"."participation_status" AS ENUM('pending', 'approved', 'waitlisted', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."participation_type" AS ENUM('vendor', 'food_vendor', 'band', 'sponsor');--> statement-breakpoint
CREATE TYPE "public"."role_scope" AS ENUM('global', 'company', 'event');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(140),
	"name" varchar(200) NOT NULL,
	"tagline" text,
	"description" text,
	"hours" text,
	"website" text,
	"phone" varchar(40),
	"address_line" text,
	"logo_media_id" integer,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "company_kind_assignments" (
	"company_id" integer NOT NULL,
	"kind_id" integer NOT NULL,
	CONSTRAINT "company_kind_assignments_company_id_kind_id_pk" PRIMARY KEY("company_id","kind_id")
);
--> statement-breakpoint
CREATE TABLE "company_kinds" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(64) NOT NULL,
	"label" varchar(128) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	CONSTRAINT "company_kinds_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "company_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"title" varchar(120),
	"is_primary_contact" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" integer,
	"name" varchar(200) NOT NULL,
	"email" varchar(320) NOT NULL,
	"subject" varchar(300),
	"message" text NOT NULL,
	"email_status" varchar(16) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"person_id" integer,
	"name" varchar(200),
	"role" varchar(120),
	"phone" varchar(40),
	"email" varchar(320),
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_info_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"key" varchar(64) NOT NULL,
	"title" varchar(200),
	"body" text,
	"media_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_participations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"company_id" integer,
	"person_id" integer,
	"type" "participation_type" NOT NULL,
	"status" "participation_status" DEFAULT 'pending' NOT NULL,
	"booth_number" varchar(40),
	"permit_doc_key" text,
	"insurance_doc_key" text,
	"permit_verified" boolean DEFAULT false NOT NULL,
	"insurance_verified" boolean DEFAULT false NOT NULL,
	"fee_amount_cents" integer,
	"payment_status" varchar(32),
	"application_data" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_schedule_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"title" varchar(200) NOT NULL,
	"location" text,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_shift_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"shift_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"role" varchar(120),
	"needed_count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(140) NOT NULL,
	"title" varchar(200) NOT NULL,
	"type" "event_type" DEFAULT 'association' NOT NULL,
	"owner_company_id" integer,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"location" text,
	"description" text,
	"hero_media_id" integer,
	"published" boolean DEFAULT false NOT NULL,
	"vendor_apps_open" boolean DEFAULT false NOT NULL,
	"food_apps_open" boolean DEFAULT false NOT NULL,
	"band_apps_open" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"r2_key" text NOT NULL,
	"filename" varchar(300),
	"content_type" varchar(128),
	"size_bytes" integer,
	"width" integer,
	"height" integer,
	"alt_text" text,
	"title" varchar(300),
	"collection" varchar(64) DEFAULT 'general' NOT NULL,
	"uploaded_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_r2_key_unique" UNIQUE("r2_key")
);
--> statement-breakpoint
CREATE TABLE "media_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer NOT NULL,
	"target_type" varchar(48) NOT NULL,
	"target_id" integer,
	"purpose" varchar(48) DEFAULT 'gallery' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"first_name" varchar(120),
	"last_name" varchar(120),
	"email" varchar(320),
	"phone" varchar(40),
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"scope" "role_scope" DEFAULT 'global' NOT NULL,
	"scope_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(64) NOT NULL,
	"label" varchar(128) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_logo_media_id_media_id_fk" FOREIGN KEY ("logo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_kind_assignments" ADD CONSTRAINT "company_kind_assignments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_kind_assignments" ADD CONSTRAINT "company_kind_assignments_kind_id_company_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."company_kinds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD CONSTRAINT "contact_submissions_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_contacts" ADD CONSTRAINT "event_contacts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_contacts" ADD CONSTRAINT "event_contacts_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_info_sections" ADD CONSTRAINT "event_info_sections_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_info_sections" ADD CONSTRAINT "event_info_sections_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_schedule_items" ADD CONSTRAINT "event_schedule_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_shift_assignments" ADD CONSTRAINT "event_shift_assignments_shift_id_event_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."event_shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_shift_assignments" ADD CONSTRAINT "event_shift_assignments_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_shifts" ADD CONSTRAINT "event_shifts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_owner_company_id_companies_id_fk" FOREIGN KEY ("owner_company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_attachments" ADD CONSTRAINT "media_attachments_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "company_membership_uq" ON "company_memberships" USING btree ("person_id","company_id");--> statement-breakpoint
CREATE INDEX "event_participations_event_idx" ON "event_participations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_participations_status_idx" ON "event_participations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "event_shift_assignment_uq" ON "event_shift_assignments" USING btree ("shift_id","person_id");--> statement-breakpoint
CREATE INDEX "media_collection_idx" ON "media" USING btree ("collection");--> statement-breakpoint
CREATE INDEX "media_attachments_target_idx" ON "media_attachments" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "media_attachments_media_idx" ON "media_attachments" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "people_email_idx" ON "people" USING btree ("email");--> statement-breakpoint
CREATE INDEX "people_user_idx" ON "people" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "role_assignments_person_idx" ON "role_assignments" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "role_assignments_scope_idx" ON "role_assignments" USING btree ("scope","scope_id");