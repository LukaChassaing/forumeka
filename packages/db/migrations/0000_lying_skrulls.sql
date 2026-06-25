CREATE TYPE "public"."satisfaction" AS ENUM('found', 'partial', 'none');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('human', 'llm', 'user_contribution');--> statement-breakpoint
CREATE TYPE "public"."statut_dans_thread" AS ENUM('confirmed', 'tested_neutral', 'tested_negative', 'mentioned');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('worked', 'failed', 'partial');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"user_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmarks_user_id_thread_id_pk" PRIMARY KEY("user_id","thread_id")
);
--> statement-breakpoint
CREATE TABLE "commentaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid,
	"piste_id" uuid,
	"user_id" uuid NOT NULL,
	"contenu" text NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_vector" "tsvector"
);
--> statement-breakpoint
CREATE TABLE "piste_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"piste_id" uuid NOT NULL,
	"alias" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "piste_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"piste_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"probleme_id" uuid NOT NULL,
	"verdict" "verdict" NOT NULL,
	"vehicule_user" text,
	"commentaire_court" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "piste_ratings_piste_id_user_id_probleme_id_unique" UNIQUE("piste_id","user_id","probleme_id")
);
--> statement-breakpoint
CREATE TABLE "pistes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"probleme_id" uuid NOT NULL,
	"titre" text NOT NULL,
	"description" text,
	"cout_estime_eur" "numrange",
	"difficulte" integer,
	"embedding" vector(512),
	"metadata" jsonb,
	"source_type" "source_type" DEFAULT 'llm' NOT NULL,
	"source_model" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "problemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titre" text NOT NULL,
	"description" text,
	"vehicules" jsonb NOT NULL,
	"symptomes" text[] NOT NULL,
	"embedding" vector(512),
	"search_vector" "tsvector",
	"metadata" jsonb,
	"source_type" "source_type" DEFAULT 'llm' NOT NULL,
	"source_model" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "search_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"query" text NOT NULL,
	"query_embedding" vector(512),
	"results_count" integer DEFAULT 0 NOT NULL,
	"clicked_thread_id" uuid,
	"satisfaction" "satisfaction",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread_piste_mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"piste_id" uuid NOT NULL,
	"statut_dans_thread" "statut_dans_thread" NOT NULL,
	"extrait" text,
	"confidence" real NOT NULL,
	CONSTRAINT "thread_piste_mentions_thread_id_piste_id_unique" UNIQUE("thread_id","piste_id")
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"forum" text NOT NULL,
	"titre" text NOT NULL,
	"date_thread" date,
	"nb_pages" integer NOT NULL,
	"resolved_in_thread" boolean DEFAULT false NOT NULL,
	"cause_finale_id" uuid,
	"raw_content_compressed" "bytea",
	"metadata" jsonb,
	"indexed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "threads_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commentaires" ADD CONSTRAINT "commentaires_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commentaires" ADD CONSTRAINT "commentaires_piste_id_pistes_id_fk" FOREIGN KEY ("piste_id") REFERENCES "public"."pistes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commentaires" ADD CONSTRAINT "commentaires_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "piste_aliases" ADD CONSTRAINT "piste_aliases_piste_id_pistes_id_fk" FOREIGN KEY ("piste_id") REFERENCES "public"."pistes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "piste_ratings" ADD CONSTRAINT "piste_ratings_piste_id_pistes_id_fk" FOREIGN KEY ("piste_id") REFERENCES "public"."pistes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "piste_ratings" ADD CONSTRAINT "piste_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "piste_ratings" ADD CONSTRAINT "piste_ratings_probleme_id_problemes_id_fk" FOREIGN KEY ("probleme_id") REFERENCES "public"."problemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pistes" ADD CONSTRAINT "pistes_probleme_id_problemes_id_fk" FOREIGN KEY ("probleme_id") REFERENCES "public"."problemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pistes" ADD CONSTRAINT "pistes_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problemes" ADD CONSTRAINT "problemes_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_log" ADD CONSTRAINT "search_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_log" ADD CONSTRAINT "search_log_clicked_thread_id_threads_id_fk" FOREIGN KEY ("clicked_thread_id") REFERENCES "public"."threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_piste_mentions" ADD CONSTRAINT "thread_piste_mentions_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_piste_mentions" ADD CONSTRAINT "thread_piste_mentions_piste_id_pistes_id_fk" FOREIGN KEY ("piste_id") REFERENCES "public"."pistes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_cause_finale_id_pistes_id_fk" FOREIGN KEY ("cause_finale_id") REFERENCES "public"."pistes"("id") ON DELETE no action ON UPDATE no action;