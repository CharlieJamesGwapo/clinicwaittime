-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "priorityType" TEXT NOT NULL DEFAULT 'NONE',
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" DATETIME,
    "servedAt" DATETIME,
    "completedAt" DATETIME
);
INSERT INTO "new_Ticket" ("calledAt", "completedAt", "createdAt", "id", "number", "patientName", "phone", "priorityType", "servedAt", "status") SELECT "calledAt", "completedAt", "createdAt", "id", "number", "patientName", "phone", "priorityType", "servedAt", "status" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE UNIQUE INDEX "Ticket_number_key" ON "Ticket"("number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
