-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DrawRound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_DrawRound" ("createdAt", "date", "description", "id", "isActive", "isCompleted", "name", "updatedAt") SELECT "createdAt", "date", "description", "id", "isActive", "isCompleted", "name", "updatedAt" FROM "DrawRound";
DROP TABLE "DrawRound";
ALTER TABLE "new_DrawRound" RENAME TO "DrawRound";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
