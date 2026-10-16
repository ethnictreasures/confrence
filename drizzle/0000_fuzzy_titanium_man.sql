CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'admin',
	"is_active" boolean DEFAULT true,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid,
	"registration_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"reason" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conference_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "conference_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "payment_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"razorpay_refund_id" varchar(255) NOT NULL,
	"amount_paise" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"webhook_event_id" varchar(255) NOT NULL,
	"raw_event" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_refunds_razorpay_refund_id_unique" UNIQUE("razorpay_refund_id"),
	CONSTRAINT "payment_refunds_webhook_event_id_unique" UNIQUE("webhook_event_id")
);
--> statement-breakpoint
CREATE TABLE "payment_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payment_link_id" varchar(255),
	"razorpay_payment_id" varchar(255),
	"amount_paise" integer,
	"currency" varchar(3),
	"payer_email" varchar(255),
	"payer_phone" varchar(30),
	"registration_id" uuid,
	"reconciliation_status" varchar(30) DEFAULT 'unresolved' NOT NULL,
	"reconciliation_reason" text,
	"reconciled_by" uuid,
	"reconciled_at" timestamp,
	"raw_event" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_webhook_events_webhook_event_id_unique" UNIQUE("webhook_event_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"provider" varchar(50) DEFAULT 'razorpay' NOT NULL,
	"payment_link_id" varchar(255),
	"razorpay_payment_id" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"amount_paise" integer,
	"currency" varchar(3) DEFAULT 'INR',
	"payment_status" varchar(50) NOT NULL,
	"refunded_amount_paise" integer DEFAULT 0 NOT NULL,
	"webhook_event_id" varchar(255),
	"raw_webhook_data" jsonb,
	"payment_created_at" timestamp,
	"payment_completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payments_razorpay_payment_id_unique" UNIQUE("razorpay_payment_id"),
	CONSTRAINT "payments_webhook_event_id_unique" UNIQUE("webhook_event_id")
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_number" varchar(20) NOT NULL,
	"registration_type" varchar(50) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"country" varchar(100),
	"state" varchar(100),
	"college_name" varchar(255),
	"degree_program" varchar(255),
	"department" varchar(255),
	"current_year" varchar(50),
	"expected_graduation_year" integer,
	"job_title" varchar(255),
	"company_name" varchar(255),
	"industry_type" varchar(100),
	"years_of_experience" integer,
	"participant_category" varchar(100),
	"occupation" varchar(255),
	"organization_name" varchar(255),
	"purpose_of_attending" text,
	"document_object_key" varchar(500),
	"document_original_name" varchar(255),
	"document_mime_type" varchar(100),
	"document_size" integer,
	"verification_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"payment_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"payment_amount" numeric(10, 2),
	"base_fee_paise" integer,
	"gst_rate" numeric(5, 2),
	"gst_amount_paise" integer,
	"total_amount_paise" integer,
	"currency" varchar(3) DEFAULT 'INR',
	"payment_link_id" varchar(255),
	"razorpay_payment_id" varchar(255),
	"payment_reconciliation_status" varchar(30) DEFAULT 'pending' NOT NULL,
	"amount_paid_paise" integer DEFAULT 0 NOT NULL,
	"payment_completed_at" timestamp,
	"additional_info" text,
	"consent_privacy" boolean DEFAULT false NOT NULL,
	"consent_terms" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "registrations_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_settings" ADD CONSTRAINT "conference_settings_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_reconciled_by_admins_id_fk" FOREIGN KEY ("reconciled_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admins_email" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_admin_id" ON "audit_logs" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_registration_id" ON "audit_logs" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_conference_settings_key" ON "conference_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_payment_refunds_payment_id" ON "payment_refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_payment_webhook_events_payment_id" ON "payment_webhook_events" USING btree ("razorpay_payment_id");--> statement-breakpoint
CREATE INDEX "idx_payment_webhook_events_reconciliation_status" ON "payment_webhook_events" USING btree ("reconciliation_status");--> statement-breakpoint
CREATE INDEX "idx_payment_webhook_events_registration_id" ON "payment_webhook_events" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "idx_payments_registration_id" ON "payments" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "idx_payments_razorpay_payment_id" ON "payments" USING btree ("razorpay_payment_id");--> statement-breakpoint
CREATE INDEX "idx_payments_webhook_event_id" ON "payments" USING btree ("webhook_event_id");--> statement-breakpoint
CREATE INDEX "idx_payments_payment_status" ON "payments" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_registrations_email" ON "registrations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_registrations_phone" ON "registrations" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_registrations_type" ON "registrations" USING btree ("registration_type");--> statement-breakpoint
CREATE INDEX "idx_registrations_verification_status" ON "registrations" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "idx_registrations_payment_status" ON "registrations" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_registrations_created_at" ON "registrations" USING btree ("created_at");