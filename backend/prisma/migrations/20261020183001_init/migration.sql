-- CreateEnum
CREATE TYPE "Role" AS ENUM ('submitter', 'reviewer');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "textContent" TEXT,
    "filePath" TEXT,
    "originalFilename" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "status" "DocumentStatus" NOT NULL DEFAULT 'pending',
    "submitterId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "documents_submitterId_createdAt_idx" ON "documents"("submitterId", "createdAt");

-- CreateIndex
CREATE INDEX "documents_status_createdAt_idx" ON "documents"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
