CREATE TYPE "public"."consultation_type" AS ENUM('probleme', 'piste');--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "consultation_type" NOT NULL,
	"ref_id" uuid NOT NULL,
	"titre" text NOT NULL,
	"href" text NOT NULL,
	"vu_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consultations_user_id_type_ref_id_unique" UNIQUE("user_id","type","ref_id")
);
--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;