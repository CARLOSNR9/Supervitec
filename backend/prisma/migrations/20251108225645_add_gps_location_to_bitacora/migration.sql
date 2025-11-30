/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Bitacora` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Bitacora` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bitacora" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "latitud" DOUBLE PRECISION,
ADD COLUMN     "longitud" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Bitacora_latitud_idx" ON "Bitacora"("latitud");

-- CreateIndex
CREATE INDEX "Bitacora_longitud_idx" ON "Bitacora"("longitud");
