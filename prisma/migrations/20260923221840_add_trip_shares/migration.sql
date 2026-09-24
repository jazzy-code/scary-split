-- CreateTable
CREATE TABLE "trip_share" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_share_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trip_share_tokenHash_key" ON "trip_share"("tokenHash");

-- CreateIndex
CREATE INDEX "trip_share_tripId_idx" ON "trip_share"("tripId");

-- AddForeignKey
ALTER TABLE "trip_share" ADD CONSTRAINT "trip_share_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
