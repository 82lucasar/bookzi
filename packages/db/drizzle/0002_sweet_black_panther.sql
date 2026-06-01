CREATE TABLE IF NOT EXISTS "availability_services" (
	"availability_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "availability_services_availability_id_service_id_pk" PRIMARY KEY("availability_id","service_id")
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "transfer_alias" varchar(100);--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "transfer_cbu" varchar(22);--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "transfer_titular" varchar(255);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "max_per_day" integer;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'availability_services_availability_id_availability_id_fk'
  ) THEN
    ALTER TABLE "availability_services" ADD CONSTRAINT "availability_services_availability_id_availability_id_fk"
      FOREIGN KEY ("availability_id") REFERENCES "public"."availability"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'availability_services_service_id_services_id_fk'
  ) THEN
    ALTER TABLE "availability_services" ADD CONSTRAINT "availability_services_service_id_services_id_fk"
      FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
