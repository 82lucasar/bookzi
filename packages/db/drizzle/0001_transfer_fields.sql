ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "transfer_alias" varchar(100);--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "transfer_cbu" varchar(22);--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "transfer_titular" varchar(255);
