ALTER TABLE "feedback" ADD COLUMN "activityLogId" TEXT;
CREATE INDEX "feedback_activityLogId_idx" ON "feedback"("activityLogId");
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_activityLogId_fkey"
FOREIGN KEY ("activityLogId") REFERENCES "activity_log"("id") ON DELETE SET NULL ON UPDATE CASCADE;
