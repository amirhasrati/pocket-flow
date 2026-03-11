ALTER TABLE "Transaction"
  ADD CONSTRAINT "transaction_amount_positive_check"
  CHECK ("amount" > 0);
