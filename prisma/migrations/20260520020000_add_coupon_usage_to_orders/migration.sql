ALTER TABLE "orders"
ADD COLUMN "coupon_code" TEXT,
ADD COLUMN "coupon_discount" DECIMAL(10, 2);

CREATE INDEX "orders_coupon_code_idx" ON "orders"("coupon_code");
