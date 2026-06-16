-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "plots" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "areaAcres" DOUBLE PRECISION,
    "primarySpecies" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" UUID NOT NULL,
    "plotId" UUID NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "treeCount" INTEGER,
    "densityPerAcre" DOUBLE PRECISION,
    "canopyCoveragePct" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION,
    "speciesGuess" TEXT,
    "healthBreakdown" JSONB,
    "observations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceImageKey" TEXT,
    "sourceImageUrl" TEXT,
    "overlayImageUrl" TEXT,
    "providerRequestId" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plots_createdAt_idx" ON "plots"("createdAt");

-- CreateIndex
CREATE INDEX "analyses_plotId_createdAt_idx" ON "analyses"("plotId", "createdAt");

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
