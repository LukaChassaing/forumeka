CREATE TABLE "crawl_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"requested_max" integer NOT NULL,
	"threads_processed" integer DEFAULT 0 NOT NULL,
	"problemes_created" integer DEFAULT 0 NOT NULL,
	"pistes_created" integer DEFAULT 0 NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crawl_queue" ADD COLUMN "input_tokens" integer;--> statement-breakpoint
ALTER TABLE "crawl_queue" ADD COLUMN "output_tokens" integer;--> statement-breakpoint
ALTER TABLE "crawl_queue" ADD COLUMN "batch_id" uuid;--> statement-breakpoint
ALTER TABLE "crawl_queue" ADD CONSTRAINT "crawl_queue_batch_id_crawl_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."crawl_batches"("id") ON DELETE no action ON UPDATE no action;