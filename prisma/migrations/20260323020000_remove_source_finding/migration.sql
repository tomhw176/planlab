-- DropForeignKey
ALTER TABLE "CandidateSource" DROP CONSTRAINT IF EXISTS "CandidateSource_sourceBankId_fkey";
ALTER TABLE "SourceBank" DROP CONSTRAINT IF EXISTS "SourceBank_lessonId_fkey";

-- DropTable
DROP TABLE IF EXISTS "CandidateSource";
DROP TABLE IF EXISTS "SourceBank";
