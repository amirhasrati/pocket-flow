/*
  Warnings:

  - You are about to alter the column `description` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "description" SET DATA TYPE VARCHAR(255);

-- CreateIndex
CREATE INDEX "Transaction_userId_type_date_idx" ON "Transaction"("userId", "type", "date");
