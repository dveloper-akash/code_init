/*
  Warnings:

  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Job";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "providerId" TEXT,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "languages" JSONB,
    "maxTimeout" INTEGER,
    "labels" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME
);
INSERT INTO "new_providers" ("createdAt", "id", "labels", "languages", "lastSeenAt", "maxTimeout", "name", "revoked") SELECT "createdAt", "id", "labels", "languages", "lastSeenAt", "maxTimeout", "name", "revoked" FROM "providers";
DROP TABLE "providers";
ALTER TABLE "new_providers" RENAME TO "providers";
CREATE UNIQUE INDEX "providers_providerId_key" ON "providers"("providerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
