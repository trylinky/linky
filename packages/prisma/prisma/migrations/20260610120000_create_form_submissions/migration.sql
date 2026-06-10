-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pageId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "fieldsSnapshot" JSONB NOT NULL,
    "visitorIp" TEXT,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormSubmission_blockId_createdAt_idx" ON "FormSubmission"("blockId", "createdAt");

-- CreateIndex
CREATE INDEX "FormSubmission_blockId_visitorIp_createdAt_idx" ON "FormSubmission"("blockId", "visitorIp", "createdAt");

-- CreateIndex
CREATE INDEX "FormSubmission_pageId_blockId_createdAt_idx" ON "FormSubmission"("pageId", "blockId", "createdAt");

-- AddForeignKey
-- blockId is deliberately NOT a foreign key: submissions must survive block
-- deletion (orphaned responses stay viewable via their fieldsSnapshot).
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
