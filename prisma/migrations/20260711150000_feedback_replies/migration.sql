CREATE TABLE "feedback_reply" (
  "id" TEXT NOT NULL,
  "feedbackId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "feedback_reply_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "feedback_reply_feedbackId_createdAt_idx" ON "feedback_reply"("feedbackId", "createdAt");
CREATE INDEX "feedback_reply_authorId_idx" ON "feedback_reply"("authorId");
ALTER TABLE "feedback_reply" ADD CONSTRAINT "feedback_reply_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feedback_reply" ADD CONSTRAINT "feedback_reply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
