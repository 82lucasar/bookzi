import { config } from "dotenv"
config({ path: "../../.env.local" })
config({ path: "../../apps/web/.env.local" })

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

const stmts = [
  `CREATE TABLE IF NOT EXISTS "reviews" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "appointment_id" uuid NOT NULL,
    "business_id" uuid NOT NULL,
    "client_id" uuid NOT NULL,
    "token" varchar(64) NOT NULL,
    "rating" integer,
    "comment" text,
    "submitted_at" timestamp with time zone,
    "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "reviews_token_unique" UNIQUE("token")
  )`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_appointment_id_appointments_id_fk') THEN
      ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appointment_id_appointments_id_fk"
        FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id");
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_business_id_businesses_id_fk') THEN
      ALTER TABLE "reviews" ADD CONSTRAINT "reviews_business_id_businesses_id_fk"
        FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id");
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_client_id_clients_id_fk') THEN
      ALTER TABLE "reviews" ADD CONSTRAINT "reviews_client_id_clients_id_fk"
        FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");
    END IF;
  END $$`,
]

for (const stmt of stmts) {
  await sql(stmt)
  process.stdout.write(".")
}
console.log("\n✅ Tabla reviews creada correctamente")
