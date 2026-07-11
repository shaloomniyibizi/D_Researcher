-- CreateEnum
CREATE TYPE "KnowledgeDocumentStatus" AS ENUM ('PENDING', 'PROCESSING', 'INDEXED', 'FAILED', 'EMPTY');

-- AlterTable
ALTER TABLE "knowledge_document" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ai_conversation" ADD COLUMN     "knowledgeDocumentId" TEXT;

-- CreateIndex
CREATE INDEX "knowledge_document_status_idx" ON "knowledge_document"("status");

-- CreateIndex
CREATE INDEX "ai_conversation_knowledgeDocumentId_idx" ON "ai_conversation"("knowledgeDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_conversation_userId_knowledgeDocumentId_key" ON "ai_conversation"("userId", "knowledgeDocumentId");

-- AddForeignKey
ALTER TABLE "ai_conversation" ADD CONSTRAINT "ai_conversation_knowledgeDocumentId_fkey" FOREIGN KEY ("knowledgeDocumentId") REFERENCES "knowledge_document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

