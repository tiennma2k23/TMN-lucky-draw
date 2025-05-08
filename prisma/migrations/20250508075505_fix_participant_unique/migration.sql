-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Participant_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "DrawRound" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Participant" ("code", "createdAt", "id", "name", "phone", "roundId", "updatedAt") SELECT "code", "createdAt", "id", "name", "phone", "roundId", "updatedAt" FROM "Participant";
DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";
CREATE UNIQUE INDEX "Participant_code_key" ON "Participant"("code");
CREATE INDEX "Participant_roundId_idx" ON "Participant"("roundId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
