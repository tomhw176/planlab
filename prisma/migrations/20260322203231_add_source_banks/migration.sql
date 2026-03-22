-- CreateTable
CREATE TABLE "SourceBank" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "grade" TEXT NOT NULL DEFAULT '',
    "inquiryQuestion" TEXT NOT NULL DEFAULT '',
    "perspectives" JSONB NOT NULL DEFAULT '[]',
    "historicalThinkingSkills" TEXT NOT NULL DEFAULT '',
    "numSourcesRequested" INTEGER NOT NULL DEFAULT 6,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "recommendedSequence" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lessonId" TEXT,

    CONSTRAINT "SourceBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateSource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "sourceType" TEXT NOT NULL DEFAULT '',
    "perspectiveRole" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "bibliographicInfo" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "creator" TEXT NOT NULL DEFAULT '',
    "dateCreated" TEXT NOT NULL DEFAULT '',
    "significance" TEXT NOT NULL DEFAULT '',
    "claimsEvidence" TEXT NOT NULL DEFAULT '',
    "historicalThinkingMove" TEXT NOT NULL DEFAULT '',
    "lengthDescription" TEXT NOT NULL DEFAULT '',
    "excerptOptions" TEXT NOT NULL DEFAULT '',
    "vocabularyBarriers" TEXT NOT NULL DEFAULT '',
    "relevanceScore" INTEGER NOT NULL DEFAULT 0,
    "readabilityScore" INTEGER NOT NULL DEFAULT 0,
    "excerptabilityScore" INTEGER NOT NULL DEFAULT 0,
    "historicalThinkingScore" INTEGER NOT NULL DEFAULT 0,
    "uniquenessScore" INTEGER NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidenceLevel" TEXT NOT NULL DEFAULT 'medium',
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "sequenceOrder" INTEGER,
    "flags" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceBankId" TEXT NOT NULL,

    CONSTRAINT "CandidateSource_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SourceBank" ADD CONSTRAINT "SourceBank_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSource" ADD CONSTRAINT "CandidateSource_sourceBankId_fkey" FOREIGN KEY ("sourceBankId") REFERENCES "SourceBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
