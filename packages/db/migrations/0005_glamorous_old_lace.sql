CREATE TYPE "public"."crawl_status" AS ENUM('discovered', 'processing', 'ingested', 'failed', 'skipped');--> statement-breakpoint
CREATE TABLE "crawl_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_url" text NOT NULL,
	"forum" text NOT NULL,
	"sub_forum_label" text,
	"status" "crawl_status" DEFAULT 'discovered' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "crawl_queue_thread_url_unique" UNIQUE("thread_url")
);
