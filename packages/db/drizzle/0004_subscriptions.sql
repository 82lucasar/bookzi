CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "plan" varchar(20) NOT NULL DEFAULT 'free',
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "mp_subscription_id" varchar(255),
  "mp_plan_id" varchar(255),
  "current_period_end" timestamp with time zone,
  "trial_ends_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_business_id_businesses_id_fk'
  ) THEN
    ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_business_id_businesses_id_fk"
      FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_business_id_unique" ON "subscriptions" ("business_id");
