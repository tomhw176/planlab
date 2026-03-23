-- AlterTable
ALTER TABLE "CandidateSource" ADD COLUMN     "accessMethod" TEXT NOT NULL DEFAULT 'inferred',
ADD COLUMN     "contentPreview" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "hostSite" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "httpStatus" INTEGER,
ADD COLUMN     "pageTitle" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'unverified';
