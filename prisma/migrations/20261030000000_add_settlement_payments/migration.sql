-- CreateTable
CREATE TABLE "settlement_payment" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "fromPersonId" TEXT NOT NULL,
    "toPersonId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlement_payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "settlement_payment_tripId_idx" ON "settlement_payment"("tripId");

-- CreateIndex
CREATE INDEX "settlement_payment_fromPersonId_idx" ON "settlement_payment"("fromPersonId");

-- CreateIndex
CREATE INDEX "settlement_payment_toPersonId_idx" ON "settlement_payment"("toPersonId");

-- AddForeignKey
ALTER TABLE "settlement_payment" ADD CONSTRAINT "settlement_payment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_payment" ADD CONSTRAINT "settlement_payment_fromPersonId_fkey" FOREIGN KEY ("fromPersonId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_payment" ADD CONSTRAINT "settlement_payment_toPersonId_fkey" FOREIGN KEY ("toPersonId") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

