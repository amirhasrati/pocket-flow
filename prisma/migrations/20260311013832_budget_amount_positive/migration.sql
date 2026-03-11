ALTER TABLE "Budget"
  ADD CONSTRAINT "budget_amount_positive_check"
  CHECK ("amount" > 0);
