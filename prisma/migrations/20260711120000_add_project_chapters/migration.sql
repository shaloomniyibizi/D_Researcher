ALTER TABLE "research_document"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "isChapter" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "research_document_projectId_isChapter_sortOrder_idx"
ON "research_document"("projectId", "isChapter", "sortOrder");
