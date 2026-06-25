ALTER TABLE "threads" ADD COLUMN "langue_origine" text DEFAULT 'fr' NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "traduit" boolean DEFAULT false NOT NULL;