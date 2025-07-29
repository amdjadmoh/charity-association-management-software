CREATE TYPE "public"."day" AS ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'teacher');--> statement-breakpoint
CREATE TYPE "public"."seance_type" AS ENUM('cours', 'td', 'tp');--> statement-breakpoint
CREATE TYPE "public"."semester" AS ENUM('S1', 'S2');--> statement-breakpoint
CREATE TABLE "Absence" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"seanceId" integer NOT NULL,
	"teacherId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"startDate" date NOT NULL,
	"finishDate" date,
	"teacherId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Promotion" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"specialityId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"semester" "semester" NOT NULL,
	"promotionId" integer NOT NULL,
	"educationalYear" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ScheduleSession" (
	"id" serial PRIMARY KEY NOT NULL,
	"scheduleId" integer NOT NULL,
	"startDate" date NOT NULL,
	"finishDate" date
);
--> statement-breakpoint
CREATE TABLE "Seance" (
	"id" serial PRIMARY KEY NOT NULL,
	"day" "day" NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"location" varchar(50) NOT NULL,
	"type" "seance_type" NOT NULL,
	"module" varchar(100) NOT NULL,
	"group" integer NOT NULL,
	"teacherId" integer NOT NULL,
	"scheduleId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SeanceTypeCoefficient" (
	"seance_type" varchar(10) PRIMARY KEY NOT NULL,
	"value" double precision DEFAULT 1 NOT NULL,
	CONSTRAINT "seance_type_check" CHECK ("SeanceTypeCoefficient"."seance_type" IN ('cours', 'td', 'tp'))
);
--> statement-breakpoint
CREATE TABLE "Speciality" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Teacher" (
	"id" integer PRIMARY KEY NOT NULL,
	"gradeId" integer NOT NULL,
	"charge" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "HeureSup" (
	"id" serial PRIMARY KEY NOT NULL,
	"scheduleSessionId" integer NOT NULL,
	"duration" double precision NOT NULL,
	"seanceId" integer NOT NULL,
	"teacherId" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" DROP CONSTRAINT "User_gradeId_Grade_id_fk";
--> statement-breakpoint
ALTER TABLE "Grade" ALTER COLUMN "GradeName" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_seanceId_Seance_id_fk" FOREIGN KEY ("seanceId") REFERENCES "public"."Seance"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_teacherId_Teacher_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_teacherId_Teacher_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_specialityId_Speciality_id_fk" FOREIGN KEY ("specialityId") REFERENCES "public"."Speciality"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_promotionId_Promotion_id_fk" FOREIGN KEY ("promotionId") REFERENCES "public"."Promotion"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ScheduleSession" ADD CONSTRAINT "ScheduleSession_scheduleId_Schedule_id_fk" FOREIGN KEY ("scheduleId") REFERENCES "public"."Schedule"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_teacherId_Teacher_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_scheduleId_Schedule_id_fk" FOREIGN KEY ("scheduleId") REFERENCES "public"."Schedule"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_id_User_id_fk" FOREIGN KEY ("id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_gradeId_Grade_id_fk" FOREIGN KEY ("gradeId") REFERENCES "public"."Grade"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "HeureSup" ADD CONSTRAINT "HeureSup_scheduleSessionId_ScheduleSession_id_fk" FOREIGN KEY ("scheduleSessionId") REFERENCES "public"."ScheduleSession"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "HeureSup" ADD CONSTRAINT "HeureSup_seanceId_Seance_id_fk" FOREIGN KEY ("seanceId") REFERENCES "public"."Seance"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "HeureSup" ADD CONSTRAINT "HeureSup_teacherId_Teacher_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "gradeId";