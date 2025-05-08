/*
  Warnings:

  - A unique constraint covering the columns `[roundId,code]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Participant_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "Participant_roundId_code_key" ON "Participant"("roundId", "code");
