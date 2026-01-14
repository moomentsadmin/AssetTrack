CREATE TYPE "public"."asset_status" AS ENUM('available', 'assigned', 'in_maintenance', 'retired', 'lost', 'disposed');--> statement-breakpoint
CREATE TYPE "public"."asset_type" AS ENUM('hardware', 'software', 'license', 'accessory', 'office_equipment', 'vehicle');--> statement-breakpoint
CREATE TYPE "public"."depreciation_method" AS ENUM('straight_line', 'declining_balance');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'employee');--> statement-breakpoint
CREATE TABLE "asset_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"returned_at" timestamp,
	"expected_return_date" timestamp,
	"assigned_by" varchar NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "asset_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"asset_type_id" varchar NOT NULL,
	"status" "asset_status" DEFAULT 'available' NOT NULL,
	"serial_number" text,
	"model" text,
	"manufacturer" text,
	"purchase_date" timestamp,
	"purchase_cost" numeric(10, 2),
	"warranty_expiry" timestamp,
	"condition" text,
	"photo_url" text,
	"location_id" varchar NOT NULL,
	"department_id" varchar,
	"custom_fields" jsonb,
	"depreciation_method" "depreciation_method",
	"depreciation_rate" numeric(5, 2),
	"current_value" numeric(10, 2),
	"asset_tag" text,
	"priority" text,
	"employee_id" text,
	"company_client" text,
	"mobile_number" text,
	"internal_mail_id" text,
	"client_mail_id" text,
	"express_service_code" text,
	"adapter_sn" text,
	"processor" text,
	"ram" text,
	"storage" text,
	"laptop_assigned_date" timestamp,
	"license" text,
	"acknowledgement_form" text,
	"old_laptop" text,
	"supplier_name" text,
	"invoice_no" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_trail" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" varchar,
	"user_id" varchar NOT NULL,
	"action" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_field_definitions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_type_id" varchar NOT NULL,
	"field_name" text NOT NULL,
	"field_type" text NOT NULL,
	"field_options" jsonb,
	"is_required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "device_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" varchar NOT NULL,
	"tracking_token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"ip_address" text,
	"hostname" text,
	"cpu_usage" numeric(5, 2),
	"memory_usage" numeric(5, 2),
	"memory_total" numeric(10, 2),
	"disk_usage" numeric(5, 2),
	"disk_total" numeric(10, 2),
	"os_info" text,
	"last_heartbeat" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_tracking_asset_id_unique" UNIQUE("asset_id"),
	CONSTRAINT "device_tracking_tracking_token_unique" UNIQUE("tracking_token")
);
--> statement-breakpoint
CREATE TABLE "device_tracking_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_tracking_id" varchar NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"ip_address" text,
	"cpu_usage" numeric(5, 2),
	"memory_usage" numeric(5, 2),
	"disk_usage" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"smtp_host" text,
	"smtp_port" integer,
	"smtp_user" text,
	"smtp_password" text,
	"sendgrid_api_key" text,
	"from_email" text NOT NULL,
	"from_name" text NOT NULL,
	"warranty_expiry_enabled" boolean DEFAULT true NOT NULL,
	"assignment_enabled" boolean DEFAULT true NOT NULL,
	"return_reminder_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "locations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setup_completed" boolean DEFAULT false NOT NULL,
	"company_name" text,
	"company_website" text,
	"company_logo" text,
	"header_text" text,
	"footer_text" text,
	"header_links" jsonb,
	"footer_links" jsonb,
	"default_currency" text DEFAULT 'USD' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"role" "user_role" DEFAULT 'employee' NOT NULL,
	"department" text,
	"is_contractor" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_notes" ADD CONSTRAINT "asset_notes_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_notes" ADD CONSTRAINT "asset_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_asset_type_id_asset_types_id_fk" FOREIGN KEY ("asset_type_id") REFERENCES "public"."asset_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_asset_type_id_asset_types_id_fk" FOREIGN KEY ("asset_type_id") REFERENCES "public"."asset_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_tracking" ADD CONSTRAINT "device_tracking_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_tracking_history" ADD CONSTRAINT "device_tracking_history_device_tracking_id_device_tracking_id_fk" FOREIGN KEY ("device_tracking_id") REFERENCES "public"."device_tracking"("id") ON DELETE cascade ON UPDATE no action;