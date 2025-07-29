CREATE TABLE "Grade" (
	"id" serial PRIMARY KEY NOT NULL,
	"GradeName" "grade_name" NOT NULL,
	"PricePerHour" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" serial PRIMARY KEY NOT NULL,
	"firstName" varchar(256) NOT NULL,
	"lastName" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"password" varchar(256) NOT NULL,
	"gradeId" integer NOT NULL,
	"role" "role" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_gradeId_Grade_id_fk" FOREIGN KEY ("gradeId") REFERENCES "public"."Grade"("id") ON DELETE cascade ON UPDATE cascade;