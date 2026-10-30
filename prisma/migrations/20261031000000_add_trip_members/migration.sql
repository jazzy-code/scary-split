-- CreateEnum
CREATE TYPE "TripMemberRole" AS ENUM ('OWNER', 'MEMBER');

-- AlterTable
ALTER TABLE "person" ADD COLUMN     "email" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "settlement_payment" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "trip_member" ADD COLUMN     "role" "TripMemberRole" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "person_invite" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_invite_tokenHash_key" ON "person_invite"("tokenHash");

-- CreateIndex
CREATE INDEX "person_invite_personId_idx" ON "person_invite"("personId");

-- CreateIndex
CREATE INDEX "person_userId_idx" ON "person"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "person_tripId_userId_key" ON "person"("tripId", "userId");

-- CreateIndex
CREATE INDEX "settlement_payment_createdById_idx" ON "settlement_payment"("createdById");

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_payment" ADD CONSTRAINT "settlement_payment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_invite" ADD CONSTRAINT "person_invite_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Los miembros existentes son quienes crearon su sustito
UPDATE "trip_member" SET "role" = 'OWNER';
