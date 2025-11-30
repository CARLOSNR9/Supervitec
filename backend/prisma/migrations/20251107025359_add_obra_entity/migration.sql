/*
  Warnings:

  - Added the required column `creatorId` to the `Obra` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoObra" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'FINALIZADA', 'PAUSADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "Obra" ADD COLUMN     "creatorId" INTEGER NOT NULL,
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "estado" "EstadoObra" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fechaFinPrevista" TIMESTAMP(3),
ADD COLUMN     "fechaInicio" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Obra" ADD CONSTRAINT "Obra_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
