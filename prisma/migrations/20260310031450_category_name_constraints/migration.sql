/*
  Warnings:

  - You are about to alter the column `name` on the `Category` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(64)`.

*/
-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "name" SET DATA TYPE VARCHAR(64);

ALTER TABLE "Category"
  ADD CONSTRAINT "category_name_not_blank_check"
  CHECK (char_length(btrim("name")) BETWEEN 1 and 64);

