/*
  Warnings:

  - The `curriculumConnection` column on the `Lesson` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "courseDefaults" JSONB NOT NULL DEFAULT '{"numStudents":30,"lessonDuration":60}';

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "creationMode" TEXT NOT NULL DEFAULT 'scratch',
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "extension" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "learningTarget" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lessonPurpose" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "scaffolds" TEXT NOT NULL DEFAULT '',
DROP COLUMN "curriculumConnection",
ADD COLUMN     "curriculumConnection" JSONB NOT NULL DEFAULT '{"bigIdea":"","competencyFocus":"","contentConnection":""}';

-- AlterTable
ALTER TABLE "LessonTemplate" ADD COLUMN     "promptTemplate" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "requiredFields" JSONB NOT NULL DEFAULT '[]';
