CREATE TABLE "discover_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"forum" text NOT NULL,
	"sub_forum_label" text NOT NULL,
	"ran_at" timestamp with time zone DEFAULT now() NOT NULL,
	"pages_scanned" integer NOT NULL,
	"threads_found" integer NOT NULL
);
