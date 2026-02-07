-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "languages" JSONB NOT NULL,
    "maxTimeout" INTEGER NOT NULL,
    "labels" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME
);
