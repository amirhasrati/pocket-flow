-- Add query-performance indexes
CREATE INDEX IF NOT EXISTS "Transaction_userId_date_idx" ON "Transaction"("userId", "date");
CREATE INDEX IF NOT EXISTS "Transaction_userId_categoryId_idx" ON "Transaction"("userId", "categoryId");
CREATE INDEX IF NOT EXISTS "Budget_userId_year_month_idx" ON "Budget"("userId", "year", "month");
CREATE INDEX IF NOT EXISTS "Budget_userId_categoryId_idx" ON "Budget"("userId", "categoryId");

-- Keep budget years in an expected range
ALTER TABLE "Budget"
ADD CONSTRAINT "budget_year_range_check"
CHECK ("year" BETWEEN 2000 AND 2100);
