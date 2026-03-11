/*
  Warnings:

  - Made the column `categoryId` on table `Budget` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Budget" ALTER COLUMN "categoryId" SET NOT NULL;
