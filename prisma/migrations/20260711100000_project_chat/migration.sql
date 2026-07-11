CREATE TABLE "project_chat_message" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_chat_message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_chat_message_projectId_createdAt_idx"
ON "project_chat_message"("projectId", "createdAt");

CREATE INDEX "project_chat_message_authorId_idx"
ON "project_chat_message"("authorId");

ALTER TABLE "project_chat_message"
ADD CONSTRAINT "project_chat_message_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_chat_message"
ADD CONSTRAINT "project_chat_message_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
